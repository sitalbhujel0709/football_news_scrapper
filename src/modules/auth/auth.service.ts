import bcrypt from "bcrypt";
import { User } from "../../models/user.model";
import { Account } from "../../models/account.model";
import { addEmailJob } from "../../queue/emailQueue";
import { generateOTP } from "../../utils/otp";
import redisClient from "../../config/redis";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt";
interface registerUserDTO {
    email: string;
    name: string;
    password:    string;
}

const registerUser = async (data: registerUserDTO) => {
    try {
        const {email, name, password} = data;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error("User with this email already exists");
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const user = new User({
            email,
            name,
        });
        await user.save();

        const account = new Account({
            userId: user._id,
            provider: "local",
            passwordHash,
        });
        await account.save();
        const otp = generateOTP();
        await redisClient.set(`otp:${email}`,otp ,{EX: 600});
        await addEmailJob({
            to: email,
            subject: "Welcome to our platform",
            html: `<h1>Welcome ${user.name}</h1><p>Thanks for registering. Please verify your email.</p><div>${otp}</div>`
        });
        return user;
    } catch (error) {
        throw error;
    }
}

//verify email by otp

const verifyEmail = async (data:{email: string, otp: string}) => {
    try {
        const {email, otp} = data;
        const storedOtp = await redisClient.get(`otp:${email}`);
        if(!storedOtp || storedOtp !== otp){
            throw new Error("Invalid or expired OTP");
        }
        await redisClient.del(`otp:${email}`);
        await User.findOneAndUpdate({email}, {isEmailVerified: true});
        return {message: "Email verified successfully"};
    } catch (error) {
        throw error
    }

}

// login user

const loginUser = async (data:{email: string, password: string}) => {
    const {email, password} = data;
    try {
        const result = await User.aggregate([
            { $match: { email } },
            {
                $lookup: {
                    from: "accounts",
                    localField: "_id",
                    foreignField: "userId",
                    as: "accountDetails"
                }
            },
            { $unwind: "$accountDetails" }
        ]);

        if (!result || result.length === 0) {
            throw new Error("Invalid Credentials");
        }

        const user = result[0];
        const passwordHash = user.accountDetails.passwordHash;

        if (!passwordHash) {
            throw new Error("Invalid Credentials");
        }

        const isMatch = await bcrypt.compare(password, passwordHash);
        if (!isMatch) {
            throw new Error("Invalid Credentials");
        }

        const accessToken = await generateAccessToken({ userId: user._id.toString() });
        const refreshToken = await generateRefreshToken({ userId: user._id.toString() });

        const refreshHash = await bcrypt.hash(refreshToken, 10);
        const sessionId = crypto.randomUUID()

        await redisClient.set(`session:${sessionId}`, JSON.stringify({
            userId: user._id,
            refreshHash
        }), {
            EX: 7 * 24 * 60 * 60
        });

        await redisClient.sAdd(`user_sessions:${user._id.toString()}`, sessionId);

        return { 
            user: { id: user._id, email: user.email, name: user.name, isEmailVerified: user.isEmailVerified }, 
            accessToken, 
            refreshToken,
            sessionId 
        };
        
    } catch (error) {
        throw error;
    }
}

// refresh AccessToken
const refreshAccessToken = async (token: string) => {
    try {
        const [sessionId, refreshToken] = token.split("|");
        const payload = await verifyRefreshToken(refreshToken);
        
        const storedToken = await redisClient.get(`session:${sessionId}`);
        if (!storedToken) {
            throw new Error("Invalid or expired refresh token session");
        }
        const session = JSON.parse(storedToken);
        const isMatch = await bcrypt.compare(refreshToken, session.refreshHash);
        if (!isMatch) {
            throw new Error("Invalid or expired refresh token");
        }

        const user = await User.findById(payload.userId);
        if (!user) {
            throw new Error("User not found");
        }
        
        const newAccessToken = await generateAccessToken({ userId: user._id.toString() });
        const newRefreshToken = await generateRefreshToken({ userId: user._id.toString() });

        const refreshHash = await bcrypt.hash(newRefreshToken,10);
        const newSessionId = crypto.randomUUID();

        await redisClient.del(`session:${sessionId}`);
        await redisClient.set(`session:${newSessionId}`, JSON.stringify({
            userId: user._id,
            refreshHash
        }), {
            EX: 7 * 24 * 60 * 60
        });

        await redisClient.sRem(`user_sessions:${user._id.toString()}`, sessionId);
        await redisClient.sAdd(`user_sessions:${user._id.toString()}`, newSessionId);

        return { accessToken: newAccessToken, newRefreshToken, sessionId: newSessionId };
        
    } catch (error: any) {
        throw new Error(error.message || "Invalid or expired refresh token");
    }
}
//logout
const logoutUser = async (sessionId:string)=>{
    try {
        const storedToken = await redisClient.get(`session:${sessionId}`);
        if (storedToken) {
            const session = JSON.parse(storedToken);
            await redisClient.sRem(`user_sessions:${session.userId}`, sessionId);
            await redisClient.del(`session:${sessionId}`);
        }
        return { message: "Logout successful" };
    } catch (error:any) {
        throw new Error(error.message || "Logout failed");
    }
}

// logout from all devices
const logoutAllDevices = async (userId: string) => {
    try {
        const sessionIds = await redisClient.sMembers(`user_sessions:${userId}`);
        if (sessionIds.length > 0) {
            const pipeline = redisClient.multi();
            for (const sid of sessionIds) {
                pipeline.del(`session:${sid}`);
            }
            pipeline.del(`user_sessions:${userId}`);
            await pipeline.exec();
        }
        return { message: "Logged out from all devices successfully" };
    } catch (error: any) {
        throw new Error(error.message || "Logout from all devices failed");
    }
}

// get user profile
const getUserProfile = async (userId: string) => {
    try {
        const user = await User.findById(userId).select("-__v");
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    } catch (error) {
        throw error;
    }
}

//logout user

const forgotPassword = async (email: string) => {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return { message: "If an account with that email exists, we sent a password reset OTP." };
        }

        const otp = generateOTP();
        await redisClient.set(`forgotPasswordOtp:${email}`, otp, { EX: 600 }); // 10 mins

        await addEmailJob({
            to: email,
            subject: "Password Reset OTP",
            html: `<h1>Password Reset</h1><p>Your OTP to reset your password is:</p><h2>${otp}</h2><p>This code expires in 10 minutes.</p>`
        });

        return { message: "If an account with that email exists, we sent a password reset OTP." };
    } catch (error: any) {
        throw new Error(error.message || "Failed to process forgot password request");
    }
}

const resetPassword = async (data: { email: string, otp: string, newPassword: string }) => {
    try {
        const { email, otp, newPassword } = data;
        
        const storedOtp = await redisClient.get(`forgotPasswordOtp:${email}`);
        if (!storedOtp || storedOtp !== otp) {
            throw new Error("Invalid or expired OTP");
        }

        const user = await User.findOne({ email });
        if (!user) {
            throw new Error("User not found");
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await Account.findOneAndUpdate({ userId: user._id }, { passwordHash });

        await redisClient.del(`forgotPasswordOtp:${email}`);

        await logoutAllDevices(user._id.toString());

        return { message: "Password has been reset successfully" };
    } catch (error: any) {
        throw new Error(error.message || "Failed to reset password");
    }
}

export { registerUser, verifyEmail, loginUser, refreshAccessToken, getUserProfile, logoutUser, logoutAllDevices, forgotPassword, resetPassword };