import mongoose, { Schema, models, model } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  name?: string;
  image?: string;
  passwordHash?: string; // absent for OAuth-only accounts
  authProvider: "credentials" | "google";
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String },
  image: { type: String },
  passwordHash: { type: String },
  authProvider: { type: String, enum: ["credentials", "google"], required: true },
  createdAt: { type: Date, default: Date.now },
});

export default models.User || model<IUser>("User", UserSchema);
