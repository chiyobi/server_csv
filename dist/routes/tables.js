"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.friends = exports.friendRequests = exports.groups = exports.userIdToGroupIds = exports.groupIdToUserIds = exports.emailsToId = exports.users = void 0;
exports.generateUUID = generateUUID;
const uuid_1 = require("uuid");
function generateUUID() {
    return (0, uuid_1.v4)();
}
const tempTokens = new Map();
const auth = new Map();
exports.users = new Map();
exports.emailsToId = new Map();
exports.groupIdToUserIds = new Map();
exports.userIdToGroupIds = new Map();
exports.groups = new Map();
exports.friendRequests = new Map();
exports.friends = new Map();
