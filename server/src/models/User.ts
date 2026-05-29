import mongoose, { type InferSchemaType } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["buyer", "admin"], default: "buyer", required: true },
    country: { type: String, required: false, trim: true },
    accountStatus: { type: String, enum: ["active", "suspended"], default: "active", index: true }
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

userSchema.pre("save", async function preSave(next) {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  (this as unknown as { password: string }).password = await bcrypt.hash(
    (this as unknown as { password: string }).password,
    salt
  );
});

userSchema.methods.comparePassword = async function comparePassword(candidate: string) {
  // password is selected only when needed
  return bcrypt.compare(candidate, this.password);
};

export type UserDoc = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
  comparePassword(candidate: string): Promise<boolean>;
};

export const User = mongoose.model<UserDoc>("User", userSchema);
