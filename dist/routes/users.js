"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const userRouter = (0, express_1.Router)();
userRouter.post("/signin", async (req, res, next) => {
    const { email, password } = req.body;
    try {
        if (!db_1.emailsToId.has(email)) {
            throw "No account with this email.";
        }
        const id = db_1.emailsToId.get(email);
        if (!id || db_1.auth.get(id)?.active === false) {
            throw "Account not verified.";
        }
        if (!id || !db_1.users.has(id) || db_1.auth.get(id)?.password !== password) {
            throw "Invalid credentials.";
        }
        if (!db_1.friends.has(id)) {
            db_1.friends.set(id, []);
        }
        if (!db_1.friendRequests.has(id)) {
            db_1.friendRequests.set(id, []);
        }
        const userFriends = db_1.friends.get(id)?.slice();
        const userFriendRequests = db_1.friendRequests.get(id)?.slice();
        if (!db_1.families.has(id)) {
            db_1.families.set(id, []);
        }
        const data = {
            user: {
                ...db_1.users.get(id),
            },
            network: {
                friends: userFriends,
                friendRequests: userFriendRequests,
            },
            family: db_1.families.get(id)?.slice(),
        };
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(404).json({ error });
    }
});
userRouter.get("/verify", async (req, res, next) => {
    const { code } = req.query;
    if (db_1.tempTokens.has(code)) {
        const userId = db_1.tempTokens.get(code);
        const authStatus = db_1.auth.get(userId);
        db_1.auth.set(userId, { ...authStatus, active: true });
        db_1.tempTokens.delete(code);
    }
    res.redirect("https://hello.goodloop.us");
});
userRouter.post("/new", async (req, res, next) => {
    // const { email, password } = req.body as User;
    // const id = generateUUID();
    try {
        // if (emailsToId.has(email)) {
        //   throw "Email already exists. Use a different email.";
        // }
        // const code = getRandom128CharString();
        // tempTokens.set(code, id);
        // try {
        //   await sendConfirmationEmail(email, code);
        //   emailsToId.set(email, id);
        //   auth.set(id, { password, active: false });
        //   const userData = {
        //     id,
        //     email,
        //     firstname: req.body.firstname,
        //     lastname: req.body.lastname,
        //   };
        //   users.set(id, userData as UserProfile);
        // } catch (e) {
        //   throw "Not a valid email.";
        // }
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
// userRouter.put(
//   "/",
//   async (
//     req: Request<{}, {}, UserProfile>,
//     res: Response,
//     next: NextFunction
//   ) => {
//     const { id } = req.body;
//     try {
//       if (users.has(id)) {
//         const updatedData = { ...users.get(id), ...req.body };
//         users.set(id, updatedData);
//         res.json({ success: true, data: updatedData });
//       } else {
//         throw "User no longer exists.";
//       }
//     } catch (error) {
//       res.status(500).json({ error });
//     }
//   }
// );
// userRouter.put(
//   "/password",
//   async (
//     req: Request<{}, {}, { userId: UUID; newPassword: string }>,
//     res: Response,
//     next: NextFunction
//   ) => {
//     const { userId, newPassword } = req.body;
//     try {
//       if (auth.has(userId)) {
//         const updated = auth.get(userId) as Verified;
//         if (updated) {
//           auth.set(userId, { ...updated, password: newPassword });
//         }
//         res.json({ success: true });
//       } else {
//         throw "User does not exist.";
//       }
//     } catch (error) {
//       res.status(500).json({ error });
//     }
//   }
// );
// userRouter.delete(
//   "/",
//   async (
//     req: Request<{}, {}, { userId: UUID }>,
//     res: Response,
//     next: NextFunction
//   ) => {
//     const { userId } = req.body;
//     try {
//       const user = users.get(userId);
//       if (user) {
//         const { email } = user;
//         auth.delete(userId);
//         users.delete(userId);
//         emailsToId.delete(email);
//         families.delete(userId);
//         const allCarpools = carpools.get(userId);
//         if (allCarpools) {
//           const carpoolIdsNotMadeByUser = allCarpools
//             .filter((c) => c.createdBy.id !== userId)
//             .map((c) => c.id);
//           for (const cId of carpoolIdsNotMadeByUser) {
//             const userIds = carpoolIdToUserId.get(cId);
//             if (userIds) {
//               for (const uId of userIds) {
//                 const carpoolsOfUId = carpools.get(uId);
//                 if (carpoolsOfUId) {
//                   carpools.set(
//                     uId,
//                     carpoolsOfUId.map((c) => {
//                       if (c.id === cId) {
//                         const updated = {
//                           ...c,
//                           status: "Pending",
//                         } as Carpool;
//                         delete updated.driver;
//                         return updated;
//                       }
//                       return c;
//                     })
//                   );
//                 }
//               }
//             }
//           }
//           const allCarpoolIdsMadeByUser = allCarpools
//             .filter((c) => c.createdBy.id === userId)
//             .map((c) => c.id);
//           for (const cId of allCarpoolIdsMadeByUser) {
//             deleteACarpool(userId, cId);
//           }
//         }
//         carpools.delete(userId);
//         userIdToCarpoolId.delete(userId);
//         const allFriends = friends.get(userId);
//         if (allFriends) {
//           for (const f of allFriends) {
//             friends.set(
//               f.id,
//               (friends.get(f.id) || []).filter((f) => f.id !== userId)
//             );
//             friendRequests.set(
//               f.id,
//               (friendRequests.get(f.id) || []).filter(
//                 (f) => f.sender.id !== userId && f.recipient.id !== userId
//               )
//             );
//           }
//         }
//         friends.delete(userId);
//         friendRequests.delete(userId);
//         // TODO: delete user from groups
//         res.json({ success: true });
//       } else {
//         throw "User does not exist.";
//       }
//     } catch (error) {
//       res.status(500).json({ error });
//     }
//   }
// );
exports.default = userRouter;
