import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as c from "../controllers/category.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/", c.list);
router.post("/", c.create);
router.patch("/:id", c.update);
router.delete("/:id", c.remove);

export default router;
