"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logMessageCSV = logMessageCSV;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const DATA_DIR = path_1.default.join(process.cwd(), "data"); // project-root/data
const CSV_FILE = path_1.default.join(DATA_DIR, "messages.csv");
/**
 * Ensure data folder exists
 */
async function ensureDataDir() {
    await fs_1.promises.mkdir(DATA_DIR, { recursive: true });
}
/**
 * Ensure CSV file exists and has a header row
 */
async function ensureCsvFile() {
    try {
        await fs_1.promises.access(CSV_FILE);
        // File exists → do nothing
    }
    catch {
        // File doesn't exist → create with header
        await fs_1.promises.writeFile(CSV_FILE, 'timestamp,name,email,zipcode\n', "utf-8");
    }
}
/**
 * Append a message to CSV
 */
async function logMessageCSV(name, email, zipcode) {
    try {
        await ensureDataDir();
        await ensureCsvFile();
        const timestamp = new Date().toISOString();
        // Escape double quotes in message
        const safeMessage = name.replace(/"/g, '""');
        const line = `${timestamp},"${safeMessage}",${email},${zipcode}\n`;
        await fs_1.promises.appendFile(CSV_FILE, line, "utf-8");
        console.log("✅ Message logged to CSV");
    }
    catch (err) {
        console.error("❌ Failed to log message:", err);
        throw err;
    }
}
