import mongoose, { Schema, models, model } from "mongoose";

// Audit trail for DPDP consent-before-AI-processing (UPLOAD-04, PRD Section 6).
export interface IConsentLog {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  purpose: "ai_mood_analysis";
  grantedAt: Date;
}

const ConsentLogSchema = new Schema<IConsentLog>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  purpose: { type: String, enum: ["ai_mood_analysis"], required: true },
  grantedAt: { type: Date, default: Date.now },
});

export default models.ConsentLog || model<IConsentLog>("ConsentLog", ConsentLogSchema);
