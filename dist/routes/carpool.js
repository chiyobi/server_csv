"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteACarpool = exports.getSharedCarpools = exports.userIdToCarpoolId = exports.carpoolIdToUserId = exports.carpools = void 0;
const express_1 = require("express");
const users_1 = require("./users");
const network_1 = require("./network");
const utils_1 = require("../utils");
const carpoolRouter = (0, express_1.Router)();
exports.carpools = new Map();
exports.carpoolIdToUserId = new Map();
exports.userIdToCarpoolId = new Map();
const savedTrips = new Map();
const getSharedCarpools = (userId) => {
    // get all shared carpools with user
    let shared = [];
    if (network_1.friends.has(userId)) {
        const userFriends = network_1.friends.get(userId);
        if (userFriends) {
            const friendIds = userFriends.map((f) => f.id);
            for (let friendId of friendIds) {
                const friendCarpools = exports.carpools.get(friendId);
                // check each of friend's carpools. If id matches a friend's carpool, it is shared.
                if (friendCarpools) {
                    const userCarpoolIds = new Set(exports.userIdToCarpoolId.get(userId));
                    const sharedCarpools = friendCarpools.filter((c) => userCarpoolIds.has(c.id));
                    shared = shared.concat(sharedCarpools);
                }
            }
        }
    }
    return shared;
};
exports.getSharedCarpools = getSharedCarpools;
// get all carpools of user and get all shared carpools with user
carpoolRouter.get("/", async (req, res, next) => {
    try {
        const { userId } = req.query;
        if (!exports.carpools.has(userId)) {
            exports.carpools.set(userId, []);
        }
        const userCarpools = exports.carpools.get(userId)?.slice();
        res.json({ success: true, data: userCarpools });
    }
    catch (error) {
        res.status(404).json({ error });
    }
});
carpoolRouter.get("/trip", async (req, res, next) => {
    try {
        let userTrips = [];
        const { userId } = req.query;
        if (savedTrips.has(userId)) {
            userTrips = savedTrips.get(userId)?.slice();
        }
        res.json({ success: true, data: userTrips });
    }
    catch (error) {
        res.status(404).json({ error });
    }
});
const deleteACarpool = (userId, carpoolId) => {
    const allUserIdsOfCarpool = exports.carpoolIdToUserId.get(carpoolId);
    if (allUserIdsOfCarpool) {
        for (const uId of allUserIdsOfCarpool) {
            const uCarpools = exports.carpools.get(uId);
            if (uCarpools) {
                exports.carpools.set(uId, uCarpools.filter((c) => c.id !== carpoolId));
            }
            if (exports.userIdToCarpoolId.has(uId)) {
                const carpoolIds = exports.userIdToCarpoolId.get(uId);
                if (carpoolIds) {
                    exports.userIdToCarpoolId.set(userId, carpoolIds.filter((cId) => cId !== carpoolId));
                }
            }
        }
        exports.carpoolIdToUserId.delete(carpoolId);
    }
};
exports.deleteACarpool = deleteACarpool;
// delete a carpool
carpoolRouter.delete("/", async (req, res, next) => {
    try {
        const { userId, carpoolId } = req.body;
        (0, exports.deleteACarpool)(userId, carpoolId);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
carpoolRouter.delete("/trip", async (req, res, next) => {
    try {
        const { userId, idToDelete } = req.body;
        if (savedTrips.has(userId)) {
            const userTrips = savedTrips.get(userId)?.slice();
            savedTrips.set(userId, userTrips?.filter((trip) => trip.id !== idToDelete));
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
// add a carpool
carpoolRouter.post("/", async (req, res, next) => {
    try {
        const { userId, newCarpool, recipientIds } = req.body;
        if (!exports.carpools.has(userId)) {
            exports.carpools.set(userId, []);
        }
        const userCarpools = exports.carpools.get(userId)?.slice();
        const carpoolId = (0, users_1.generateUUID)();
        const carpool = {
            ...newCarpool,
            id: carpoolId,
        };
        // if carpool was shared with friends, record new carpool into shared carpools
        exports.carpoolIdToUserId.set(carpoolId, recipientIds.concat([userId]));
        const recipientEmails = [];
        for (const rId of recipientIds) {
            const recipient = users_1.users.get(rId);
            if (recipient) {
                recipientEmails.push(recipient.email);
            }
            const friendCarpoolIds = exports.userIdToCarpoolId.get(rId) || [];
            friendCarpoolIds.push(carpoolId);
            exports.userIdToCarpoolId.set(rId, friendCarpoolIds);
            exports.carpools.set(rId, (exports.carpools.get(rId) || []).concat([carpool]));
        }
        exports.carpools.set(userId, userCarpools?.concat([carpool]));
        // send email to all recipients
        try {
            await (0, utils_1.emailCarpoolStatusUpdate)(recipientEmails, newCarpool);
        }
        catch (e) {
            throw "Could not email status update.";
        }
        res.json({ success: true, data: carpool });
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
carpoolRouter.post("/trip", async (req, res, next) => {
    try {
        const { userId, newTrip } = req.body;
        if (!savedTrips.has(userId)) {
            savedTrips.set(userId, []);
        }
        const userTrips = savedTrips.get(userId)?.slice();
        const trip = {
            ...newTrip,
            id: (0, users_1.generateUUID)(),
        };
        savedTrips.set(userId, userTrips?.concat([trip]));
        res.json({ success: true, data: trip });
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
// update a carpool
carpoolRouter.put("/", async (req, res, next) => {
    try {
        const { userId, update } = req.body;
        const carpoolId = update.id;
        const userCarpools = exports.carpools.get(userId)?.slice() || [];
        const creatorId = update.createdBy.id;
        const creatorCarpools = exports.carpools.get(creatorId)?.slice() || [];
        const allUserIdsOfCarpool = exports.carpoolIdToUserId.get(carpoolId);
        const recipientEmails = [];
        if (allUserIdsOfCarpool) {
            for (const uId of allUserIdsOfCarpool) {
                const friend = users_1.users.get(uId);
                if (friend) {
                    recipientEmails.push(friend.email);
                }
            }
        }
        try {
            await (0, utils_1.emailCarpoolStatusUpdate)(recipientEmails, update);
        }
        catch (e) {
            throw "Could not email status update.";
        }
        // if status is confirmed,
        // remove all users that are not the driver and creator from carpoolIdToUserId
        if (update.status === "Confirmed") {
            const relevantUserIds = allUserIdsOfCarpool?.filter((uId) => uId === userId || uId === creatorId);
            if (relevantUserIds) {
                exports.carpoolIdToUserId.set(carpoolId, relevantUserIds);
            }
            // remove carpoolId from all users previously associated with carpool Id
            const nonrelevantUserIds = allUserIdsOfCarpool?.filter((uId) => uId !== userId && uId !== creatorId);
            if (nonrelevantUserIds) {
                for (const uId of nonrelevantUserIds) {
                    const carpoolIdsOfNonrelevantUsers = exports.userIdToCarpoolId.get(uId);
                    if (carpoolIdsOfNonrelevantUsers) {
                        exports.userIdToCarpoolId.set(uId, carpoolIdsOfNonrelevantUsers.filter((cId) => cId !== carpoolId));
                    }
                    const carpoolsOfNonrelevantUsers = exports.carpools.get(uId);
                    if (carpoolsOfNonrelevantUsers) {
                        exports.carpools.set(uId, carpoolsOfNonrelevantUsers.filter((c) => c.id !== carpoolId));
                    }
                }
            }
        }
        // update existing carpool, set to current user and creator
        if (userCarpools.length) {
            for (let i = 0; i < userCarpools.length; i++) {
                if (userCarpools[i].id === carpoolId) {
                    userCarpools[i] = {
                        ...userCarpools[i],
                        ...update,
                    };
                    break;
                }
            }
            exports.carpools.set(userId, userCarpools);
        }
        if (creatorCarpools.length) {
            for (let i = 0; i < creatorCarpools.length; i++) {
                if (creatorCarpools[i].id === carpoolId) {
                    creatorCarpools[i] = {
                        ...creatorCarpools[i],
                        ...update,
                    };
                    break;
                }
            }
            exports.carpools.set(creatorId, creatorCarpools);
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
carpoolRouter.put("/trip", async (req, res, next) => {
    try {
        const { userId, trip } = req.body;
        if (!savedTrips.has(userId)) {
            savedTrips.set(userId, []);
        }
        const userTrips = savedTrips.get(userId)?.slice();
        for (let i = 0; i < userTrips?.length; i++) {
            const aTrip = userTrips[i];
            if (aTrip.id === trip.id) {
                userTrips[i] = {
                    ...aTrip,
                    ...trip,
                };
            }
            break;
        }
        savedTrips.set(userId, userTrips);
        res.json({ success: true, data: trip });
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
exports.default = carpoolRouter;
