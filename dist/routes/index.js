"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// import userRouter from "./users";
// import networkRouter from "./network";
// import familyRouter from "./family";
// import carpoolRouter from "./carpool";
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    res.json({ message: "🚀 TypeScript Node Server is running!" });
});
// router.use("/api/user", userRouter);
// router.use("/api/network", networkRouter);
// router.use("/api/family", familyRouter);
// router.use("/api/carpool", carpoolRouter);
exports.default = router;
