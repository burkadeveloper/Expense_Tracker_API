import { Router } from "express";
import auth from "./auth.routes.js";
import accounts from "./account.routes.js";
import transactions from "./transaction.routes.js";
import categories from "./category.routes.js";
import budgets from "./budget.routes.js";
import reports from "./report.routes.js";
import providers from "./provider.routes.js";
import sms from "./sms.routes.js";
import users from "./user.routes.js";
import equbs from "./equb.routes.js";
import admin from "./admin.routes.js";

const router = Router();
router.use("/auth", auth);
router.use("/accounts", accounts);
router.use("/transactions", transactions);
router.use("/categories", categories);
router.use("/budgets", budgets);
router.use("/reports", reports);
router.use("/providers", providers);
router.use("/sms", sms);
router.use("/users", users);
router.use("/equbs", equbs);
router.use("/admin", admin);

router.get("/health", (req, res) => res.json({ ok: true, ts: Date.now() }));
export default router;
