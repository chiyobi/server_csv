import { Router, Request, Response, NextFunction } from "express";
import { UUID, generateUUID } from "./users";
import { friends } from "./network";

const carpoolRouter = Router();

type CarpoolStatus = "Pending" | "Confirmed" | "In Progress" | "Completed";
export type Carpool = {
  id: UUID;
  purpose: string;
  from: string;
  to: string;
  date: Date;
  time: Date;
  returnTrip: boolean;
  passengers: string[];
  notes: string;
  status: CarpoolStatus;
  driver?: string;
}

type Trip = {
  id: UUID;
  purpose: string;
  from: string;
  to: string;
  passengers: string[];
  notes: string;
}

type UserId = UUID;

const carpools = new Map<UserId, Carpool[]>();
const savedTrips = new Map<UserId, Trip[]>();

// get all carpools of user
carpoolRouter.get('/', async (req: Request<{}, {}, {}, {userId: UserId}>, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.query;
    
    if (!carpools.has(userId)) {
      carpools.set(userId, []);
    }

    const userCarpools = carpools.get(userId)?.slice() as Carpool[];
    console.log(carpools.get(userId));
    
    res.json({ success: true, data: userCarpools });
  } catch (error) {
    res.status(404).json({ error });
  }
});

carpoolRouter.get('/trip', async (req: Request<{}, {}, {}, {userId: UserId}>, res: Response, next: NextFunction) => {
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
});

// delete a carpool
carpoolRouter.delete('/', async (req: Request<{}, {}, { userId: UserId; carpoolId: UUID }>, res: Response, next: NextFunction) => {
  try {
    const { userId, carpoolId } = req.body;
    if (carpools.has(userId)) {
      const userCarpools = carpools.get(userId)?.slice();
      carpools.set(userId, userCarpools?.filter((carpool) => carpool.id !== carpoolId ) as Carpool[]);
    }

    // TODO: delete this carpool from all friends carpool list

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error });
  }
});

carpoolRouter.delete('/trip', async (req: Request<{}, {}, { userId: UserId; idToDelete: UUID }>, res: Response, next: NextFunction) => {
  try {
    const { userId, idToDelete } = req.body;
    if (savedTrips.has(userId)) {
      const userTrips = savedTrips.get(userId)?.slice();
      savedTrips.set(userId, userTrips?.filter((trip) => trip.id !== idToDelete ) as Trip[]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error });
  }
});

// add a carpool
carpoolRouter.post('/', async (req: Request<{}, {}, { userId: UUID, newCarpool: Carpool }>, res: Response, next: NextFunction) => {
  try {
    const { userId, newCarpool } = req.body;
    console.log("req.body", req.body);
    if (!carpools.has(userId)) {
      carpools.set(userId, []);
    }
    const userCarpools = carpools.get(userId)?.slice();
    const carpool = {
      ...newCarpool,
      id: generateUUID()
    }

    // TODO: add all pending carpool to all friends' carpools
    
    carpools.set(userId, userCarpools?.concat([carpool]) as Carpool[]);
    console.log("carpool", carpools.get(userId));

    res.json({ success: true, data: carpool });

  } catch (error) {
    res.status(500).json({ error });
  }
});

carpoolRouter.post('/trip', async (req: Request<{}, {}, { userId: UUID, newTrip: Trip }>, res: Response, next: NextFunction) => {
  try {
    const { userId, newTrip } = req.body;
    if (!savedTrips.has(userId)) {
      savedTrips.set(userId, []);
    }
    const userTrips = savedTrips.get(userId)?.slice();
    const trip = {
      ...newTrip,
      id: generateUUID()
    }
    savedTrips.set(userId, userTrips?.concat([trip]) as Trip[]);

    res.json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ error });
  }
});

// update a carpool
carpoolRouter.put('/', async (req: Request<{}, {}, { userId: UUID, update: Carpool}>, res: Response, next: NextFunction) => {
  try {
    const { userId, update } = req.body;
    if (!carpools.has(userId)) {
      carpools.set(userId, []);
    }
    const userCarpools = carpools.get(userId)?.slice() as Carpool[];
    let data;
    for (let i = 0; i < userCarpools?.length; i++) {
      const aCarpool = userCarpools[i];
      if (aCarpool.id === update.id) {
        data = {
          ...aCarpool,
          ...update
        }
        userCarpools[i] = data;
      }
      break;
    }

    // TODO: remove this previously pending carpool from all friends except for confirmed friend

    carpools.set(userId, userCarpools);

    res.json({ success:true, data })
    
  } catch (error) {
    res.status(500).json({ error });
  }
});

carpoolRouter.put('/trip', async (req: Request<{}, {}, { userId: UUID, trip: Trip}>, res: Response, next: NextFunction) => {
  try {
    const { userId, trip } = req.body;
    if (!savedTrips.has(userId)) {
      savedTrips.set(userId, []);
    }
    const userTrips = savedTrips.get(userId)?.slice() as Trip[];
    
    for (let i = 0; i < userTrips?.length; i++) {
      const aTrip= userTrips[i];
      if (aTrip.id === trip.id) {
        userTrips[i] = {
          ...aTrip,
          ...trip
        }
      }
      break;
    }

    savedTrips.set(userId, userTrips);
    res.json({ success:true, data: trip })
    
  } catch (error) {
    res.status(500).json({ error });
  }
});

export default carpoolRouter;