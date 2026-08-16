import jwt from "jsonwebtoken"

interface Payload {
    userId: string
}

async function generateAccessToken(payload: Payload) {
    try {
        const token = jwt.sign(payload, process.env.JWT_SECRET!,
            { expiresIn: "15m" });
        return token;
    } catch (error) {
        throw error
    }
}

async function generateRefreshToken(payload: Payload) {
    try {
        const token = jwt.sign(payload, process.env.JWT_SECRET!,
            { expiresIn: "7d" });
        return token;
    } catch (error) {
        throw error
    }
}

async function verifyAccessToken(token: string): Promise<Payload> {
    try {
        return jwt.verify(token, process.env.JWT_SECRET!) as Payload
    } catch (error) {
        throw error
    }
}

async function verifyRefreshToken(token:string):Promise<Payload>{
    try {
        return jwt.verify(token,process.env.JWT_SECRET!) as Payload
    } catch (error) {
        throw error
    }
}

export { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken }