"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.friends = exports.friendRequests = exports.groups = void 0;
const express_1 = require("express");
const users_1 = require("./users");
const carpool_1 = require("./carpool");
const utils_1 = require("../utils");
const networkRouter = (0, express_1.Router)();
const groupIdToUserIds = new Map();
const userIdToGroupIds = new Map();
exports.groups = new Map();
exports.friendRequests = new Map();
exports.friends = new Map();
// get all groups of user
networkRouter.get("/groups", async (req, res, next) => {
    const data = [];
    try {
        const { userId } = req.query;
        const groupIds = userIdToGroupIds.get(userId) || [];
        if (groupIds.length) {
            for (let gId of groupIds) {
                const g = exports.groups.get(gId);
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
        if (exports.friends.has(id)) {
            const currentUserFriends = exports.friends.get(id);
            for (const { id: friendId } of currentUserFriends) {
                if (users_1.users.has(friendId)) {
                    data?.push(userDataToFriendProfile(users_1.users.get(friendId)));
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
        if (exports.friendRequests.has(id)) {
            data = exports.friendRequests.get(id) || [];
        }
    }
    catch (error) {
        res.status(404).json({ error });
    }
    res.json({ success: true, data });
});
// TODO: refactor delete friend
// delete a friend
networkRouter.delete("/friends", async (req, res, next) => {
    try {
        const { id, idToDelete } = req.body;
        // delete all pending carpools from deleted friend, turn all confirmed carpools to pending
        const sharedCarpoolsWithFriend = (0, carpool_1.getSharedCarpools)(idToDelete);
        carpool_1.carpools.delete(idToDelete);
        const previouslyConfirmedCarpools = [];
        for (const c of sharedCarpoolsWithFriend) {
            if (c.status === "Pending") {
                carpool_1.carpoolIdToUserId.set(c.id, (carpool_1.carpoolIdToUserId.get(c.id) || []).filter((uId) => uId !== idToDelete));
            }
            else {
                previouslyConfirmedCarpools.push(c);
            }
        }
        const recipientEmails = [];
        const userEmail = users_1.users.get(id)?.email;
        if (userEmail) {
            recipientEmails.push(userEmail);
        }
        // convert confirmed to pending
        for (const c of previouslyConfirmedCarpools) {
            // get all creator ids of previously confirmed carpools
            c.status = "Pending";
            const creatorId = c.createdBy.id;
            const friendsOfCreator = exports.friends.get(creatorId);
            if (friendsOfCreator?.length) {
                // use creator ids to get current friends and add carpools to their lists
                for (const f of friendsOfCreator) {
                    recipientEmails.push(f.email);
                    carpool_1.userIdToCarpoolId.set(f.id, [
                        ...new Set((carpool_1.userIdToCarpoolId.get(f.id) || []).concat([c.id])).values(),
                    ]);
                    carpool_1.carpools.set(f.id, [
                        ...new Set((carpool_1.carpools.get(f.id) || []).concat([c])).values(),
                    ]);
                    carpool_1.carpoolIdToUserId.set(c.id, [
                        ...new Set((carpool_1.carpoolIdToUserId.get(c.id) || []).concat([f.id])).values(),
                    ]);
                }
            }
        }
        // send emails
        try {
            for (const c of previouslyConfirmedCarpools) {
                await (0, utils_1.emailCarpoolStatusUpdate)(recipientEmails, c);
            }
        }
        catch (e) {
            throw e;
        }
        // delete friend from groups
        const friendGroupIds = userIdToGroupIds.get(idToDelete);
        if (friendGroupIds?.length) {
            for (const gId of friendGroupIds) {
                groupIdToUserIds.set(gId, (groupIdToUserIds.get(gId) || []).filter((uId) => uId !== idToDelete));
                const g = exports.groups.get(gId);
                if (g) {
                    const updated = {
                        ...g,
                        memberIds: g.memberIds.filter((mId) => mId !== idToDelete),
                    };
                    exports.groups.set(gId, updated);
                }
            }
        }
        userIdToGroupIds.delete(idToDelete);
        const userFriends = exports.friends.get(id);
        const updated = userFriends?.filter(({ id: friendId }) => friendId !== idToDelete);
        exports.friends.set(id, updated);
    }
    catch (error) {
        res.status(404).json({ error });
    }
    res.json({ success: true });
});
const userDataToFriendProfile = (userData) => {
    return {
        id: userData.id,
        firstname: userData.firstname,
        lastname: userData.lastname,
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
        gender: userData.gender,
        birthday: userData.birthday,
        company: userData.company,
        linkedIn: userData.linkedIn,
    };
};
// make a new friend request
networkRouter.post("/friends/request", async (req, res, next) => {
    try {
        const { userId, friendEmail } = req.body;
        const user = users_1.users.get(userId);
        if (user && user.email === friendEmail) {
            throw "Cannot send a friend request to yourself.";
        }
        if (!users_1.emailsToId.has(friendEmail)) {
            throw "Email does not match any user.";
        }
        const friendId = users_1.emailsToId.get(friendEmail);
        if (!users_1.users.has(friendId)) {
            throw "User not found.";
        }
        // friend request already exists
        const currentFriendRequests = exports.friendRequests.get(userId);
        if (currentFriendRequests) {
            const friendRequestItem = currentFriendRequests.filter((fr) => fr.sender.email === friendEmail ||
                fr.recipient.email === friendEmail)[0];
            if (friendRequestItem) {
                throw "Friend request was already sent.";
            }
        }
        // Email is already a friend
        const currentFriends = exports.friends.get(userId);
        if (currentFriends) {
            const friendProfile = currentFriends.filter((f) => f.email === friendEmail)[0];
            if (friendProfile) {
                throw "They are already a friend.";
            }
        }
        const requestId = (0, users_1.generateUUID)();
        const senderData = users_1.users.get(userId);
        const sender = userDataToFriendProfile(senderData);
        const recipientData = users_1.users.get(friendId);
        const recipient = userDataToFriendProfile(recipientData);
        const data = {
            requestId,
            sender,
            recipient,
        };
        exports.friendRequests.set(userId, (exports.friendRequests.get(userId) || []).concat([data]));
        exports.friendRequests.set(friendId, (exports.friendRequests.get(friendId) || []).concat([data]));
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
        const recipientProfile = users_1.users.get(recipientId);
        const senderFriends = (exports.friends.get(senderId) || []).concat([
            userDataToFriendProfile(recipientProfile),
        ]);
        exports.friends.set(senderId, senderFriends);
        const senderProfile = users_1.users.get(senderId);
        const recipientFriends = (exports.friends.get(recipientId) || []).concat([
            userDataToFriendProfile(senderProfile),
        ]);
        exports.friends.set(recipientId, recipientFriends);
        // delete friend requests
        const senderFriendRequests = exports.friendRequests
            .get(senderId)
            ?.filter((req) => req.requestId !== requestId);
        const recipientFriendRequests = exports.friendRequests
            .get(recipientId)
            ?.filter((req) => req.requestId !== requestId);
        // TODO: put all pending carpools into new friend's carpool requests
        exports.friendRequests.set(senderId, senderFriendRequests);
        exports.friendRequests.set(recipientId, recipientFriendRequests);
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
        const groupId = (0, users_1.generateUUID)();
        const newGroup = {
            ...group,
            id: groupId,
        };
        exports.groups.set(groupId, newGroup);
        userIdToGroupIds.set(createdById, (userIdToGroupIds.get(createdById) || []).concat([groupId]));
        groupIdToUserIds.set(groupId, (groupIdToUserIds.get(groupId) || []).concat(memberIds));
        res.json({ success: true, data: newGroup });
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
networkRouter.delete("/groups", async (req, res, next) => {
    try {
        const { id, idToDelete } = req.body;
        const userGroupIds = userIdToGroupIds.get(id);
        if (userGroupIds?.length) {
            userIdToGroupIds.set(id, userGroupIds.filter((gId) => gId !== idToDelete));
        }
        const groupUserIds = groupIdToUserIds.get(id);
        if (groupUserIds?.length) {
            groupIdToUserIds.set(idToDelete, groupUserIds.filter((uId) => uId !== id));
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
// delete friend request
networkRouter.delete("/friends/request", async (req, res, next) => {
    try {
        const { requestId, senderId, recipientId } = req.body;
        const senderFriendRequests = exports.friendRequests
            .get(senderId)
            ?.filter((req) => req.requestId !== requestId);
        const recipientFriendRequests = exports.friendRequests
            .get(recipientId)
            ?.filter((req) => req.requestId !== requestId);
        exports.friendRequests.set(senderId, senderFriendRequests);
        exports.friendRequests.set(recipientId, recipientFriendRequests);
        res.json({ success: true });
    }
    catch (error) {
        res.status(404).json({ error });
    }
});
exports.default = networkRouter;
