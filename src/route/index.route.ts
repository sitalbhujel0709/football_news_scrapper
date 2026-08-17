import { Router } from "express";
import authRoutes from "../modules/auth/auth.route";
import newsRoutes from "../modules/news/news.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/news", newsRoutes);

export default router;