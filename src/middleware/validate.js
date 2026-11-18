import { ApiError } from "../utils/ApiError.js";

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });
  if (!result.success) {
    return next(ApiError.badRequest("Validation failed", result.error.issues));
  }
  req.validated = result.data;
  next();
};
