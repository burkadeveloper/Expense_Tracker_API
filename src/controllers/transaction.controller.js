import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const ok = (res, data, message = "OK", status = 200) =>
  res.status(status).json({ success: true, data, message, errors: [] });

// Applies the balance change to accounts. Simple atomic increments — retry-safe
// when paired with idempotencyKey on the transaction.
async function applyBalance(tx, direction = 1) {
  const sign = direction === 1 ? 1 : -1;
  if (tx.type === "expense" && tx.fromAccount) {
    await Account.updateOne(
      { _id: tx.fromAccount },
      { $inc: { balanceMinor: -tx.amountMinor * sign } },
    );
  } else if (tx.type === "income" && tx.toAccount) {
    await Account.updateOne(
      { _id: tx.toAccount },
      { $inc: { balanceMinor: tx.amountMinor * sign } },
    );
  } else if (tx.type === "transfer") {
    const fromAmt = tx.fromAmountMinor ?? tx.amountMinor;
    const toAmt = tx.toAmountMinor ?? tx.amountMinor;
    if (tx.fromAccount)
      await Account.updateOne(
        { _id: tx.fromAccount },
        { $inc: { balanceMinor: -fromAmt * sign } },
      );
    if (tx.toAccount)
      await Account.updateOne(
        { _id: tx.toAccount },
        { $inc: { balanceMinor: toAmt * sign } },
      );
  }
}

export const create = asyncHandler(async (req, res) => {
  const body = req.validated.body;
  // Idempotency check
  if (body.idempotencyKey) {
    const existing = await Transaction.findOne({
      user: req.user._id,
      idempotencyKey: body.idempotencyKey,
    });
    if (existing)
      return ok(
        res,
        { transaction: existing, duplicate: true },
        "Already exists",
      );
  }

  if (body.type === "expense" && !body.fromAccount)
    throw ApiError.badRequest("fromAccount required for expense");
  if (body.type === "income" && !body.toAccount)
    throw ApiError.badRequest("toAccount required for income");
  if (body.type === "transfer" && (!body.fromAccount || !body.toAccount))
    throw ApiError.badRequest("Both accounts required");

  const tx = await Transaction.create({
    ...body,
    date: new Date(body.date),
    user: req.user._id,
  });
  await applyBalance(tx, 1);
  ok(res, { transaction: tx }, "Created", 201);
});

export const list = asyncHandler(async (req, res) => {
  const { page, limit, type, account, category, from, to, q } =
    req.validated.query;
  const filter = { user: req.user._id, deletedAt: null };
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (account) filter.$or = [{ fromAccount: account }, { toAccount: account }];
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }
  if (q) {
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [
          { payee: { $regex: q, $options: "i" } },
          { notes: { $regex: q, $options: "i" } },
        ],
      },
    ];
  }
  const total = await Transaction.countDocuments(filter);
  const items = await Transaction.find(filter)
    .populate("category", "name key kind")
    .populate("fromAccount", "name type")
    .populate("toAccount", "name type")
    .sort({ date: -1, _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  ok(res, { items, page, limit, total, pages: Math.ceil(total / limit) });
});

export const getOne = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({
    _id: req.params.id,
    user: req.user._id,
    deletedAt: null,
  });
  if (!tx) throw ApiError.notFound();
  ok(res, { transaction: tx });
});

export const update = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({
    _id: req.params.id,
    user: req.user._id,
    deletedAt: null,
  });
  if (!tx) throw ApiError.notFound();
  // Reverse old balance then apply new
  await applyBalance(tx, -1);
  Object.assign(tx, req.validated.body);
  if (req.validated.body.date) tx.date = new Date(req.validated.body.date);
  await tx.save();
  await applyBalance(tx, 1);
  ok(res, { transaction: tx }, "Updated");
});

export const softDelete = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({
    _id: req.params.id,
    user: req.user._id,
    deletedAt: null,
  });
  if (!tx) throw ApiError.notFound();
  await applyBalance(tx, -1);
  tx.deletedAt = new Date();
  await tx.save();
  ok(res, { transaction: tx }, "Deleted");
});

export const undoDelete = asyncHandler(async (req, res) => {
  const tx = await Transaction.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!tx) throw ApiError.notFound();
  if (!tx.deletedAt) throw ApiError.badRequest("Not deleted");
  tx.deletedAt = null;
  await tx.save();
  await applyBalance(tx, 1);
  ok(res, { transaction: tx }, "Restored");
});

export const transfer = asyncHandler(async (req, res) => {
  const body = req.validated.body;
  if (String(body.fromAccount) === String(body.toAccount))
    throw ApiError.badRequest("Cannot transfer to same account");
  const tx = await Transaction.create({
    user: req.user._id,
    type: "transfer",
    amountMinor: body.fromAmountMinor,
    fromAmountMinor: body.fromAmountMinor,
    toAmountMinor: body.toAmountMinor ?? body.fromAmountMinor,
    fromAccount: body.fromAccount,
    toAccount: body.toAccount,
    date: body.date ? new Date(body.date) : new Date(),
    notes: body.notes,
    paymentMethod: "bank_transfer",
  });
  await applyBalance(tx, 1);
  ok(res, { transaction: tx }, "Transfer created", 201);
});

// Sync offline queue — accepts array of transactions with idempotency keys
export const syncBatch = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const results = [];
  for (const raw of items) {
    try {
      const existing =
        raw.idempotencyKey &&
        (await Transaction.findOne({
          user: req.user._id,
          idempotencyKey: raw.idempotencyKey,
        }));
      if (existing) {
        results.push({
          idempotencyKey: raw.idempotencyKey,
          transaction: existing,
          duplicate: true,
        });
        continue;
      }
      const tx = await Transaction.create({
        ...raw,
        date: new Date(raw.date),
        user: req.user._id,
      });
      await applyBalance(tx, 1);
      results.push({ idempotencyKey: raw.idempotencyKey, transaction: tx });
    } catch (e) {
      results.push({ idempotencyKey: raw.idempotencyKey, error: e.message });
    }
  }
  ok(res, { results }, "Synced");
});
