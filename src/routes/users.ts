import { Router, Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from 'uuid';
import {friends, friendRequests, FriendProfile} from './network';
import { families } from "./family";

const userRouter = Router();

export type UUID = string & { readonly brand: unique symbol };
export interface UserProfile {
  id: UUID;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
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
  }
}

export function generateUUID(): UUID {
  return uuidv4() as UUID;
}

export const users = new Map<UUID, UserProfile>();
export const emailsToId = new Map<string, UUID>();

userRouter.post('/signin', async (req: Request<{}, {}, UserProfile>, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  try {
    if (!emailsToId.has(email)) {  
      throw 'No account with this email.';
    }
    const id = emailsToId.get(email);
    if (!id || !users.has(id) || users.get(id)?.password !== password) {
      throw 'Invalid credentials.'
    }

    if (!friends.has(id)) {
      friends.set(id, []);
    }

    if (!friendRequests.has(id)) {
      friendRequests.set(id, []);
    }
    
    const userFriends = friends.get(id)?.slice();
    const userFriendRequests = friendRequests.get(id)?.slice();

    if (!families.has(id)) {
      families.set(id, []);
    }

    const data = {
      user: {
        ...users.get(id),
      },
      network: {
        friends: userFriends,
        friendRequests: userFriendRequests
      },
      family: families.get(id)?.slice()
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(404).json({ error });
  }

});

userRouter.post('/new', async (req: Request<{}, {}, UserProfile>, res: Response, next: NextFunction) => {
  const { email } = req.body as UserProfile;
  const id = generateUUID();

  try {
    if (emailsToId.has(email)) {
      throw "Email already exists. Use a different email.";
    } else {
      emailsToId.set(email, id);
      const userData = { ...req.body, id };
      users.set(id, userData);
      res.json({ success: true });
    }

  } catch (error) {
    res.status(500).json({ error });
  }
});

userRouter.put('/', async (req: Request<{}, {}, UserProfile>, res: Response, next: NextFunction) => {
  const { id } = req.body;

  try {
    if (users.has(id)) {
      const updatedData = { ...users.get(id), ...req.body };
      users.set(id, updatedData);
      res.json({ success: true, data: updatedData });
    } else {
      throw "User no longer exists."
    }
  } catch (error) {
    res.status(500).json({ error });
  }
});

export default userRouter;
