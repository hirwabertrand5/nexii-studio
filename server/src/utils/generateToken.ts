import jwt from "jsonwebtoken";

export function generateToken(params: { userId: string; role: "buyer" | "admin" }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");

  return jwt.sign(
    { userId: params.userId, role: params.role },
    secret,
    { expiresIn: "7d" }
  );
}

