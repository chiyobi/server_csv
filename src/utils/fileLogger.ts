import { promises as fs } from "fs";
import path from "path";
import { UserProfile, UUID } from "../routes/users";

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

type FileTypes = "user" | "request"

async function ensureFile(type: FileTypes) {
  const filename = `${type}.json`;

  try {
    await fs.access(filename);
  } catch (e) {
    await fs.writeFile(filename, "{}", "utf-8");
  }

  return filename;
}

async function jsonFileToData(filename: string) {
  try {
    const filePath = path.join(__dirname, filename);
    const jsonString = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(jsonString);
    console.log(data);
    return data;
  } catch (err) {
    throw err;
  }
}

export async function getUserFromFile(id: UUID) {
  try {
    await ensureDataDir();
    const filename = await ensureFile("user");
    const users = await jsonFileToData(filename);
    const user = users[id];
    return user;
  } catch (err) {
    console.error("Failed to get user data:", err);
    throw err;
  }
}

export async function writeNewUserToFile(userData: UserProfile) {
  try {
    await ensureDataDir();
    const filename = await ensureFile("user");
    const users = await jsonFileToData(filename);
    const {id} = userData;
    users[id] = {...userData};

    await fs.writeFile(filename, JSON.stringify(users, null, 2));
    console.log(`User ${id} was added to ${filename}`);

  } catch (err) {
    console.error("Failed to write user data:", err);
    throw err;
  }
}

export async function updateUserToFile(newUserData: UserProfile) {
  try {
    await ensureDataDir();
    const filename = await ensureFile("user");
    const users = await jsonFileToData(filename);
    const {id} = newUserData;
    users[id] = { ...users[id], ...newUserData};

    await fs.writeFile(filename, JSON.stringify(users, null, 2));
    console.log(`User ${id} was updated in ${filename}`);

  } catch (err) {
    console.error("Failed to update user data:", err);
    throw err;
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
