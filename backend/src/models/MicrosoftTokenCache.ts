import mongoose from "mongoose";

const microsoftTokenCacheSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const MicrosoftTokenCache =
  mongoose.models.MicrosoftTokenCache ||
  mongoose.model("MicrosoftTokenCache", microsoftTokenCacheSchema);
