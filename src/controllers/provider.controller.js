import Provider from "../models/Provider.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const ok = (res, data, message = "OK", status = 200) =>
  res.status(status).json({ success: true, data, message, errors: [] });

export const list = asyncHandler(async (req, res) => {
  const providers = await Provider.find({ active: true }).sort({
    kind: 1,
    name: 1,
  });
  ok(res, { providers });
});
