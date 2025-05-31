import mongoose, { Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  phone: string;
  address: string;
  role: "user" | "admin";
  fcmToken?: string;
  createdAt: Date;
}

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  fcmToken: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const User = mongoose.model<IUser>("User", userSchema);
