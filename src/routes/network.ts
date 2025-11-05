import { Router, Request, Response, NextFunction } from "express";
import { UUID, users, emailsToId, UserProfile as User, generateUUID, UserProfile } from "./users";

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
}

export type FriendRequest = {
  requestId: UUID;
  sender: FriendProfile;
  recipient: FriendProfile;
};

export const friendRequests = new Map<UUID, FriendRequest[]>();
export const friends = new Map<UUID, FriendProfile[]>();

// get all friends of user
networkRouter.get('/friends', async (req: Request<{}, {}, {}, {userId: UUID}>, res: Response, next: NextFunction) => {
  let data = [] as FriendProfile[] | undefined;
  try {
    const { userId: id } = req.query;

    if (friends.has(id)) {
      console.log(data);
      const currentUserFriends = friends.get(id) as FriendProfile[];
      for (const {id: friendId} of currentUserFriends) {
        if (users.has(friendId)) {
          data?.push(userDataToFriendProfile(users.get(friendId) as UserProfile));
        }
      }
    }

  } catch (error) {
    res.status(404).json({ error });
  }

  res.json({ success: true, data })
});

// get all friend requests of user
networkRouter.get('/friends/request', async (req: Request<{}, {}, {}, {userId: UUID}>, res: Response, next: NextFunction) => {
  let data = [] as FriendRequest[] | undefined;
  try {
    const { userId: id } = req.query;

    if (friendRequests.has(id)) {
      data = friendRequests.get(id);
    }

  } catch (error) {
    res.status(404).json({ error });
  }

  res.json({ success: true, data });
});

// delete a friend
networkRouter.delete('/friends', async (req: Request<{}, {}, { id: UUID; idToDelete: UUID }>, res: Response, next: NextFunction) => {
  try {
    const { id, idToDelete } = req.body;

    // TODO: delete all pending carpools and active carpools from deleted friend

    const userFriends = friends.get(id);
    const updated = userFriends?.filter(({id: friendId}) => friendId !== idToDelete) as UserProfile[];
    friends.set(id, updated);

  } catch (error) {
    res.status(404).json({ error });
  }

  res.json({ success: true });
});

type FriendRequestFormData = {
  userId: UUID;
  friendEmail: string;
}

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
    linkedIn: userData.linkedIn
  }
}

// make a new friend request
networkRouter.post('/friends/request', async (req: Request<{}, {}, FriendRequestFormData>, res: Response, next: NextFunction) => {
  
  try {
    const { userId, friendEmail } = req.body;

    if (!emailsToId.has(friendEmail)) {
      throw "Email does not match any user."
    }

    const friendId = emailsToId.get(friendEmail) as UUID;
    if (!users.has(friendId)) {
      throw "User not found."
    }
    
    const requestId = generateUUID();

    const senderData =  users.get(userId) as UserProfile;
    const sender = userDataToFriendProfile(senderData) as FriendProfile;

    const recipientData =  users.get(friendId) as UserProfile;
    const recipient = userDataToFriendProfile(recipientData) as FriendProfile;

    const data: FriendRequest = {
      requestId,
      sender,
      recipient
    }

    friendRequests.set(userId, (friendRequests.get(userId) || []).concat([data]));
    friendRequests.set(friendId, (friendRequests.get(friendId) || []).concat([data]));

    res.json({ success: true, data });
  } catch (error) {
    res.status(404).json({ error });
  }
});

// add a friend
networkRouter.post('/friends', async (req: Request<{}, {}, {userId: UUID, requestId: UUID, senderId: UUID, recipientId: UUID}>, res: Response, next: NextFunction) => {
  try {
    const { requestId, senderId, recipientId, userId } = req.body;
    
    const recipientProfile = users.get(recipientId) as User;
    const senderFriends = (friends.get(senderId) || []).concat([userDataToFriendProfile(recipientProfile)]);
    friends.set(senderId, senderFriends);

    const senderProfile = users.get(senderId) as User;
    const recipientFriends = (friends.get(recipientId) || []).concat([userDataToFriendProfile(senderProfile)]);
    friends.set(recipientId, recipientFriends);

    // delete friend requests
    const senderFriendRequests = friendRequests.get(senderId)?.filter((req) => req.requestId !== requestId) as FriendRequest[];
    const recipientFriendRequests = friendRequests.get(recipientId)?.filter((req) => req.requestId !== requestId) as FriendRequest[];

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
});

// delete friend request
networkRouter.delete('/friends/request', async (req: Request<{}, {}, {requestId: UUID, senderId: UUID, recipientId: UUID}>, res: Response, next: NextFunction) => {
  try {
    const { requestId, senderId, recipientId } = req.body;
    const senderFriendRequests = friendRequests.get(senderId)?.filter((req) => req.requestId !== requestId) as FriendRequest[];
    const recipientFriendRequests = friendRequests.get(recipientId)?.filter((req) => req.requestId !== requestId) as FriendRequest[];
    
    friendRequests.set(senderId, senderFriendRequests);
    friendRequests.set(recipientId, recipientFriendRequests);

    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ error });
  }

});


export default networkRouter;