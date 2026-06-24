import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import config from "../config/env.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    registrationNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    role: {
      type: String,
      enum: ["admin", "teacher", "student"],
      default: "student",
    },
    semester: { type: Number, enum: [4, 8], default: 8 },
    department: { type: String, trim: true },
    assignedGroups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
      },
    ],
    expertise: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    activeGroup: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    supervisorCapacity: {
      type: Number,
      default: config.supervisorDefaultCapacity,
    },
  },
  { timestamps: true },
);

userSchema.index({ role: 1, department: 1, semester: 1 });
userSchema.index({ activeGroup: 1 });
userSchema.index({ assignedGroups: 1 });

// Hash passwords on create or when password is updated.

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (plain) {
  return await bcrypt.compare(plain, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
