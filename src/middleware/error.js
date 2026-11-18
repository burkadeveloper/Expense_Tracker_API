import { ApiError } from "../utils/ApiError.js";

export function notFoundHandler(req, res) {
  res
    .status(404)
    .json({ success: false, data: null, message: "Not found", errors: [] });
}

export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const message = err.message || "Server error";
  if (status >= 500) console.error("[error]", err);
  res.status(status).json({
    success: false,
    data: null,
    message,
    errors: err.errors || [],
  });
}

export { ApiError };
