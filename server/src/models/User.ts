import mongoose, { type InferSchemaType } from "mongoose";

// Note: password-based authentication is being deprecated in favor of WebAuthn
// Keep the `password` field optional for migration but do not rely on it.
const credentialSchema = new mongoose.Schema(
  {
    credentialID: { type: String, required: true },
    credentialPublicKey: { type: String, required: true },
    counter: { type: Number, required: true, default: 0 },
    transports: [String]
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    // Deprecated: keep optional for migration but do not rely on bcrypt
    password: { type: String, required: false, select: false },
    role: { type: String, enum: ["buyer", "admin"], default: "buyer", required: true },
    country: { type: String, required: false, trim: true },
    // Optional Google OAuth mapping
    googleId: { type: String, required: false, unique: true, sparse: true, index: true },
    // Avatar/profile picture URL (e.g., from Google)
    avatarUrl: { type: String, required: false, trim: true },
    accountStatus: { type: String, enum: ["active", "suspended"], default: "active", index: true },
    // WebAuthn credentials registered for this user
    credentials: { type: [credentialSchema], required: false, default: [] },
    // Temporary storage for in-progress WebAuthn challenge
    currentChallenge: { type: String, required: false }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export type WebAuthnCredential = {
  credentialID: string;
  credentialPublicKey: string;
  counter: number;
  transports?: string[];
};

export type UserDoc = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
  credentials: WebAuthnCredential[];
  currentChallenge?: string | null;
  googleId?: string | null;
  avatarUrl?: string | null;
};

export const User = mongoose.model<UserDoc>("User", userSchema);
