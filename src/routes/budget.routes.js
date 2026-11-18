import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createBudgetSchema } from "../validators/budget.validator.js";
import * as c from "../controllers/budget.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/", c.list);
router.post("/", validate(createBudgetSchema), c.create);
router.patch("/:id", c.update);
router.delete("/:id", c.remove);

export default router;
