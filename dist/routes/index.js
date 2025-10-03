"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fileLogger_1 = require("../utils/fileLogger");
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    res.json({ message: "🚀 TypeScript Node Server is running!" });
});
router.post("/api/entry", async (req, res, next) => {
    const { name, email, zipcode } = req.body;
    console.log("req.body", req.body);
    if (!name || !email || !zipcode) {
        // Instead of sending response here, pass error to middleware
        const err = new Error("Name, email, and zipcode are required.");
        res.status(400);
        return next(err);
    }
    try {
        await (0, fileLogger_1.logMessageCSV)(name, email, zipcode);
        res.json({ success: true, saved: req.body });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to save message" });
    }
});
exports.default = router;
