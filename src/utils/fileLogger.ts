import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data"); // project-root/data
const CSV_FILE = path.join(DATA_DIR, "messages.csv");

/**
 * Ensure data folder exists
 */
async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

/**
 * Ensure CSV file exists and has a header row
 */
async function ensureCsvFile() {
  try {
    await fs.access(CSV_FILE);
    // File exists → do nothing
  } catch {
    // File doesn't exist → create with header
    await fs.writeFile(CSV_FILE, 'timestamp,name,email,zipcode\n', "utf-8");
  }
}

/**
 * Append a message to CSV
 */
export async function logMessageCSV(name: string, email: string, zipcode: string) {
  try {
    await ensureDataDir();
    await ensureCsvFile();

    const timestamp = new Date().toISOString();

    // Escape double quotes in message
    const safeMessage = name.replace(/"/g, '""');

    const line = `${timestamp},"${safeMessage}",${email},${zipcode}\n`;
    await fs.appendFile(CSV_FILE, line, "utf-8");

    console.log("✅ Message logged to CSV");
  } catch (err) {
    console.error("❌ Failed to log message:", err);
    throw err;
  }
}
