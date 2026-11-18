export class ApiError extends Error {
  constructor(status, message, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
  static badRequest(m, e) {
    return new ApiError(400, m, e);
  }
  static unauthorized(m = "Unauthorized") {
    return new ApiError(401, m);
  }
  static forbidden(m = "Forbidden") {
    return new ApiError(403, m);
  }
  static notFound(m = "Not found") {
    return new ApiError(404, m);
  }
  static conflict(m) {
    return new ApiError(409, m);
  }
}
