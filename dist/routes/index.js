"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_1 = __importDefault(require("./users"));
// import networkRouter from "./network";
// import familyRouter from "./family";
// import carpoolRouter from "./carpool";
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    res.json({ message: "🚀 TypeScript Node Server is running!" });
});
router.use("/api/user", users_1.default);
// router.use("/api/network", networkRouter);
// router.use("/api/family", familyRouter);
// router.use("/api/carpool", carpoolRouter);
exports.default = router;
