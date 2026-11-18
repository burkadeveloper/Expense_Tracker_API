import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as c from "../controllers/provider.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/", c.list);

export default router;
