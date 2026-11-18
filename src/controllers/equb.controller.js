import Equb from "../models/Equb.js";
import EqubPayment from "../models/EqubPayment.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ok, created } from "../utils/response.js";

const FREQUENCIES = ["weekly", "biweekly", "monthly"];
const EDITABLE = [
  "name",
  "contributionMinor",
  "frequency",
  "members",
  "startDate",
  "payoutRound",
  "payoutDate",
  "receivedPayout",
  "account",
];

function validateEqubInput(body, { partial = false } = {}) {
  const errors = [];
  if (!partial || "name" in body) {
    if (typeof body.name !== "string" || !body.name.trim())
      errors.push({ path: ["name"], message: "Name is required" });
  }
  if (!partial || "contributionMinor" in body) {
    if (!Number.isInteger(body.contributionMinor) || body.contributionMinor <= 0)
      errors.push({
        path: ["contributionMinor"],
        message: "contributionMinor must be a positive integer (santim)",
      });
  }
  if (!partial || "members" in body) {
    if (!Number.isInteger(body.members) || body.members < 2)
      errors.push({ path: ["members"], message: "members must be at least 2" });
  }
  if ("frequency" in body && !FREQUENCIES.includes(body.frequency))
    errors.push({
      path: ["frequency"],
      message: `frequency must be one of ${FREQUENCIES.join(", ")}`,
    });
  if (errors.length) throw ApiError.badRequest("Validation failed", errors);
}

async function findOwned(req) {
  const equb = await Equb.findOne({ _id: req.params.id, user: req.user._id });
  if (!equb) throw ApiError.notFound("Equb not found");
  return equb;
}

export const list = asyncHandler(async (req, res) => {
  const equbs = await Equb.find({ user: req.user._id, archivedAt: null }).sort({
    createdAt: -1,
  });
  // Total contributed per Equb
  const totals = await EqubPayment.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: "$equb", paidMinor: { $sum: "$amountMinor" }, count: { $sum: 1 } } },
  ]);
  const byId = new Map(totals.map((t) => [String(t._id), t]));
  const items = equbs.map((e) => ({
    ...e.toObject(),
    paidMinor: byId.get(String(e._id))?.paidMinor || 0,
    paymentCount: byId.get(String(e._id))?.count || 0,
    potMinor: e.contributionMinor * e.members,
  }));
  ok(res, { equbs: items });
});

export const create = asyncHandler(async (req, res) => {
  validateEqubInput(req.body);
  const data = {};
  for (const k of EDITABLE) if (k in req.body) data[k] = req.body[k];
  const equb = await Equb.create({ ...data, user: req.user._id });
  created(res, { equb });
});

export const getOne = asyncHandler(async (req, res) => {
  const equb = await findOwned(req);
  const payments = await EqubPayment.find({
    user: req.user._id,
    equb: equb._id,
  }).sort({ date: -1 });
  ok(res, { equb, payments });
});

export const update = asyncHandler(async (req, res) => {
  validateEqubInput(req.body, { partial: true });
  const equb = await findOwned(req);
  for (const k of EDITABLE) if (k in req.body) equb[k] = req.body[k];
  await equb.save();
  ok(res, { equb }, "Updated");
});

export const archive = asyncHandler(async (req, res) => {
  const equb = await findOwned(req);
  equb.archivedAt = new Date();
  await equb.save();
  ok(res, { equb }, "Archived");
});

export const addPayment = asyncHandler(async (req, res) => {
  const equb = await findOwned(req);
  const { amountMinor, date, round, notes } = req.body;
  const amount = amountMinor ?? equb.contributionMinor;
  if (!Number.isInteger(amount) || amount <= 0)
    throw ApiError.badRequest("amountMinor must be a positive integer");
  const when = date ? new Date(date) : new Date();
  if (Number.isNaN(when.getTime())) throw ApiError.badRequest("Invalid date");
  const payment = await EqubPayment.create({
    user: req.user._id,
    equb: equb._id,
    amountMinor: amount,
    date: when,
    round,
    notes,
  });
  created(res, { payment });
});

export const removePayment = asyncHandler(async (req, res) => {
  const r = await EqubPayment.deleteOne({
    _id: req.params.paymentId,
    equb: req.params.id,
    user: req.user._id,
  });
  if (!r.deletedCount) throw ApiError.notFound("Payment not found");
  ok(res, null, "Deleted");
});

export const markPayoutReceived = asyncHandler(async (req, res) => {
  const equb = await findOwned(req);
  equb.receivedPayout = true;
  if (req.body?.payoutDate) equb.payoutDate = new Date(req.body.payoutDate);
  await equb.save();
  ok(res, { equb }, "Payout recorded");
});
