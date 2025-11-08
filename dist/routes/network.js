"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// import {
//   UUID,
//   users,
//   emailsToId,
//   UserProfile as User,
//   generateUUID,
//   UserProfile,
//   UserId,
// } from "./users";
// import {
//   carpoolIdToUserId,
//   carpools,
//   getSharedCarpools,
//   userIdToCarpoolId,
// } from "./carpool";
// import { emailCarpoolStatusUpdate } from "../utils";
const db_1 = require("../db");
const utils_1 = require("../utils");
const networkRouter = (0, express_1.Router)();
// get all groups of user
networkRouter.get("/groups", async (req, res, next) => {
    const data = [];
    try {
        const { userId } = req.query;
        const groupIds = db_1.userIdToGroupIds.get(userId) || [];
        if (groupIds.length) {
            for (let gId of groupIds) {
                const g = db_1.groups.get(gId);
                if (g) {
                    data.push(g);
                }
            }
        }
    }
    catch (error) {
        res.status(404).json({ error });
    }
    res.json({ success: true, data });
});
// get all friends of user
networkRouter.get("/friends", async (req, res, next) => {
    let data = [];
    try {
        const { userId: id } = req.query;
        if (db_1.friends.has(id)) {
            const currentUserFriends = db_1.friends.get(id);
            for (const { id: friendId } of currentUserFriends) {
                if (db_1.users.has(friendId)) {
                    data?.push((0, db_1.userDataToFriendProfile)(db_1.users.get(friendId)));
                }
            }
        }
    }
    catch (error) {
        res.status(404).json({ error });
    }
    res.json({ success: true, data });
});
// get all friend requests of user
networkRouter.get("/friends/request", async (req, res, next) => {
    let data = [];
    try {
        const { userId: id } = req.query;
        if (db_1.friendRequests.has(id)) {
            data = db_1.friendRequests.get(id) || [];
        }
    }
    catch (error) {
        res.status(404).json({ error });
    }
    res.json({ success: true, data });
});
// TODO: refactor delete friend
// delete a friend
// networkRouter.delete(
//   "/friends",
//   async (
//     req: Request<{}, {}, { id: UUID; idToDelete: UUID }>,
//     res: Response,
//     next: NextFunction
//   ) => {
//     try {
//       const { id, idToDelete } = req.body;
//       // delete all pending carpools from deleted friend, turn all confirmed carpools to pending
//       const sharedCarpoolsWithFriend = getSharedCarpools(idToDelete);
//       carpools.delete(idToDelete);
//       const previouslyConfirmedCarpools = [];
//       for (const c of sharedCarpoolsWithFriend) {
//         if (c.status === "Pending") {
//           carpoolIdToUserId.set(
//             c.id,
//             (carpoolIdToUserId.get(c.id) || []).filter(
//               (uId) => uId !== idToDelete
//             )
//           );
//         } else {
//           previouslyConfirmedCarpools.push(c);
//         }
//       }
//       const recipientEmails = [];
//       const userEmail = users.get(id)?.email;
//       if (userEmail) {
//         recipientEmails.push(userEmail);
//       }
//       // convert confirmed to pending
//       for (const c of previouslyConfirmedCarpools) {
//         // get all creator ids of previously confirmed carpools
//         c.status = "Pending";
//         const creatorId = c.createdBy.id;
//         const friendsOfCreator = friends.get(creatorId);
//         if (friendsOfCreator?.length) {
//           // use creator ids to get current friends and add carpools to their lists
//           for (const f of friendsOfCreator) {
//             recipientEmails.push(f.email);
//             userIdToCarpoolId.set(f.id, [
//               ...new Set(
//                 (userIdToCarpoolId.get(f.id) || []).concat([c.id])
//               ).values(),
//             ]);
//             carpools.set(f.id, [
//               ...new Set((carpools.get(f.id) || []).concat([c])).values(),
//             ]);
//             carpoolIdToUserId.set(c.id, [
//               ...new Set(
//                 (carpoolIdToUserId.get(c.id) || []).concat([f.id])
//               ).values(),
//             ]);
//           }
//         }
//       }
//       // send emails
//       try {
//         for (const c of previouslyConfirmedCarpools) {
//           await emailCarpoolStatusUpdate(recipientEmails, c);
//         }
//       } catch (e) {
//         throw e;
//       }
//       // delete friend from groups
//       const friendGroupIds = userIdToGroupIds.get(idToDelete);
//       if (friendGroupIds?.length) {
//         for (const gId of friendGroupIds) {
//           groupIdToUserIds.set(
//             gId,
//             (groupIdToUserIds.get(gId) || []).filter(
//               (uId) => uId !== idToDelete
//             )
//           );
//           const g = groups.get(gId);
//           if (g) {
//             const updated = {
//               ...g,
//               memberIds: g.memberIds.filter((mId) => mId !== idToDelete),
//             };
//             groups.set(gId, updated);
//           }
//         }
//       }
//       userIdToGroupIds.delete(idToDelete);
//       const userFriends = friends.get(id);
//       const updated = userFriends?.filter(
//         ({ id: friendId }) => friendId !== idToDelete
//       ) as UserProfile[];
//       friends.set(id, updated);
//     } catch (error) {
//       res.status(404).json({ error });
//     }
//     res.json({ success: true });
//   }
// );
// make a new friend request
networkRouter.post("/friends/request", async (req, res, next) => {
    try {
        const { userId, friendEmail } = req.body;
        const user = db_1.users.get(userId);
        if (user && user.email === friendEmail) {
            throw "Cannot send a friend request to yourself.";
        }
        if (!db_1.emailsToId.has(friendEmail)) {
            throw "Email does not match any user.";
        }
        const friendId = db_1.emailsToId.get(friendEmail);
        if (!db_1.users.has(friendId)) {
            throw "User not found.";
        }
        // friend request already exists
        const currentFriendRequests = db_1.friendRequests.get(userId);
        if (currentFriendRequests) {
            const friendRequestItem = currentFriendRequests.filter((fr) => fr.sender.email === friendEmail ||
                fr.recipient.email === friendEmail)[0];
            if (friendRequestItem) {
                throw "Friend request was already sent.";
            }
        }
        // Email is already a friend
        const currentFriends = db_1.friends.get(userId);
        if (currentFriends) {
            const friendProfile = currentFriends.filter((f) => f.email === friendEmail)[0];
            if (friendProfile) {
                throw "They are already a friend.";
            }
        }
        const requestId = (0, utils_1.generateUUID)();
        const senderData = db_1.users.get(userId);
        const sender = (0, db_1.userDataToFriendProfile)(senderData);
        const recipientData = db_1.users.get(friendId);
        const recipient = (0, db_1.userDataToFriendProfile)(recipientData);
        const data = {
            requestId,
            sender,
            recipient,
        };
        db_1.friendRequests.set(userId, (db_1.friendRequests.get(userId) || []).concat([data]));
        db_1.friendRequests.set(friendId, (db_1.friendRequests.get(friendId) || []).concat([data]));
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(404).json({ error });
    }
});
// add a friend
networkRouter.post("/friends", async (req, res, next) => {
    try {
        const { requestId, senderId, recipientId, userId } = req.body;
        const recipientProfile = db_1.users.get(recipientId);
        const senderFriends = (db_1.friends.get(senderId) || []).concat([
            (0, db_1.userDataToFriendProfile)(recipientProfile),
        ]);
        db_1.friends.set(senderId, senderFriends);
        const senderProfile = db_1.users.get(senderId);
        const recipientFriends = (db_1.friends.get(recipientId) || []).concat([
            (0, db_1.userDataToFriendProfile)(senderProfile),
        ]);
        db_1.friends.set(recipientId, recipientFriends);
        // delete friend requests
        const senderFriendRequests = db_1.friendRequests
            .get(senderId)
            ?.filter((req) => req.requestId !== requestId);
        const recipientFriendRequests = db_1.friendRequests
            .get(recipientId)
            ?.filter((req) => req.requestId !== requestId);
        // TODO: put all pending carpools into new friend's carpool requests
        db_1.friendRequests.set(senderId, senderFriendRequests);
        db_1.friendRequests.set(recipientId, recipientFriendRequests);
        if (userId === senderId) {
            res.json({ success: true, data: recipientProfile });
        }
        else {
            res.json({ success: true, data: senderProfile });
        }
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
// add a group
networkRouter.post("/groups", async (req, res, next) => {
    try {
        const { group } = req.body;
        const { createdById, memberIds } = group;
        const groupId = (0, utils_1.generateUUID)();
        const newGroup = {
            ...group,
            id: groupId,
        };
        db_1.groups.set(groupId, newGroup);
        db_1.userIdToGroupIds.set(createdById, (db_1.userIdToGroupIds.get(createdById) || []).concat([groupId]));
        db_1.groupIdToUserIds.set(groupId, (db_1.groupIdToUserIds.get(groupId) || []).concat(memberIds));
        res.json({ success: true, data: newGroup });
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
networkRouter.delete("/groups", async (req, res, next) => {
    try {
        const { id, idToDelete } = req.body;
        const userGroupIds = db_1.userIdToGroupIds.get(id);
        if (userGroupIds?.length) {
            db_1.userIdToGroupIds.set(id, userGroupIds.filter((gId) => gId !== idToDelete));
        }
        const groupUserIds = db_1.groupIdToUserIds.get(id);
        if (groupUserIds?.length) {
            db_1.groupIdToUserIds.set(idToDelete, groupUserIds.filter((uId) => uId !== id));
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
// // delete friend request
networkRouter.delete("/friends/request", async (req, res, next) => {
    try {
        const { requestId, senderId, recipientId } = req.body;
        const senderFriendRequests = db_1.friendRequests
            .get(senderId)
            ?.filter((req) => req.requestId !== requestId);
        const recipientFriendRequests = db_1.friendRequests
            .get(recipientId)
            ?.filter((req) => req.requestId !== requestId);
        db_1.friendRequests.set(senderId, senderFriendRequests);
        db_1.friendRequests.set(recipientId, recipientFriendRequests);
        res.json({ success: true });
    }
    catch (error) {
        res.status(404).json({ error });
    }
});
exports.default = networkRouter;
