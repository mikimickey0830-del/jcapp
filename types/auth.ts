import type { AnnualRole } from "@/types/common";

export type AuthMember = {
  id: string;
  authUserId: string;
  lomId: string;
  name: string;
  email: string;
  roles: AnnualRole[];
};

export type AuthContext = {
  userId?: string;
  userEmail?: string;
  member?: AuthMember;
  isAuthenticated: boolean;
  canManage: boolean;
  mustChangePassword?: boolean;
  error: string | null;
};
