import { parseSms } from "../services/smsParser/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const ok = (res, data, message = "OK", status = 200) =>
  res.status(status).json({ success: true, data, message, errors: [] });

export const parse = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const result = await parseSms(String(text || ""));
  ok(res, result);
});
