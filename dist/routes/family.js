"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const utils_1 = require("../utils");
const familyRouter = (0, express_1.Router)();
// get all family of user
familyRouter.get('/', async (req, res, next) => {
    let data = [];
    try {
        const { userId: id } = req.query;
        if (db_1.families.has(id)) {
            const fam = db_1.families.get(id);
            if (fam) {
                data = [...fam];
            }
        }
        else {
            db_1.families.set(id, []);
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
        if (!db_1.families.has(id)) {
            db_1.families.set(id, []);
        }
        const userFamily = db_1.families.get(id);
        let updated = userFamily?.filter(({ id: memberId }) => memberId !== idToDelete);
        db_1.families.set(id, updated);
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
        if (!db_1.families.has(userId)) {
            db_1.families.set(userId, []);
        }
        const userFamily = db_1.families.get(userId);
        const newMember = {
            ...familyMember,
            id: (0, utils_1.generateUUID)()
        };
        db_1.families.set(userId, userFamily.concat([newMember]));
        res.json({ success: true, data: newMember });
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
familyRouter.put('/', async (req, res, next) => {
    try {
        const { familyMember, userId } = req.body;
        if (!db_1.families.has(userId)) {
            db_1.families.set(userId, []);
        }
        const userFamily = [...db_1.families.get(userId)];
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
        db_1.families.set(userId, userFamily);
        res.json({ success: true, data: familyMember });
    }
    catch (error) {
        res.status(500).json({ error });
    }
});
exports.default = familyRouter;
