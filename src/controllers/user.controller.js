import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Account from "../models/Account.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const ok = (res, data, message = "OK", status = 200) =>
  res.status(status).json({ success: true, data, message, errors: [] });

export const updateMe = asyncHandler(async (req, res) => {
  const allowed = [
    "name",
    "locale",
    "calendar",
    "currency",
    "theme",
    "dataSaver",
    "onboarded",
    "email",
    "phone",
    "avatar",
  ];
  for (const k of allowed) if (k in req.body) req.user[k] = req.body[k];
  await req.user.save();
  ok(res, { user: req.user.toSafe() }, "Updated");
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  const { avatar } = req.body;
  if (!avatar) throw ApiError.badRequest("avatar data URL required");
  // Basic validation: must be a data URL, max ~2MB
  if (!avatar.startsWith("data:image/"))
    throw ApiError.badRequest("avatar must be a data URL for an image");
  if (avatar.length > 2 * 1024 * 1024)
    throw ApiError.badRequest("Image too large (max 2MB)");
  req.user.avatar = avatar;
  await req.user.save();
  ok(res, { user: req.user.toSafe() }, "Avatar updated");
});

export const removeAvatar = asyncHandler(async (req, res) => {
  req.user.avatar = null;
  await req.user.save();
  ok(res, { user: req.user.toSafe() }, "Avatar removed");
});

export const exportAll = asyncHandler(async (req, res) => {
  const [accounts, transactions] = await Promise.all([
    Account.find({ user: req.user._id }),
    Transaction.find({ user: req.user._id }),
  ]);
  ok(
    res,
    {
      exportedAt: new Date().toISOString(),
      user: req.user.toSafe(),
      accounts,
      transactions,
    },
    "Exported",
  );
});

export const deleteMe = asyncHandler(async (req, res) => {
  req.user.deletedAt = new Date();
  await req.user.save();
  ok(res, null, "Account scheduled for deletion");
});
