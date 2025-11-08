"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// import userRouter from "./users";
// import networkRouter from "./network";
// import familyRouter from "./family";
// import carpoolRouter from "./carpool";
// import { v4 as uuidv4 } from "uuid";
// import { friends, friendRequests, FriendProfile } from "./network";
// import { families } from "./family";
// import {
//   carpoolIdToUserId,
//   userIdToCarpoolId,
//   carpools,
//   deleteACarpool,
//   Carpool,
// } from "./carpool";
// import { getRandom128CharString, sendConfirmationEmail } from "../utils";
const router = (0, express_1.Router)();
router.get("/", (req, res) => {
    res.json({ message: "🚀 TypeScript Node Server is running!" });
});
// type UUID = string & { readonly brand: unique symbol };
// type UserId = UUID;
// interface UserProfile {
//   id: UserId;
//   firstname: string;
//   lastname: string;
//   email: string;
//   username: string;
//   phone: string;
//   gender: string;
//   birthday: string;
//   company: string;
//   linkedIn: string;
//   emergencyContactName: string;
//   emergencyContactPhone: string;
//   friends: UserProfile[];
//   friendRequests: {
//     requestId: UUID;
//     sender: FriendProfile;
//     recipient: FriendProfile;
//   };
// }
// type Verified = { password: string; active: boolean };
// type User = UserProfile & Verified;
// function generateUUID(): UUID {
//   return uuidv4() as UUID;
// }
// const tempTokens = new Map<string, UserId>();
// const auth = new Map<UserId, Verified>();
// const users = new Map<UserId, UserProfile>();
// const emailsToId = new Map<string, UserId>();
// router.use("/api/user", userRouter);
// router.use("/api/network", networkRouter);
// router.use("/api/family", familyRouter);
// router.use("/api/carpool", carpoolRouter);
exports.default = router;
