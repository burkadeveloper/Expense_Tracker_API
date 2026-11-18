import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const ok = (res, data, message = "OK", status = 200) =>
  res.status(status).json({ success: true, data, message, errors: [] });

export const list = asyncHandler(async (req, res) => {
  const accounts = await Account.find({ user: req.user._id, archivedAt: null })
    .populate("provider", "name kind")
    .sort({ createdAt: 1 });
  ok(res, { accounts });
});

export const create = asyncHandler(async (req, res) => {
  const body = req.validated.body;
  const account = await Account.create({ ...body, user: req.user._id });
  ok(res, { account }, "Created", 201);
});

export const update = asyncHandler(async (req, res) => {
  const account = await Account.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!account) throw ApiError.notFound();
  Object.assign(account, req.validated.body);
  await account.save();
  ok(res, { account }, "Updated");
});

export const archive = asyncHandler(async (req, res) => {
  const account = await Account.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { archivedAt: new Date() },
    { new: true },
  );
  if (!account) throw ApiError.notFound();
  ok(res, { account }, "Archived");
});

export const remove = asyncHandler(async (req, res) => {
  const txCount = await Transaction.countDocuments({
    user: req.user._id,
    $or: [{ fromAccount: req.params.id }, { toAccount: req.params.id }],
  });
  if (txCount > 0)
    throw ApiError.badRequest(
      "Archive instead of deleting: account has transactions",
    );
  const r = await Account.deleteOne({ _id: req.params.id, user: req.user._id });
  if (!r.deletedCount) throw ApiError.notFound();
  ok(res, null, "Deleted");
});
