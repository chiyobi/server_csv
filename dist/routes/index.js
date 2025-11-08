"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_1 = __importDefault(require("./users"));
const network_1 = __importDefault(require("./network"));
const family_1 = __importDefault(require("./family"));
const carpool_1 = __importDefault(require("./carpool"));
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    res.json({ message: "🚀 TypeScript Node Server is running!" });
});
router.use("/api/user", users_1.default);
router.use("/api/network", network_1.default);
router.use("/api/family", family_1.default);
router.use("/api/carpool", carpool_1.default);
exports.default = router;
