import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, index: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ip: { type: String },
    deviceInfo: { type: String },
    revoked: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true, index: true }
  },
  { timestamps: true }
);

// TTL index to auto-remove expired tokens (MongoDB removes documents when expiresAt passes)
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshTokenDoc = mongoose.InferSchemaType<typeof refreshTokenSchema> & { _id: mongoose.Types.ObjectId };

export const RefreshToken = mongoose.model<RefreshTokenDoc>("RefreshToken", refreshTokenSchema);
