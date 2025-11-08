"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
// import { friends, friendRequests, FriendProfile } from "./network";
// import { families } from "./family";
// import {
//   carpoolIdToUserId,
//   userIdToCarpoolId,
//   carpools,
//   deleteACarpool,
//   Carpool,
// } from "./carpool";
const utils_1 = require("../utils");
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
    const { email, password } = req.body;
    const id = (0, utils_1.generateUUID)();
    try {
        if (db_1.emailsToId.has(email)) {
            throw "Email already exists. Use a different email.";
        }
        const code = (0, utils_1.getRandom128CharString)();
        db_1.tempTokens.set(code, id);
        try {
            await (0, utils_1.sendConfirmationEmail)(email, code);
            db_1.emailsToId.set(email, id);
            db_1.auth.set(id, { password, active: false });
            const userData = {
                id,
                email,
                firstname: req.body.firstname,
                lastname: req.body.lastname,
            };
            db_1.users.set(id, userData);
            res.json({ success: true });
        }
        catch (e) {
            throw "Not a valid email.";
        }
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
// update user data
userRouter.put("/", async (req, res, next) => {
    const { id } = req.body;
    try {
        if (db_1.users.has(id)) {
            const updatedData = { ...db_1.users.get(id), ...req.body };
            db_1.users.set(id, updatedData);
            res.json({ success: true, data: updatedData });
        }
        else {
            throw "User no longer exists.";
        }
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
userRouter.put("/password", async (req, res, next) => {
    const { userId, newPassword } = req.body;
    try {
        if (db_1.auth.has(userId)) {
            const updated = db_1.auth.get(userId);
            if (updated) {
                db_1.auth.set(userId, { ...updated, password: newPassword });
            }
            res.json({ success: true });
        }
        else {
            throw "User does not exist.";
        }
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
userRouter.delete("/", async (req, res, next) => {
    const { userId } = req.body;
    try {
        const user = db_1.users.get(userId);
        if (user) {
            const { email } = user;
            db_1.auth.delete(userId);
            db_1.users.delete(userId);
            db_1.emailsToId.delete(email);
            db_1.families.delete(userId);
            const allCarpools = db_1.carpools.get(userId);
            if (allCarpools) {
                const carpoolIdsNotMadeByUser = allCarpools
                    .filter((c) => c.createdBy.id !== userId)
                    .map((c) => c.id);
                for (const cId of carpoolIdsNotMadeByUser) {
                    const userIds = db_1.carpoolIdToUserId.get(cId);
                    if (userIds) {
                        for (const uId of userIds) {
                            const carpoolsOfUId = db_1.carpools.get(uId);
                            if (carpoolsOfUId) {
                                db_1.carpools.set(uId, carpoolsOfUId.map((c) => {
                                    if (c.id === cId) {
                                        const updated = {
                                            ...c,
                                            status: "Pending",
                                        };
                                        delete updated.driver;
                                        return updated;
                                    }
                                    return c;
                                }));
                            }
                        }
                    }
                }
                const allCarpoolIdsMadeByUser = allCarpools
                    .filter((c) => c.createdBy.id === userId)
                    .map((c) => c.id);
                for (const cId of allCarpoolIdsMadeByUser) {
                    (0, db_1.deleteACarpool)(userId, cId);
                }
            }
            db_1.carpools.delete(userId);
            db_1.userIdToCarpoolId.delete(userId);
            const allFriends = db_1.friends.get(userId);
            if (allFriends) {
                for (const f of allFriends) {
                    db_1.friends.set(f.id, (db_1.friends.get(f.id) || []).filter((f) => f.id !== userId));
                    db_1.friendRequests.set(f.id, (db_1.friendRequests.get(f.id) || []).filter((f) => f.sender.id !== userId && f.recipient.id !== userId));
                }
            }
            db_1.friends.delete(userId);
            db_1.friendRequests.delete(userId);
            // TODO: delete user from groups
            res.json({ success: true });
        }
        else {
            throw "User does not exist.";
        }
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
exports.default = userRouter;
