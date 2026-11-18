import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as c from "../controllers/equb.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/", c.list);
router.post("/", c.create);
router.get("/:id", c.getOne);
router.patch("/:id", c.update);
router.post("/:id/archive", c.archive);
router.post("/:id/payments", c.addPayment);
router.delete("/:id/payments/:paymentId", c.removePayment);
router.post("/:id/payout-received", c.markPayoutReceived);

export default router;
