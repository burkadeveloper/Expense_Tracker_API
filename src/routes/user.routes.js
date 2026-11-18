import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as c from "../controllers/user.controller.js";

const router = Router();
router.use(requireAuth);
router.patch("/me", c.updateMe);
router.post("/me/avatar", c.uploadAvatar);
router.delete("/me/avatar", c.removeAvatar);
router.get("/export", c.exportAll);
router.delete("/me", c.deleteMe);

export default router;
