"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.families = void 0;
const express_1 = require("express");
const users_1 = require("./users");
const familyRouter = (0, express_1.Router)();
exports.families = new Map();
// get all family of user
familyRouter.get('/', async (req, res, next) => {
    let data = [];
    try {
        const { userId: id } = req.query;
        if (exports.families.has(id)) {
            const fam = exports.families.get(id);
            if (fam) {
                data = [...fam];
            }
        }
        else {
            exports.families.set(id, []);
        }
    }
    catch (error) {
        res.status(404).json({ error });
    }
    res.json({ success: true, data });
});
// delete a family member
familyRouter.delete('/', async (req, res, next) => {
    try {
        const { id, idToDelete } = req.body;
        if (!exports.families.has(id)) {
            exports.families.set(id, []);
        }
        const userFamily = exports.families.get(id);
        let updated = userFamily?.filter(({ id: memberId }) => memberId !== idToDelete);
        exports.families.set(id, updated);
        res.json({ success: true });
    }
    catch (error) {
        res.status(404).json({ error });
    }
});
// add a family member
familyRouter.post('/', async (req, res, next) => {
    try {
        const { familyMember, userId } = req.body;
        if (!exports.families.has(userId)) {
            exports.families.set(userId, []);
        }
        const userFamily = exports.families.get(userId);
        const newMember = {
            ...familyMember,
            id: (0, users_1.generateUUID)()
        };
        exports.families.set(userId, userFamily.concat([newMember]));
        res.json({ success: true, data: newMember });
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
familyRouter.put('/', async (req, res, next) => {
    try {
        const { familyMember, userId } = req.body;
        if (!exports.families.has(userId)) {
            exports.families.set(userId, []);
        }
        const userFamily = [...exports.families.get(userId)];
        for (let i = 0; i < userFamily.length; i++) {
            const member = userFamily[i];
            if (member.id === familyMember.id) {
                userFamily[i] = {
                    ...member,
                    ...familyMember
                };
                break;
            }
        }
        exports.families.set(userId, userFamily);
        res.json({ success: true, data: familyMember });
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
exports.default = familyRouter;
