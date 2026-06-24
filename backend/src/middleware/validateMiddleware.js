import ApiError from "../utils/apiError.js";
// Joi validation middleware for body/params/query.
// Validate the request and replace it with the sanitized payload.

const validateMiddleware = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(
    { body: req.body, params: req.params, query: req.query },
    { abortEarly: false, stripUnknown: true },
  );
  if (error) {
    return next(new ApiError(400, "Invalid request", error.details));
  }

  req.body = value.body;
  req.params = value.params;
  req.query = value.query;
  return next();
};

export default validateMiddleware;
