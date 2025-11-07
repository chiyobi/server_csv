import { promises as fs } from "fs";
import path from "path";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { UserProfile, UUID } from "../routes/users";
import { Carpool } from "../routes/carpool";

function generateRandomString(length: number) {
  // crypto.randomBytes generates a buffer of random bytes.
  // The length of the buffer needs to be half of the desired string length
  // because each byte converts to two hexadecimal characters.
  const bufferLength = Math.ceil(length / 2); 
  const randomBytes = crypto.randomBytes(bufferLength);
  
  // Convert the buffer to a hexadecimal string.
  const hexString = randomBytes.toString('hex');
  
  // Slice the string to the exact desired length, in case the buffer length
  // resulted in an odd number of hex characters that exceeded the target.
  return hexString.slice(0, length);
}

export const getRandom128CharString = () => generateRandomString(128);

export const sendConfirmationEmail = async (recipientEmail: string, tempCode: string) => {

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailData = {
    from: process.env.SMTP_USER,
    to: recipientEmail,
    subject: 'Hello from Goodloop!',
    html: `<p>
      <h1>Thanks for joining the Goodloop family!</h1><br>
      Please verify your email by clicking the link below:<br><br>
      <a style="font-size: 32px; font-weight: 600; text-decoration: none !important;" href="http://192.168.0.17:3000/api/user/verify?code=${tempCode}">Verify</a>
    </p>`
  };

  return transporter.sendMail(mailData);
}

const formatDateString = (date: string) => {
  const dateObject = new Date(date);
  const formattedDate = dateObject.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'});
  return formattedDate;
}

const formatTimeString = (time: string) => {
  const dateObject = new Date(time);
  const formattedTime = dateObject.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
  return formattedTime
}

export const emailCarpoolStatusUpdate = async (recipientEmails: string[], update: Carpool) => {

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const { createdBy, status, purpose, passengers, date, time, from, to, notes, driver} = update;
  const mailData = {
    from: process.env.SMTP_USER,
    to: recipientEmails.join(', '),
    subject: '',
    html: ''
  };

  const creatorName = `${createdBy.firstname} ${createdBy.lastname}`;
  if (status === "Pending") {
    mailData.subject = `${createdBy.firstname} has requested your help!`;
    mailData.html = `
    <div>
    <h3>${creatorName} needs a driver</h3>
    <h4>The details:</h4>
    <p>Purpose: ${purpose}</p>
    <p>Passengers: ${passengers.join(', ')}</p>
    <p>Date: ${formatDateString(date)}</p>
    <p>Time: ${formatTimeString(time)}</p>
    <p>Pickup at: ${from}</p>
    <p>Dropoff at: ${to}</p>
    <p>Notes: ${notes || `no notes from ${createdBy.firstname}`}</p>
    <p>Status: Waiting for a driver to accept</p>
    </div>
    `
  } else {
    mailData.subject = `${createdBy.firstname}'s carpool request status has changed!`;
    const driverName = `${driver?.firstname} ${driver?.lastname}`;
    if (status === "Confirmed") {
      mailData.html = `
      <div>
      <h3>${driverName} has volunteered to drive</h3>
      <h4>The details:</h4>
      <p>Driver: ${driverName}</p>
      <p>Purpose: ${purpose}</p>
      <p>Passengers: ${passengers.join(', ')}</p>
      <p>Date: ${formatDateString(date)}</p>
      <p>Time: ${formatTimeString(time)}</p>
      <p>Pickup at: ${from}</p>
      <p>Dropoff at: ${to}</p>
      <p>Notes: ${notes || `no notes from ${createdBy.firstname}`}</p>
      <p>Status: ${status}</p>
      </div>
      `
    } else {
      mailData.html = `
      <div>
      <h3>${creatorName}'s carpool request is now ${status}</h3>
      <h4>The details:</h4>
      <p>Driver: ${driverName}</p>
      <p>Purpose: ${purpose}</p>
      <p>Passengers: ${passengers.join(', ')}</p>
      <p>Date: ${formatDateString(date)}</p>
      <p>Time: ${formatTimeString(time)}</p>
      <p>Pickup at: ${from}</p>
      <p>Dropoff at: ${to}</p>
      <p>Notes: ${notes || `no notes from ${createdBy.firstname}`}</p>
      <p>Status: ${status}</p>
      </div>
      `
    }
  }
  
  return transporter.sendMail(mailData);
}

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
