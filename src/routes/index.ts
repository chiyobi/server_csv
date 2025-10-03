import { Router, Request, Response, NextFunction } from "express";
import { logMessageCSV } from "../utils/fileLogger";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({ message: "🚀 TypeScript Node Server is running!" });
});

interface EntryRequestBody {
  name: string;
  email: string;
  zipcode: string;
}

router.post("/api/entry", async (req: Request<{}, {}, EntryRequestBody>, res: Response, next: NextFunction) => {
  const { name, email, zipcode } = req.body;
  console.log("req.body", req.body);

  if (!name || !email || !zipcode) {
    // Instead of sending response here, pass error to middleware
    const err = new Error("Name, email, and zipcode are required.");
    res.status(400);
    return next(err);
  }

  try {
    await logMessageCSV(name, email, zipcode);
    res.json({ success: true, saved: req.body });
  } catch (err) {
    res.status(500).json({ error: "Failed to save message" });
  }

});


export default router;
