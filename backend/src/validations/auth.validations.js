import Joi from "joi";

// Validate student registration payload.

const registerSchema = Joi.object({
  body: Joi.object({
    registrationNumber: Joi.string().required(),
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }).required(),
  params: Joi.object({}).required(),
  query: Joi.object({}).required(),
});

// Validate login payload.
const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    role: Joi.string().valid("admin", "teacher", "student"),
  }).required(),
  params: Joi.object({}).required(),
  query: Joi.object({}).required(),
});

// Validate change password payload.
const changePasswordSchema = Joi.object({
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
  }).required(),
  params: Joi.object({}).required(),
  query: Joi.object({}).required(),
});

export { registerSchema, loginSchema, changePasswordSchema };
