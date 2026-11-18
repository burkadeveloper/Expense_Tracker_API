import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as c from "../controllers/sms.controller.js";

const router = Router();
router.use(requireAuth);
router.post("/parse", c.parse);

export default router;
