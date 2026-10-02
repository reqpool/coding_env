import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";

export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "admin") throw new Error("Forbidden");
  return session;
}
