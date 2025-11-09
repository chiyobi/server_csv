import { Router, Request, Response, NextFunction } from "express";
import { UUID, UserId, users, carpools, Trip, Carpool, savedTrips, carpoolIdToUserId, userIdToCarpoolId, CarpoolId,  } from "../db";
import { generateUUID, emailCarpoolStatusUpdate } from "../utils";

const carpoolRouter = Router();

// get all carpools of user and get all shared carpools with user
carpoolRouter.get(
  "/",
  async (
    req: Request<{}, {}, {}, { userId: UserId }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { userId } = req.query;

      if (!carpools.has(userId)) {
        carpools.set(userId, []);
      }

      const userCarpools = carpools.get(userId)?.slice() as Carpool[];

      res.json({ success: true, data: userCarpools });
    } catch (error) {
      res.status(404).json({ error });
    }
  }
);

carpoolRouter.get(
  "/trip",
  async (
    req: Request<{}, {}, {}, { userId: UserId }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      let userTrips = [] as Trip[];
      const { userId } = req.query;
      if (savedTrips.has(userId)) {
        userTrips = savedTrips.get(userId)?.slice() as Trip[];
      }
      res.json({ success: true, data: userTrips });
    } catch (error) {
      res.status(404).json({ error });
    }
  }
);

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

// delete a carpool
carpoolRouter.delete(
  "/",
  async (
    req: Request<{}, {}, { userId: UserId; carpoolId: UUID }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { userId, carpoolId } = req.body;

      deleteACarpool(userId, carpoolId);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error });
    }
  }
);

carpoolRouter.delete(
  "/trip",
  async (
    req: Request<{}, {}, { userId: UserId; idToDelete: UUID }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { userId, idToDelete } = req.body;
      if (savedTrips.has(userId)) {
        const userTrips = savedTrips.get(userId)?.slice();
        savedTrips.set(
          userId,
          userTrips?.filter((trip) => trip.id !== idToDelete) as Trip[]
        );
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error });
    }
  }
);

// add a carpool
carpoolRouter.post(
  "/",
  async (
    req: Request<
      {},
      {},
      { userId: UUID; newCarpool: Carpool; recipientIds: UUID[] }
    >,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { userId, newCarpool, recipientIds } = req.body;

      if (!carpools.has(userId)) {
        carpools.set(userId, []);
      }
      const userCarpools = carpools.get(userId)?.slice();
      const carpoolId = generateUUID() as UUID;
      const carpool = {
        ...newCarpool,
        id: carpoolId,
      };

      // if carpool was shared with friends, record new carpool into shared carpools
      carpoolIdToUserId.set(carpoolId, recipientIds.concat([userId]));
      const recipientEmails = [];
      for (const rId of recipientIds) {
        const recipient = users.get(rId);
        if (recipient) {
          recipientEmails.push(recipient.email);
        }
        const friendCarpoolIds = userIdToCarpoolId.get(rId) || [];
        friendCarpoolIds.push(carpoolId);
        userIdToCarpoolId.set(rId, friendCarpoolIds);
        carpools.set(rId, (carpools.get(rId) || []).concat([carpool]));
      }

      carpools.set(userId, userCarpools?.concat([carpool]) as Carpool[]);

      // send email to all recipients
      try {
        await emailCarpoolStatusUpdate(recipientEmails, newCarpool);
      } catch (e) {
        throw "Could not email status update.";
      }

      res.json({ success: true, data: carpool });
    } catch (error) {
      res.status(500).json({ error });
    }
  }
);

carpoolRouter.post(
  "/trip",
  async (
    req: Request<{}, {}, { userId: UUID; newTrip: Trip }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { userId, newTrip } = req.body;
      if (!savedTrips.has(userId)) {
        savedTrips.set(userId, []);
      }
      const userTrips = savedTrips.get(userId)?.slice();
      const trip = {
        ...newTrip,
        id: generateUUID() as UUID,
      };
      savedTrips.set(userId, userTrips?.concat([trip]) as Trip[]);

      res.json({ success: true, data: trip });
    } catch (error) {
      res.status(500).json({ error });
    }
  }
);

// update a carpool
carpoolRouter.put(
  "/",
  async (
    req: Request<{}, {}, { userId: UUID; update: Carpool }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { userId, update } = req.body;

      const carpoolId = update.id;
      const userCarpools = carpools.get(userId)?.slice() || [];
      const creatorId = update.createdBy.id;
      const creatorCarpools = carpools.get(creatorId)?.slice() || [];

      const allUserIdsOfCarpool = carpoolIdToUserId.get(carpoolId);

      const recipientEmails = [];
      if (allUserIdsOfCarpool) {
        for (const uId of allUserIdsOfCarpool) {
          const friend = users.get(uId);
          if (friend) {
            recipientEmails.push(friend.email);
          }
        }
      }

      try {
        await emailCarpoolStatusUpdate(recipientEmails, update);
      } catch (e) {
        throw "Could not email status update.";
      }

      // if status is confirmed,
      // remove all users that are not the driver and creator from carpoolIdToUserId
      if (update.status === "Confirmed") {
        const relevantUserIds = allUserIdsOfCarpool?.filter(
          (uId) => uId === userId || uId === creatorId
        );
        if (relevantUserIds) {
          carpoolIdToUserId.set(carpoolId, relevantUserIds);
        }

        // remove carpoolId from all users previously associated with carpool Id
        const nonrelevantUserIds = allUserIdsOfCarpool?.filter(
          (uId) => uId !== userId && uId !== creatorId
        );
        if (nonrelevantUserIds) {
          for (const uId of nonrelevantUserIds) {
            const carpoolIdsOfNonrelevantUsers = userIdToCarpoolId.get(uId);
            if (carpoolIdsOfNonrelevantUsers) {
              userIdToCarpoolId.set(
                uId,
                carpoolIdsOfNonrelevantUsers.filter((cId) => cId !== carpoolId)
              );
            }

            const carpoolsOfNonrelevantUsers = carpools.get(uId);
            if (carpoolsOfNonrelevantUsers) {
              carpools.set(
                uId,
                carpoolsOfNonrelevantUsers.filter((c) => c.id !== carpoolId)
              );
            }
          }
        }
      }

      // update existing carpool, set to current user and creator
      if (userCarpools.length) {
        for (let i = 0; i < userCarpools.length; i++) {
          if (userCarpools[i].id === carpoolId) {
            userCarpools[i] = {
              ...userCarpools[i],
              ...update,
            };
            break;
          }
        }
        carpools.set(userId, userCarpools);
      }

      if (creatorCarpools.length) {
        for (let i = 0; i < creatorCarpools.length; i++) {
          if (creatorCarpools[i].id === carpoolId) {
            creatorCarpools[i] = {
              ...creatorCarpools[i],
              ...update,
            };
            break;
          }
        }
        carpools.set(creatorId, creatorCarpools);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error });
    }
  }
);

carpoolRouter.put(
  "/trip",
  async (
    req: Request<{}, {}, { userId: UUID; trip: Trip }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { userId, trip } = req.body;
      if (!savedTrips.has(userId)) {
        savedTrips.set(userId, []);
      }
      const userTrips = savedTrips.get(userId)?.slice() as Trip[];

      for (let i = 0; i < userTrips?.length; i++) {
        const aTrip = userTrips[i];
        if (aTrip.id === trip.id) {
          userTrips[i] = {
            ...aTrip,
            ...trip,
          };
        }
        break;
      }

      savedTrips.set(userId, userTrips);
      res.json({ success: true, data: trip });
    } catch (error) {
      res.status(500).json({ error });
    }
  }
);

export default carpoolRouter;
