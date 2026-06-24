// Pre-approved student registry used to gate self-registration.

import mongoose from "mongoose";

// Tracks approved student IDs before account creation.
const preApprovedStudentSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    department: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, enum: [4, 8], default: 8 },
    isRegistered: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const PreApprovedStudent = mongoose.model(
  "PreApprovedStudent",
  preApprovedStudentSchema,
);
export default PreApprovedStudent;
