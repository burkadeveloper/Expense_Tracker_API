import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ethiopianMonthRange } from "../utils/ethiopianCalendar.js";

const ok = (res, data, message = "OK", status = 200) =>
  res.status(status).json({ success: true, data, message, errors: [] });

export const dashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1) - 1);

  const accounts = await Account.find({ user: req.user._id, archivedAt: null });
  const totalBalanceMinor = accounts.reduce((s, a) => s + a.balanceMinor, 0);

  const agg = await Transaction.aggregate([
    {
      $match: {
        user: req.user._id,
        deletedAt: null,
        date: { $gte: start, $lte: end },
        type: { $in: ["income", "expense"] },
      },
    },
    { $group: { _id: "$type", total: { $sum: "$amountMinor" } } },
  ]);
  const incomeMinor = agg.find((x) => x._id === "income")?.total || 0;
  const expenseMinor = agg.find((x) => x._id === "expense")?.total || 0;

  const topCats = await Transaction.aggregate([
    {
      $match: {
        user: req.user._id,
        deletedAt: null,
        type: "expense",
        date: { $gte: start, $lte: end },
        category: { $ne: null },
      },
    },
    { $group: { _id: "$category", total: { $sum: "$amountMinor" } } },
    { $sort: { total: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "cat",
      },
    },
    { $unwind: "$cat" },
  ]);

  const recent = await Transaction.find({ user: req.user._id, deletedAt: null })
    .sort({ date: -1 })
    .limit(5)
    .populate("category", "name")
    .populate("fromAccount", "name")
    .populate("toAccount", "name");

  ok(res, {
    totalBalanceMinor,
    incomeMinor,
    expenseMinor,
    topCategories: topCats,
    recentTransactions: recent,
    periodStart: start,
    periodEnd: end,
  });
});

export const byCategory = asyncHandler(async (req, res) => {
  const { from, to, type = "expense" } = req.query;
  const match = {
    user: req.user._id,
    deletedAt: null,
    type,
    category: { $ne: null },
  };
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) match.date.$lte = new Date(to);
  }
  const rows = await Transaction.aggregate([
    { $match: match },
    { $group: { _id: "$category", total: { $sum: "$amountMinor" } } },
    { $sort: { total: -1 } },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "cat",
      },
    },
    { $unwind: "$cat" },
  ]);
  ok(res, { rows });
});

export const monthlyTrend = asyncHandler(async (req, res) => {
  const { months = 6 } = req.query;
  const now = new Date();
  const from = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (Number(months) - 1), 1),
  );
  const rows = await Transaction.aggregate([
    {
      $match: {
        user: req.user._id,
        deletedAt: null,
        type: { $in: ["income", "expense"] },
        date: { $gte: from },
      },
    },
    {
      $group: {
        _id: { y: { $year: "$date" }, m: { $month: "$date" }, type: "$type" },
        total: { $sum: "$amountMinor" },
      },
    },
    { $sort: { "_id.y": 1, "_id.m": 1 } },
  ]);
  ok(res, { rows });
});

export const ethiopianMonthReport = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  const { start, end } = ethiopianMonthRange(Number(year), Number(month));
  const rows = await Transaction.aggregate([
    {
      $match: {
        user: req.user._id,
        deletedAt: null,
        date: { $gte: start, $lte: end },
      },
    },
    { $group: { _id: "$type", total: { $sum: "$amountMinor" } } },
  ]);
  ok(res, { start, end, totals: rows });
});
