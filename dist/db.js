"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteACarpool = exports.savedTrips = exports.userIdToCarpoolId = exports.carpoolIdToUserId = exports.carpools = exports.groups = exports.userIdToGroupIds = exports.groupIdToUserIds = exports.friends = exports.friendRequests = exports.emailsToId = exports.users = exports.auth = exports.tempTokens = exports.families = void 0;
exports.families = new Map();
exports.tempTokens = new Map();
exports.auth = new Map();
exports.users = new Map();
exports.emailsToId = new Map();
exports.friendRequests = new Map();
exports.friends = new Map();
exports.groupIdToUserIds = new Map();
exports.userIdToGroupIds = new Map();
exports.groups = new Map();
exports.carpools = new Map();
exports.carpoolIdToUserId = new Map();
exports.userIdToCarpoolId = new Map();
exports.savedTrips = new Map();
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
