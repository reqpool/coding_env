"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calculator,
  Settings,
  BarChart3,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/benchmark", label: "Benchmark", icon: BarChart3 },
  { href: "/admin/profiles", label: "Kalibrierung", icon: Settings },
];

interface NavigationProps {
  userName: string;
}

export function Navigation({ userName }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-56 shrink-0 border-r bg-white flex flex-col h-screen sticky top-0">
      <div className="px-4 py-5 border-b">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-sm">Estimation Manager</span>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              pathname === href
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-100",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-4 border-t space-y-2">
        <p className="text-xs text-gray-500 truncate">{userName}</p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-gray-600"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Abmelden
        </Button>
      </div>
    </aside>
  );
}
