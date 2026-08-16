import type {Request,Response,NextFunction} from "express"
import { verifyAccessToken } from "../utils/jwt";
async function requireAuth(req:Request,res:Response,next:NextFunction){
    const token = req.cookies.accessToken;
    try {
        if(!token){
            res.status(401).json({message:"Unauthorized"});
            return;
        }
        const decodedToken = await verifyAccessToken(token);
        (req as any).user = decodedToken;
        next();
    } catch (error) {
        res.status(401).json({message:"Invalid token"});
        return;
    }
}

export {requireAuth}