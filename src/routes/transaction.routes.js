import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionSchema,
} from "../validators/transaction.validator.js";
import * as c from "../controllers/transaction.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/", validate(listTransactionSchema), c.list);
router.post("/", validate(createTransactionSchema), c.create);
router.post("/sync", c.syncBatch);
router.get("/:id", c.getOne);
router.patch("/:id", validate(updateTransactionSchema), c.update);
router.delete("/:id", c.softDelete);
router.post("/:id/undo", c.undoDelete);

export default router;
