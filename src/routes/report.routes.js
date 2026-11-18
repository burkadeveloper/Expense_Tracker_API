import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as c from "../controllers/report.controller.js";

const router = Router();
router.use(requireAuth);
router.get("/dashboard", c.dashboard);
router.get("/by-category", c.byCategory);
router.get("/monthly-trend", c.monthlyTrend);
router.get("/ethiopian-month", c.ethiopianMonthReport);

export default router;
