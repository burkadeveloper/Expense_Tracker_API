import User from "../models/User.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import Category from "../models/Category.js";
import Budget from "../models/Budget.js";
import Equb from "../models/Equb.js";
import Provider from "../models/Provider.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ok, created } from "../utils/response.js";

// ===== User management =====

export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const q = req.query.q;

  const filter = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
    ];
  }

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  ok(res, { users, page, limit, total, pages: Math.ceil(total / limit) });
});

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) throw ApiError.notFound("User not found");
  ok(res, { user });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["user", "admin"].includes(role))
    throw ApiError.badRequest("role must be 'user' or 'admin'");
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  user.role = role;
  await user.save();
  ok(res, { user: user.toSafe() }, "Role updated");
});

export const adminDeleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  if (String(user._id) === String(req.user._id))
    throw ApiError.badRequest("Cannot delete your own admin account");
  user.deletedAt = new Date();
  await user.save();
  ok(res, null, "User deleted");
});

export const restoreUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  user.deletedAt = null;
  await user.save();
  ok(res, { user: user.toSafe() }, "User restored");
});

export const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  if (user.deletedAt) {
    user.deletedAt = null;
  } else {
    user.deletedAt = new Date();
  }
  await user.save();
  ok(res, { user: user.toSafe() }, "User status toggled");
});

// ===== System statistics =====

export const systemStats = asyncHandler(async (req, res) => {
  const [totalUsers, activeUsers, deletedUsers, totalAccounts, totalTransactions, totalBudgets, totalEqubs, totalCategories, adminCount] =
    await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ deletedAt: null }),
      User.countDocuments({ deletedAt: { $ne: null } }),
      Account.countDocuments({}),
      Transaction.countDocuments({ deletedAt: null }),
      Budget.countDocuments({}),
      Equb.countDocuments({}),
      Category.countDocuments({}),
      User.countDocuments({ role: "admin", deletedAt: null }),
    ]);

  // Transaction volume (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const volumeAgg = await Transaction.aggregate([
    { $match: { deletedAt: null, date: { $gte: thirtyDaysAgo } } },
    { $group: { _id: "$type", count: { $sum: 1 }, total: { $sum: "$amountMinor" } } },
  ]);

  // New users per day (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const newUsersAgg = await User.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  ok(res, {
    totalUsers,
    activeUsers,
    deletedUsers,
    adminCount,
    totalAccounts,
    totalTransactions,
    totalBudgets,
    totalEqubs,
    totalCategories,
    transactionVolume: volumeAgg,
    newUsersPerDay: newUsersAgg,
  });
});

// ===== Provider management =====

export const listProviders = asyncHandler(async (req, res) => {
  const providers = await Provider.find({}).sort({ kind: 1, name: 1 });
  ok(res, { providers });
});

export const createProvider = asyncHandler(async (req, res) => {
  const { name, kind, active } = req.body;
  if (!name || !kind) throw ApiError.badRequest("name and kind required");
  const existing = await Provider.findOne({ name });
  if (existing) throw ApiError.conflict("Provider name already exists");
  const provider = await Provider.create({
    name,
    kind,
    active: active !== undefined ? active : true,
  });
  created(res, { provider });
});

export const updateProvider = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider) throw ApiError.notFound("Provider not found");
  const { name, kind, active } = req.body;
  if (name !== undefined) provider.name = name;
  if (kind !== undefined) provider.kind = kind;
  if (active !== undefined) provider.active = active;
  await provider.save();
  ok(res, { provider }, "Updated");
});

export const deleteProvider = asyncHandler(async (req, res) => {
  const r = await Provider.deleteOne({ _id: req.params.id });
  if (!r.deletedCount) throw ApiError.notFound("Provider not found");
  ok(res, null, "Deleted");
});

// ===== Category management (system-wide) =====

export const listAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({})
    .populate("user", "name email")
    .sort({ isDefault: -1, kind: 1, "name.en": 1 });
  ok(res, { categories });
});

export const createDefaultCategory = asyncHandler(async (req, res) => {
  const { key, kind, name, icon, color } = req.body;
  if (!key || !kind || !name?.en)
    throw ApiError.badRequest("key, kind, name.en required");
  const existing = await Category.findOne({ user: null, key });
  if (existing) throw ApiError.conflict("Default category with this key exists");
  const category = await Category.create({
    key,
    kind,
    name,
    icon,
    color,
    user: null,
    isDefault: true,
  });
  created(res, { category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findByIdAndDelete(req.params.id);
  if (!cat) throw ApiError.notFound("Category not found");
  ok(res, null, "Deleted");
});

// ===== User content inspection =====

export const getUserAccounts = asyncHandler(async (req, res) => {
  const accounts = await Account.find({ user: req.params.id })
    .populate("provider", "name kind")
    .sort({ createdAt: 1 });
  ok(res, { accounts });
});

export const getUserTransactions = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const filter = { user: req.params.id };
  if (req.query.includeDeleted !== "true") filter.deletedAt = null;
  const total = await Transaction.countDocuments(filter);
  const items = await Transaction.find(filter)
    .populate("category", "name key")
    .populate("fromAccount", "name")
    .populate("toAccount", "name")
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  ok(res, { items, page, limit, total, pages: Math.ceil(total / limit) });
});
