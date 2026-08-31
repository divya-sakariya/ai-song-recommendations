import mongoose, { Schema, models, model } from "mongoose";

// SHORTLIST-05: "this case is logged for future catalog-quality review"
// when a suggested song has no valid link in the user's region.
export interface IRegionLockLog {
  _id: mongoose.Types.ObjectId;
  title: string;
  artist: string;
  reason: "region_locked" | "unavailable";
  createdAt: Date;
}

const RegionLockLogSchema = new Schema<IRegionLockLog>({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  reason: { type: String, enum: ["region_locked", "unavailable"], required: true },
  createdAt: { type: Date, default: Date.now },
});

export default models.RegionLockLog || model<IRegionLockLog>("RegionLockLog", RegionLockLogSchema);
