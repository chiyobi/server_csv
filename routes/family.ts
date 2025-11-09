import { Router, Request, Response, NextFunction } from "express";
import { UUID, FamilyMember, families } from "../db";
import { generateUUID } from "../utils";

const familyRouter = Router();

// get all family of user
familyRouter.get('/', async (req: Request<{}, {}, {}, {userId: UUID}>, res: Response, next: NextFunction) => {
  let data = [] as FamilyMember[] | undefined;
  try {
    const { userId: id } = req.query;

    if (families.has(id)) {
      const fam = families.get(id);
      if (fam) {
        data = [...fam];
      }
    } else {
      families.set(id, []);
    }

  } catch (error) {
    res.status(404).json({ error });
  }

  res.json({ success: true, data })
});

// delete a family member
familyRouter.delete('/', async (req: Request<{}, {}, { id: UUID; idToDelete: UUID }>, res: Response, next: NextFunction) => {
  try {
    const { id, idToDelete } = req.body;

    if (!families.has(id)) {
      families.set(id, []);
    }

    const userFamily = families.get(id) as FamilyMember[];
    let updated = userFamily?.filter(({id: memberId}) => memberId !== idToDelete);
    families.set(id, updated);

    res.json({ success: true });

  } catch (error) {
    res.status(404).json({ error });
  }
  
});

// add a family member
familyRouter.post('/', async (req: Request<{}, {}, {userId: UUID, familyMember: FamilyMember}>, res: Response, next: NextFunction) => {
  try {
    const { familyMember, userId } = req.body;

    if (!families.has(userId)) {
      families.set(userId, []);
    }

    const userFamily = families.get(userId) as FamilyMember[];
    const newMember = {
      ...familyMember,
      id: generateUUID() as UUID
    }

    families.set(userId, userFamily.concat([newMember]));

    res.json({success: true, data: newMember})

  } catch (error) {
    res.status(500).json({ error });
  }
});

familyRouter.put('/', async (req: Request<{}, {}, {userId: UUID, familyMember: FamilyMember}>, res: Response, next: NextFunction) => {
  try {
    const { familyMember, userId } = req.body;

    if (!families.has(userId)) {
      families.set(userId, []);
    }

    const userFamily = [...families.get(userId) as FamilyMember[]];
    for (let i = 0; i < userFamily.length; i++) {
      const member = userFamily[i];
      if (member.id === familyMember.id) {
        userFamily[i] = {
          ...member,
          ...familyMember
        }
        break;
      }
    }

    families.set(userId, userFamily);
    res.json({success: true, data: familyMember })

  } catch (error) {
    res.status(500).json({ error });
  }
});

export default familyRouter;