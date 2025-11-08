"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailsToId = exports.users = void 0;
exports.generateUUID = generateUUID;
const express_1 = require("express");
const uuid_1 = require("uuid");
const network_1 = require("./network");
const family_1 = require("./family");
const carpool_1 = require("./carpool");
const utils_1 = require("../utils");
const userRouter = (0, express_1.Router)();
function generateUUID() {
    return (0, uuid_1.v4)();
}
const tempTokens = new Map();
const auth = new Map();
exports.users = new Map();
exports.emailsToId = new Map();
userRouter.post("/signin", async (req, res, next) => {
    const { email, password } = req.body;
    try {
        if (!exports.emailsToId.has(email)) {
            throw "No account with this email.";
        }
        const id = exports.emailsToId.get(email);
        if (!id || auth.get(id)?.active === false) {
            throw "Account not verified.";
        }
        if (!id || !exports.users.has(id) || auth.get(id)?.password !== password) {
            throw "Invalid credentials.";
        }
        if (!network_1.friends.has(id)) {
            network_1.friends.set(id, []);
        }
        if (!network_1.friendRequests.has(id)) {
            network_1.friendRequests.set(id, []);
        }
        const userFriends = network_1.friends.get(id)?.slice();
        const userFriendRequests = network_1.friendRequests.get(id)?.slice();
        if (!family_1.families.has(id)) {
            family_1.families.set(id, []);
        }
        const data = {
            user: {
                ...exports.users.get(id),
            },
            network: {
                friends: userFriends,
                friendRequests: userFriendRequests,
            },
            family: family_1.families.get(id)?.slice(),
        };
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(404).json({ error });
    }
});
userRouter.get("/verify", async (req, res, next) => {
    const { code } = req.query;
    if (tempTokens.has(code)) {
        const userId = tempTokens.get(code);
        const authStatus = auth.get(userId);
        auth.set(userId, { ...authStatus, active: true });
        tempTokens.delete(code);
    }
    res.redirect("https://hello.goodloop.us");
});
userRouter.post("/new", async (req, res, next) => {
    const { email, password } = req.body;
    const id = generateUUID();
    try {
        if (exports.emailsToId.has(email)) {
            throw "Email already exists. Use a different email.";
        }
        const code = (0, utils_1.getRandom128CharString)();
        tempTokens.set(code, id);
        try {
            const info = await (0, utils_1.sendConfirmationEmail)(email, code);
            // console.log("info", info);
            exports.emailsToId.set(email, id);
            auth.set(id, { password, active: false });
            const userData = {
                id,
                email,
                firstname: req.body.firstname,
                lastname: req.body.lastname,
            };
            exports.users.set(id, userData);
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
userRouter.put("/", async (req, res, next) => {
    const { id } = req.body;
    try {
        if (exports.users.has(id)) {
            const updatedData = { ...exports.users.get(id), ...req.body };
            exports.users.set(id, updatedData);
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
        if (auth.has(userId)) {
            const updated = auth.get(userId);
            if (updated) {
                auth.set(userId, { ...updated, password: newPassword });
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
        const user = exports.users.get(userId);
        if (user) {
            const { email } = user;
            auth.delete(userId);
            exports.users.delete(userId);
            exports.emailsToId.delete(email);
            family_1.families.delete(userId);
            const allCarpools = carpool_1.carpools.get(userId);
            if (allCarpools) {
                const carpoolIdsNotMadeByUser = allCarpools
                    .filter((c) => c.createdBy.id !== userId)
                    .map((c) => c.id);
                for (const cId of carpoolIdsNotMadeByUser) {
                    const userIds = carpool_1.carpoolIdToUserId.get(cId);
                    if (userIds) {
                        for (const uId of userIds) {
                            const carpoolsOfUId = carpool_1.carpools.get(uId);
                            if (carpoolsOfUId) {
                                carpool_1.carpools.set(uId, carpoolsOfUId.map((c) => {
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
                    (0, carpool_1.deleteACarpool)(userId, cId);
                }
            }
            carpool_1.carpools.delete(userId);
            carpool_1.userIdToCarpoolId.delete(userId);
            const allFriends = network_1.friends.get(userId);
            if (allFriends) {
                for (const f of allFriends) {
                    network_1.friends.set(f.id, (network_1.friends.get(f.id) || []).filter((f) => f.id !== userId));
                    network_1.friendRequests.set(f.id, (network_1.friendRequests.get(f.id) || []).filter((f) => f.sender.id !== userId && f.recipient.id !== userId));
                }
            }
            network_1.friends.delete(userId);
            network_1.friendRequests.delete(userId);
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
