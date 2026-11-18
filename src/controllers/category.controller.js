import Category from "../models/Category.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

const ok = (res, data, message = "OK", status = 200) =>
  res.status(status).json({ success: true, data, message, errors: [] });

export const list = asyncHandler(async (req, res) => {
  const items = await Category.find({
    $or: [{ user: req.user._id }, { user: null }],
    archivedAt: null,
  }).sort({ isDefault: -1, "name.en": 1 });
  ok(res, { categories: items });
});

export const create = asyncHandler(async (req, res) => {
  const { key, kind, name } = req.body;
  if (!key || !kind || !name?.en)
    throw ApiError.badRequest("key, kind, name.en required");
  const cat = await Category.create({ ...req.body, user: req.user._id });
  ok(res, { category: cat }, "Created", 201);
});

export const update = asyncHandler(async (req, res) => {
  const cat = await Category.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true },
  );
  if (!cat) throw ApiError.notFound();
  ok(res, { category: cat }, "Updated");
});

export const remove = asyncHandler(async (req, res) => {
  const cat = await Category.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { archivedAt: new Date() },
    { new: true },
  );
  if (!cat) throw ApiError.notFound();
  ok(res, { category: cat }, "Archived");
});
