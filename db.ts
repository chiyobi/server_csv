export type UUID = string & { readonly brand: unique symbol };
export type UserId = UUID;

export interface UserProfile {
  id: UserId;
  firstname: string;
  lastname: string;
  email: string;
  username: string;
  phone: string;
  gender: string;
  birthday: string;
  company: string;
  linkedIn: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  friends: UserProfile[];
  friendRequests: {
    requestId: UUID;
    sender: FriendProfile;
    recipient: FriendProfile;
  };
}

export type Verified = { password: string; active: boolean };
export type User = UserProfile & Verified;

export type FriendProfile = {
  id: UUID;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  phone: string;
  gender: string;
  birthday: string;
  company: string;
  linkedIn: string;
};

export type FriendRequest = {
  requestId: UUID;
  sender: FriendProfile;
  recipient: FriendProfile;
};

export type FriendRequestFormData = {
  userId: UUID;
  friendEmail: string;
};

export type Group = {
  id: string;
  name: string;
  createdById: UUID;
  memberIds: UUID[];
};

export type FamilyMember = {
  id: UUID;
  firstname: string;
  lastname: string;
}

export type CarpoolStatus = "Pending" | "Confirmed" | "In Progress" | "Completed";
export type CarpoolId = UUID;
export type DriverProfile = {
  id: UserId;
  firstname: string;
  lastname: string;
};
export type Carpool = {
  id: CarpoolId;
  purpose: string;
  from: string;
  to: string;
  date: string;
  time: string;
  returnTrip: boolean;
  passengers: string[];
  notes: string;
  status: CarpoolStatus;
  driver?: DriverProfile;
  createdBy: FriendProfile;
};

export type Trip = {
  id: UUID;
  purpose: string;
  from: string;
  to: string;
  passengers: string[];
  notes: string;
};

export type GroupId = UUID;

export const families = new Map<UUID, FamilyMember[]>();

export const tempTokens = new Map<string, UserId>();
export const auth = new Map<UserId, Verified>();
export const users = new Map<UserId, UserProfile>();
export const emailsToId = new Map<string, UserId>();

export const friendRequests = new Map<UUID, FriendRequest[]>();
export const friends = new Map<UUID, FriendProfile[]>();

export const groupIdToUserIds = new Map<GroupId, UserId[]>();
export const userIdToGroupIds = new Map<UserId, GroupId[]>();
export const groups = new Map<GroupId, Group>();

export const carpools = new Map<UserId, Carpool[]>();
export const carpoolIdToUserId = new Map<CarpoolId, UserId[]>();
export const userIdToCarpoolId = new Map<UserId, CarpoolId[]>();

export const savedTrips = new Map<UserId, Trip[]>();

export const deleteACarpool = (userId: UserId, carpoolId: CarpoolId) => {
  const allUserIdsOfCarpool = carpoolIdToUserId.get(carpoolId);

  if (allUserIdsOfCarpool) {
    for (const uId of allUserIdsOfCarpool) {
      const uCarpools = carpools.get(uId);
      if (uCarpools) {
        carpools.set(
          uId,
          uCarpools.filter((c) => c.id !== carpoolId)
        );
      }
      if (userIdToCarpoolId.has(uId)) {
        const carpoolIds = userIdToCarpoolId.get(uId);
        if (carpoolIds) {
          userIdToCarpoolId.set(
            userId,
            carpoolIds.filter((cId) => cId !== carpoolId)
          );
        }
      }
    }
    carpoolIdToUserId.delete(carpoolId);
  }
};

export const getSharedCarpools = (userId: UserId) => {
  // get all shared carpools with user
  let shared: Carpool[] = [];
  if (friends.has(userId)) {
    const userFriends = friends.get(userId);

    if (userFriends) {
      const friendIds = userFriends.map((f) => f.id);
      for (let friendId of friendIds) {
        const friendCarpools = carpools.get(friendId);

        // check each of friend's carpools. If id matches a friend's carpool, it is shared.
        if (friendCarpools) {
          const userCarpoolIds = new Set(userIdToCarpoolId.get(userId));
          const sharedCarpools = friendCarpools.filter((c) =>
            userCarpoolIds.has(c.id)
          );
          shared = shared.concat(sharedCarpools);
        }
      }
    }
  }
  return shared;
};

export const userDataToFriendProfile = (userData: UserProfile): FriendProfile => {
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