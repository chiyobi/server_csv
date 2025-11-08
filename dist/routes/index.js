"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    res.json({ message: "🚀 TypeScript Node Server is running!" });
});
// router.use("/api/user", userRouter);
// router.use("/api/network", networkRouter);
// router.use("/api/family", familyRouter);
// router.use("/api/carpool", carpoolRouter);
exports.default = router;
