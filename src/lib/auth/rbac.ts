import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { UserRole } from "@/types";

/**
 * Retrieves the current session user on the server side.
 */
export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

/**
 * Enforces authenticated session; throws UNAUTHORIZED if not authenticated.
 */
export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    const error = new Error("Authentication required");
    error.name = "UNAUTHORIZED";
    throw error;
  }
  return user;
}

/**
 * Enforces role-based authorization; throws FORBIDDEN if user role is not permitted.
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    const error = new Error(`Access forbidden. Required role: ${allowedRoles.join(" or ")}`);
    error.name = "FORBIDDEN";
    throw error;
  }
  return user;
}
