"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteACarpool = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const utils_1 = require("../utils");
const carpoolRouter = (0, express_1.Router)();
// get all carpools of user and get all shared carpools with user
carpoolRouter.get("/", async (req, res, next) => {
    try {
        const { userId } = req.query;
        if (!db_1.carpools.has(userId)) {
            db_1.carpools.set(userId, []);
        }
        const userCarpools = db_1.carpools.get(userId)?.slice();
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
        if (db_1.savedTrips.has(userId)) {
            userTrips = db_1.savedTrips.get(userId)?.slice();
        }
        res.json({ success: true, data: userTrips });
    }
    catch (error) {
        res.status(404).json({ error });
    }
});
const deleteACarpool = (userId, carpoolId) => {
    const allUserIdsOfCarpool = db_1.carpoolIdToUserId.get(carpoolId);
    console.log("userId", userId);
    if (allUserIdsOfCarpool) {
        for (const uId of allUserIdsOfCarpool) {
            const uCarpools = db_1.carpools.get(uId);
            if (uCarpools) {
                db_1.carpools.set(uId, uCarpools.filter((c) => c.id !== carpoolId));
            }
            if (db_1.userIdToCarpoolId.has(uId)) {
                const carpoolIds = db_1.userIdToCarpoolId.get(uId);
                if (carpoolIds) {
                    db_1.userIdToCarpoolId.set(userId, carpoolIds.filter((cId) => cId !== carpoolId));
                }
            }
        }
        db_1.carpoolIdToUserId.delete(carpoolId);
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
        if (db_1.savedTrips.has(userId)) {
            const userTrips = db_1.savedTrips.get(userId)?.slice();
            db_1.savedTrips.set(userId, userTrips?.filter((trip) => trip.id !== idToDelete));
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
        if (!db_1.carpools.has(userId)) {
            db_1.carpools.set(userId, []);
        }
        const userCarpools = db_1.carpools.get(userId)?.slice();
        const carpoolId = (0, utils_1.generateUUID)();
        const carpool = {
            ...newCarpool,
            id: carpoolId,
        };
        // if carpool was shared with friends, record new carpool into shared carpools
        db_1.carpoolIdToUserId.set(carpoolId, recipientIds.concat([userId]));
        const recipientEmails = [];
        for (const rId of recipientIds) {
            const recipient = db_1.users.get(rId);
            if (recipient) {
                recipientEmails.push(recipient.email);
            }
            const friendCarpoolIds = db_1.userIdToCarpoolId.get(rId) || [];
            friendCarpoolIds.push(carpoolId);
            db_1.userIdToCarpoolId.set(rId, friendCarpoolIds);
            db_1.carpools.set(rId, (db_1.carpools.get(rId) || []).concat([carpool]));
        }
        db_1.carpools.set(userId, userCarpools?.concat([carpool]));
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
        if (!db_1.savedTrips.has(userId)) {
            db_1.savedTrips.set(userId, []);
        }
        const userTrips = db_1.savedTrips.get(userId)?.slice();
        const trip = {
            ...newTrip,
            id: (0, utils_1.generateUUID)(),
        };
        db_1.savedTrips.set(userId, userTrips?.concat([trip]));
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
        const userCarpools = db_1.carpools.get(userId)?.slice() || [];
        const creatorId = update.createdBy.id;
        const creatorCarpools = db_1.carpools.get(creatorId)?.slice() || [];
        const allUserIdsOfCarpool = db_1.carpoolIdToUserId.get(carpoolId);
        const recipientEmails = [];
        if (allUserIdsOfCarpool) {
            for (const uId of allUserIdsOfCarpool) {
                const friend = db_1.users.get(uId);
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
                db_1.carpoolIdToUserId.set(carpoolId, relevantUserIds);
            }
            // remove carpoolId from all users previously associated with carpool Id
            const nonrelevantUserIds = allUserIdsOfCarpool?.filter((uId) => uId !== userId && uId !== creatorId);
            if (nonrelevantUserIds) {
                for (const uId of nonrelevantUserIds) {
                    const carpoolIdsOfNonrelevantUsers = db_1.userIdToCarpoolId.get(uId);
                    if (carpoolIdsOfNonrelevantUsers) {
                        db_1.userIdToCarpoolId.set(uId, carpoolIdsOfNonrelevantUsers.filter((cId) => cId !== carpoolId));
                    }
                    const carpoolsOfNonrelevantUsers = db_1.carpools.get(uId);
                    if (carpoolsOfNonrelevantUsers) {
                        db_1.carpools.set(uId, carpoolsOfNonrelevantUsers.filter((c) => c.id !== carpoolId));
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
            db_1.carpools.set(userId, userCarpools);
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
            db_1.carpools.set(creatorId, creatorCarpools);
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
        if (!db_1.savedTrips.has(userId)) {
            db_1.savedTrips.set(userId, []);
        }
        const userTrips = db_1.savedTrips.get(userId)?.slice();
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
        db_1.savedTrips.set(userId, userTrips);
        res.json({ success: true, data: trip });
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
exports.default = carpoolRouter;
