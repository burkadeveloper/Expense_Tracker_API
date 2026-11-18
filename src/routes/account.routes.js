import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createAccountSchema,
  updateAccountSchema,
  transferSchema,
} from "../validators/account.validator.js";
import * as c from "../controllers/account.controller.js";
import * as tx from "../controllers/transaction.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/", c.list);
router.post("/", validate(createAccountSchema), c.create);
router.patch("/:id", validate(updateAccountSchema), c.update);
router.post("/:id/archive", c.archive);
router.delete("/:id", c.remove);
router.post("/transfer", validate(transferSchema), tx.transfer);

export default router;
