import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import * as c from "../controllers/admin.controller.js";

const router = Router();
router.use(requireAuth, requireAdmin);

// System stats
router.get("/stats", c.systemStats);

// User management
router.get("/users", c.listUsers);
router.get("/users/:id", c.getUser);
router.patch("/users/:id/role", c.updateUserRole);
router.delete("/users/:id", c.adminDeleteUser);
router.post("/users/:id/restore", c.restoreUser);
router.post("/users/:id/toggle-active", c.toggleUserActive);

// User content inspection
router.get("/users/:id/accounts", c.getUserAccounts);
router.get("/users/:id/transactions", c.getUserTransactions);

// Provider management
router.get("/providers", c.listProviders);
router.post("/providers", c.createProvider);
router.patch("/providers/:id", c.updateProvider);
router.delete("/providers/:id", c.deleteProvider);

// Category management
router.get("/categories", c.listAllCategories);
router.post("/categories", c.createDefaultCategory);
router.delete("/categories/:id", c.deleteCategory);

export default router;
