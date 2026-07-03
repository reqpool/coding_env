export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { Navigation } from "@/components/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navigation userName={session.user.name || session.user.email} />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
