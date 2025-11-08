"use strict";
// import nodemailer from "nodemailer";
// import crypto from "crypto";
// import { Carpool } from "../routes/carpool";
// function generateRandomString(length: number) {
//   // crypto.randomBytes generates a buffer of random bytes.
//   // The length of the buffer needs to be half of the desired string length
//   // because each byte converts to two hexadecimal characters.
//   const bufferLength = Math.ceil(length / 2); 
//   const randomBytes = crypto.randomBytes(bufferLength);
//   // Convert the buffer to a hexadecimal string.
//   const hexString = randomBytes.toString('hex');
//   // Slice the string to the exact desired length, in case the buffer length
//   // resulted in an odd number of hex characters that exceeded the target.
//   return hexString.slice(0, length);
// }
// export const getRandom128CharString = () => generateRandomString(128);
// export const sendConfirmationEmail = async (recipientEmail: string, tempCode: string) => {
//   const transporter = nodemailer.createTransport({
//     service: "Gmail",
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS
//     }
//   });
//   const mailData = {
//     from: process.env.SMTP_USER,
//     to: recipientEmail,
//     subject: 'Hello from Goodloop!',
//     html: `<p>
//       <h1>Thanks for joining the Goodloop family!</h1><br>
//       Please verify your email by clicking the link below:<br><br>
//       <a style="font-size: 32px; font-weight: 600; text-decoration: none !important;" href="http://192.168.0.17:3000/api/user/verify?code=${tempCode}">Verify</a>
//     </p>`
//   };
//   return transporter.sendMail(mailData);
// }
// const formatDateString = (date: string) => {
//   const dateObject = new Date(date);
//   const formattedDate = dateObject.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'});
//   return formattedDate;
// }
// const formatTimeString = (time: string) => {
//   const dateObject = new Date(time);
//   const formattedTime = dateObject.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
//   return formattedTime
// }
// export const emailCarpoolStatusUpdate = async (recipientEmails: string[], update: Carpool) => {
//   const transporter = nodemailer.createTransport({
//     service: "Gmail",
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS
//     }
//   });
//   const { createdBy, status, purpose, passengers, date, time, from, to, notes, driver} = update;
//   const mailData = {
//     from: process.env.SMTP_USER,
//     to: recipientEmails.join(', '),
//     subject: '',
//     html: ''
//   };
//   const creatorName = `${createdBy.firstname} ${createdBy.lastname}`;
//   if (status === "Pending") {
//     mailData.subject = `${createdBy.firstname} has requested your help!`;
//     mailData.html = `
//     <div>
//     <h3>${creatorName} needs a driver</h3>
//     <h4>The details:</h4>
//     <p>Purpose: ${purpose}</p>
//     <p>Passengers: ${passengers.join(', ')}</p>
//     <p>Date: ${formatDateString(date)}</p>
//     <p>Time: ${formatTimeString(time)}</p>
//     <p>Pickup at: ${from}</p>
//     <p>Dropoff at: ${to}</p>
//     <p>Notes: ${notes || `no notes from ${createdBy.firstname}`}</p>
//     <p>Status: Waiting for a driver to accept</p>
//     </div>
//     `
//   } else {
//     mailData.subject = `${createdBy.firstname}'s carpool request status has changed!`;
//     const driverName = `${driver?.firstname} ${driver?.lastname}`;
//     if (status === "Confirmed") {
//       mailData.html = `
//       <div>
//       <h3>${driverName} has volunteered to drive</h3>
//       <h4>The details:</h4>
//       <p>Driver: ${driverName}</p>
//       <p>Purpose: ${purpose}</p>
//       <p>Passengers: ${passengers.join(', ')}</p>
//       <p>Date: ${formatDateString(date)}</p>
//       <p>Time: ${formatTimeString(time)}</p>
//       <p>Pickup at: ${from}</p>
//       <p>Dropoff at: ${to}</p>
//       <p>Notes: ${notes || `no notes from ${createdBy.firstname}`}</p>
//       <p>Status: ${status}</p>
//       </div>
//       `
//     } else {
//       mailData.html = `
//       <div>
//       <h3>${creatorName}'s carpool request is now ${status}</h3>
//       <h4>The details:</h4>
//       <p>Driver: ${driverName}</p>
//       <p>Purpose: ${purpose}</p>
//       <p>Passengers: ${passengers.join(', ')}</p>
//       <p>Date: ${formatDateString(date)}</p>
//       <p>Time: ${formatTimeString(time)}</p>
//       <p>Pickup at: ${from}</p>
//       <p>Dropoff at: ${to}</p>
//       <p>Notes: ${notes || `no notes from ${createdBy.firstname}`}</p>
//       <p>Status: ${status}</p>
//       </div>
//       `
//     }
//   }
//   return transporter.sendMail(mailData);
// }
