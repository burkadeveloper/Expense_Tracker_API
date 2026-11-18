import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const ok = (res, data, message = "OK", status = 200) =>
  res.status(status).json({ success: true, data, message, errors: [] });

export const list = asyncHandler(async (req, res) => {
  const budgets = await Budget.find({ user: req.user._id }).populate(
    "category",
    "name key",
  );
  // Compute spent per budget within its calendar period
  const enriched = await Promise.all(
    budgets.map(async (b) => {
      let start, end;
      if (b.calendar === "ethiopian") {
        const { ethiopianMonthRange } =
          await import("../utils/ethiopianCalendar.js");
        ({ start, end } = ethiopianMonthRange(b.year, b.month));
      } else {
        start = new Date(Date.UTC(b.year, b.month - 1, 1));
        end = new Date(Date.UTC(b.year, b.month, 1) - 1);
      }
      const filter = {
        user: req.user._id,
        deletedAt: null,
        type: "expense",
        date: { $gte: start, $lte: end },
      };
      if (b.category) filter.category = b.category._id;
      const agg = await Transaction.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: "$amountMinor" } } },
      ]);
      const spentMinor = agg[0]?.total || 0;
      return {
        ...b.toObject(),
        spentMinor,
        periodStart: start,
        periodEnd: end,
      };
    }),
  );
  ok(res, { budgets: enriched });
});

export const create = asyncHandler(async (req, res) => {
  const body = req.validated.body;
  const budget = await Budget.create({ ...body, user: req.user._id });
  ok(res, { budget }, "Created", 201);
});

export const update = asyncHandler(async (req, res) => {
  const budget = await Budget.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true },
  );
  if (!budget) throw ApiError.notFound();
  ok(res, { budget }, "Updated");
});

export const remove = asyncHandler(async (req, res) => {
  const r = await Budget.deleteOne({ _id: req.params.id, user: req.user._id });
  if (!r.deletedCount) throw ApiError.notFound();
  ok(res, null, "Deleted");
});
