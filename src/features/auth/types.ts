export type UserRole = "buyer" | "admin";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  country: string | null;
  createdAt: string | null;
};

