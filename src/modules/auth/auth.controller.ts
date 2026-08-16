import { Request, Response } from "express";
import { loginUser, registerUser, verifyEmail, refreshAccessToken, getUserProfile, logoutUser, logoutAllDevices, forgotPassword, resetPassword } from "./auth.service";

export const registerController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, name, password } = req.body;

        if (!email || !name || !password) {
            res.status(400).json({ message: "Email, name, and password are required" });
            return;
        }

        const user = await registerUser({ email, name, password });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
            }
        });
    } catch (error: any) {
        if (error.message === "User with this email already exists") {
            res.status(409).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export const verifyEmailController = async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    try {
        if (!email || !otp) {
            res.status(400).json({ message: "Email and OTP are required" });
            return;
        }
        await verifyEmail({ email, otp });
        res.status(200).json({ message: "Email verified successfully" })

    } catch (error: any) {
        if (error.message === "Invalid or expired OTP") {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export const loginController = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            res.status(400).json({ message: "Email and Password are required" });
            return;
        }
        const { user, accessToken, refreshToken,sessionId } = await loginUser({ email, password });
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000
        });
        res.cookie("refreshToken", `${sessionId}|${refreshToken}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7
        })

        res.status(200).json({ message: "Login successful", user })
    } catch (error: any) {
        if (error.message === "Invalid credentials") {
            res.status(401).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export const refreshTokenController = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        
        if (!refreshToken) {
            res.status(401).json({ message: "Refresh token is missing" });
            return;
        }

        const { accessToken, newRefreshToken, sessionId } = await refreshAccessToken(refreshToken);

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000 // 15 mins
        });
        
        res.cookie("refreshToken", `${sessionId}|${newRefreshToken}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        });

        res.status(200).json({ message: "Tokens refreshed successfully", accessToken });
    } catch (error: any) {
        res.status(401).json({ message: error.message });
    }
}

export const logoutController = async (req:Request,res:Response) => {
    try {
        const [sessionId,refreshToken] = req.cookies.refreshToken.split("|");
        await logoutUser(sessionId);
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.sendStatus(204)
    } catch (error:any) {
        res.status(401).json({ message: error.message });
    }
}

export const getUserProfileController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const user = await getUserProfile(userId);
        console.log(user)
        res.status(200).json({ user });
    } catch (error: any) {
        res.status(404).json({ message: error.message });
    }
}

export const logoutAllDevicesController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        await logoutAllDevices(userId);
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.status(200).json({ message: "Logged out from all devices successfully" });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
}}

export const forgotPasswordController = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: "Email is required" });
            return;
        }
        const response = await forgotPassword(email);
        res.status(200).json(response);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export const resetPasswordController = async (req: Request, res: Response) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            res.status(400).json({ message: "Email, OTP, and new password are required" });
            return;
        }
        const response = await resetPassword({ email, otp, newPassword });
        res.status(200).json(response);
    } catch (error: any) {
        if (error.message === "Invalid or expired OTP") {
            res.status(400).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: error.message });
    }
}
