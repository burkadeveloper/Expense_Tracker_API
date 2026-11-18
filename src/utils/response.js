// Consistent API response shape: { success, data, message, errors }
export const ok = (res, data = null, message = "OK", status = 200) =>
  res.status(status).json({ success: true, data, message, errors: [] });

export const created = (res, data = null, message = "Created") =>
  ok(res, data, message, 201);

export const fail = (res, status, message, errors = []) =>
  res.status(status).json({ success: false, data: null, message, errors });
