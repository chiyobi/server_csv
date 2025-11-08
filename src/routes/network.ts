import { Router, Request, Response, NextFunction } from "express";
import {
  UUID,
  users,
  emailsToId,
  UserProfile as User,
  generateUUID,
  UserProfile,
  UserId,
} from "./users";
import {
  carpoolIdToUserId,
  carpools,
  getSharedCarpools,
  userIdToCarpoolId,
} from "./carpool";
import { emailCarpoolStatusUpdate } from "../utils";

const networkRouter = Router();

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

export type Group = {
  id: string;
  name: string;
  createdById: UUID;
  memberIds: UUID[];
};

type GroupId = UUID;
const groupIdToUserIds = new Map<GroupId, UserId[]>();
const userIdToGroupIds = new Map<UserId, GroupId[]>();
export const groups = new Map<GroupId, Group>();

export const friendRequests = new Map<UUID, FriendRequest[]>();
export const friends = new Map<UUID, FriendProfile[]>();

// get all groups of user
networkRouter.get(
  "/groups",
  async (
    req: Request<{}, {}, {}, { userId: UUID }>,
    res: Response,
    next: NextFunction
  ) => {
    const data: Group[] = [];
    try {
      const { userId } = req.query;
      const groupIds = userIdToGroupIds.get(userId) || [];
      if (groupIds.length) {
        for (let gId of groupIds) {
          const g = groups.get(gId);
          if (g) {
            data.push(g);
          }
        }
      }
    } catch (error) {
      res.status(404).json({ error });
    }

    res.json({ success: true, data });
  }
);

// get all friends of user
networkRouter.get(
  "/friends",
  async (
    req: Request<{}, {}, {}, { userId: UUID }>,
    res: Response,
    next: NextFunction
  ) => {
    let data: FriendProfile[] = [];
    try {
      const { userId: id } = req.query;

      if (friends.has(id)) {
        const currentUserFriends = friends.get(id) as FriendProfile[];
        for (const { id: friendId } of currentUserFriends) {
          if (users.has(friendId)) {
            data?.push(
              userDataToFriendProfile(users.get(friendId) as UserProfile)
            );
          }
        }
      }
    } catch (error) {
      res.status(404).json({ error });
    }

    res.json({ success: true, data });
  }
);

// get all friend requests of user
networkRouter.get(
  "/friends/request",
  async (
    req: Request<{}, {}, {}, { userId: UUID }>,
    res: Response,
    next: NextFunction
  ) => {
    let data: FriendRequest[] = [];
    try {
      const { userId: id } = req.query;

      if (friendRequests.has(id)) {
        data = friendRequests.get(id) || [];
      }
    } catch (error) {
      res.status(404).json({ error });
    }

    res.json({ success: true, data });
  }
);

// TODO: refactor delete friend
// delete a friend
networkRouter.delete(
  "/friends",
  async (
    req: Request<{}, {}, { id: UUID; idToDelete: UUID }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id, idToDelete } = req.body;

      // delete all pending carpools from deleted friend, turn all confirmed carpools to pending
      const sharedCarpoolsWithFriend = getSharedCarpools(idToDelete);
      carpools.delete(idToDelete);

      const previouslyConfirmedCarpools = [];
      for (const c of sharedCarpoolsWithFriend) {
        if (c.status === "Pending") {
          carpoolIdToUserId.set(
            c.id,
            (carpoolIdToUserId.get(c.id) || []).filter(
              (uId) => uId !== idToDelete
            )
          );
        } else {
          previouslyConfirmedCarpools.push(c);
        }
      }

      const recipientEmails = [];
      const userEmail = users.get(id)?.email;
      if (userEmail) {
        recipientEmails.push(userEmail);
      }

      // convert confirmed to pending
      for (const c of previouslyConfirmedCarpools) {
        // get all creator ids of previously confirmed carpools
        c.status = "Pending";
        const creatorId = c.createdBy.id;
        const friendsOfCreator = friends.get(creatorId);
        if (friendsOfCreator?.length) {
          // use creator ids to get current friends and add carpools to their lists
          for (const f of friendsOfCreator) {
            recipientEmails.push(f.email);
            userIdToCarpoolId.set(f.id, [
              ...new Set(
                (userIdToCarpoolId.get(f.id) || []).concat([c.id])
              ).values(),
            ]);
            carpools.set(f.id, [
              ...new Set((carpools.get(f.id) || []).concat([c])).values(),
            ]);
            carpoolIdToUserId.set(c.id, [
              ...new Set(
                (carpoolIdToUserId.get(c.id) || []).concat([f.id])
              ).values(),
            ]);
          }
        }
      }

      // send emails
      try {
        for (const c of previouslyConfirmedCarpools) {
          await emailCarpoolStatusUpdate(recipientEmails, c);
        }
      } catch (e) {
        throw e;
      }

      // delete friend from groups
      const friendGroupIds = userIdToGroupIds.get(idToDelete);
      if (friendGroupIds?.length) {
        for (const gId of friendGroupIds) {
          groupIdToUserIds.set(
            gId,
            (groupIdToUserIds.get(gId) || []).filter(
              (uId) => uId !== idToDelete
            )
          );
          const g = groups.get(gId);
          if (g) {
            const updated = {
              ...g,
              memberIds: g.memberIds.filter((mId) => mId !== idToDelete),
            };
            groups.set(gId, updated);
          }
        }
      }
      userIdToGroupIds.delete(idToDelete);

      const userFriends = friends.get(id);
      const updated = userFriends?.filter(
        ({ id: friendId }) => friendId !== idToDelete
      ) as UserProfile[];
      friends.set(id, updated);
    } catch (error) {
      res.status(404).json({ error });
    }

    res.json({ success: true });
  }
);

type FriendRequestFormData = {
  userId: UUID;
  friendEmail: string;
};

const userDataToFriendProfile = (userData: UserProfile): FriendProfile => {
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
networkRouter.post(
  "/friends/request",
  async (
    req: Request<{}, {}, FriendRequestFormData>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { userId, friendEmail } = req.body;

      const user = users.get(userId);
      if (user && user.email === friendEmail) {
        throw "Cannot send a friend request to yourself.";
      }

      if (!emailsToId.has(friendEmail)) {
        throw "Email does not match any user.";
      }

      const friendId = emailsToId.get(friendEmail) as UUID;
      if (!users.has(friendId)) {
        throw "User not found.";
      }

      // friend request already exists
      const currentFriendRequests = friendRequests.get(userId);
      if (currentFriendRequests) {
        const friendRequestItem = currentFriendRequests.filter(
          (fr) =>
            fr.sender.email === friendEmail ||
            fr.recipient.email === friendEmail
        )[0];
        if (friendRequestItem) {
          throw "Friend request was already sent.";
        }
      }

      // Email is already a friend
      const currentFriends = friends.get(userId);
      if (currentFriends) {
        const friendProfile = currentFriends.filter(
          (f) => f.email === friendEmail
        )[0];
        if (friendProfile) {
          throw "They are already a friend.";
        }
      }

      const requestId = generateUUID();

      const senderData = users.get(userId) as UserProfile;
      const sender = userDataToFriendProfile(senderData) as FriendProfile;

      const recipientData = users.get(friendId) as UserProfile;
      const recipient = userDataToFriendProfile(recipientData) as FriendProfile;

      const data: FriendRequest = {
        requestId,
        sender,
        recipient,
      };

      friendRequests.set(
        userId,
        (friendRequests.get(userId) || []).concat([data])
      );
      friendRequests.set(
        friendId,
        (friendRequests.get(friendId) || []).concat([data])
      );

      res.json({ success: true, data });
    } catch (error) {
      res.status(404).json({ error });
    }
  }
);

// add a friend
networkRouter.post(
  "/friends",
  async (
    req: Request<
      {},
      {},
      { userId: UUID; requestId: UUID; senderId: UUID; recipientId: UUID }
    >,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { requestId, senderId, recipientId, userId } = req.body;

      const recipientProfile = users.get(recipientId) as User;
      const senderFriends = (friends.get(senderId) || []).concat([
        userDataToFriendProfile(recipientProfile),
      ]);
      friends.set(senderId, senderFriends);

      const senderProfile = users.get(senderId) as User;
      const recipientFriends = (friends.get(recipientId) || []).concat([
        userDataToFriendProfile(senderProfile),
      ]);
      friends.set(recipientId, recipientFriends);

      // delete friend requests
      const senderFriendRequests = friendRequests
        .get(senderId)
        ?.filter((req) => req.requestId !== requestId) as FriendRequest[];
      const recipientFriendRequests = friendRequests
        .get(recipientId)
        ?.filter((req) => req.requestId !== requestId) as FriendRequest[];

      // TODO: put all pending carpools into new friend's carpool requests

      friendRequests.set(senderId, senderFriendRequests);
      friendRequests.set(recipientId, recipientFriendRequests);

      if (userId === senderId) {
        res.json({ success: true, data: recipientProfile });
      } else {
        res.json({ success: true, data: senderProfile });
      }
    } catch (error) {
      res.status(500).json({ error });
    }
  }
);

// add a group
networkRouter.post(
  "/groups",
  async (
    req: Request<{}, {}, { group: Group }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { group } = req.body;
      const { createdById, memberIds } = group;

      const groupId = generateUUID();
      const newGroup = {
        ...group,
        id: groupId,
      };

      groups.set(groupId, newGroup);
      userIdToGroupIds.set(
        createdById,
        (userIdToGroupIds.get(createdById) || []).concat([groupId])
      );
      groupIdToUserIds.set(
        groupId,
        (groupIdToUserIds.get(groupId) || []).concat(memberIds)
      );

      res.json({ success: true, data: newGroup });
    } catch (error) {
      res.status(500).json({ error });
    }
  }
);

networkRouter.delete(
  "/groups",
  async (
    req: Request<{}, {}, { id: UUID; idToDelete: UUID }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id, idToDelete } = req.body;

      const userGroupIds = userIdToGroupIds.get(id);
      if (userGroupIds?.length) {
        userIdToGroupIds.set(
          id,
          userGroupIds.filter((gId) => gId !== idToDelete)
        );
      }

      const groupUserIds = groupIdToUserIds.get(id);
      if (groupUserIds?.length) {
        groupIdToUserIds.set(
          idToDelete,
          groupUserIds.filter((uId) => uId !== id)
        );
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error });
    }
  }
);

// delete friend request
networkRouter.delete(
  "/friends/request",
  async (
    req: Request<
      {},
      {},
      { requestId: UUID; senderId: UUID; recipientId: UUID }
    >,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { requestId, senderId, recipientId } = req.body;
      const senderFriendRequests = friendRequests
        .get(senderId)
        ?.filter((req) => req.requestId !== requestId) as FriendRequest[];
      const recipientFriendRequests = friendRequests
        .get(recipientId)
        ?.filter((req) => req.requestId !== requestId) as FriendRequest[];

      friendRequests.set(senderId, senderFriendRequests);
      friendRequests.set(recipientId, recipientFriendRequests);

      res.json({ success: true });
    } catch (error) {
      res.status(404).json({ error });
    }
  }
);

export default networkRouter;
