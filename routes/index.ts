import { Router, Request, Response } from "express";
import userRouter from "./users";
import networkRouter from "./network";
import familyRouter from "./family";
import carpoolRouter from "./carpool";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({ message: "🚀 TypeScript Node Server is running!" });
});

router.use("/api/user", userRouter);
router.use("/api/network", networkRouter);
router.use("/api/family", familyRouter);
router.use("/api/carpool", carpoolRouter);

export default router;
