"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ children, topbarProps = {} }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const allowedRoutes = useMemo(() => {
    return {
      admin: [
        "/dashboard",
        "/patients",
        "/wards",
        "/vitals",
        "/medications",
        "/ai-assistant",
        "/reports",
      ],

      doctor: [
        "/dashboard",
        "/patients",
        "/wards",
        "/vitals",
        "/medications",
        "/ai-assistant",
        "/reports",
      ],

      nurse: [
        "/dashboard",
        "/vitals",
        "/medications",
        "/ai-assistant",
      ],

      patient: [
        "/dashboard",
        "/patients",
        "/vitals",
        "/medications",
        "/reports",
        "/ai-assistant",
      ],
    };
  }, []);

  useEffect(() => {
    setCheckingAuth(true);

    const storedUser =
      localStorage.getItem("smartwardUser") || localStorage.getItem("user");

    const storedToken =
      localStorage.getItem("token") || localStorage.getItem("smartward_token");

    if (!storedUser || !storedToken) {
      localStorage.removeItem("user");
      localStorage.removeItem("smartwardUser");
      localStorage.removeItem("token");
      localStorage.removeItem("smartward_token");
      router.replace("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      const role = String(parsedUser?.role || "").toLowerCase().trim();

      if (!role) {
        localStorage.removeItem("user");
        localStorage.removeItem("smartwardUser");
        localStorage.removeItem("token");
        localStorage.removeItem("smartward_token");
        router.replace("/login");
        return;
      }

      const finalUser = {
        ...parsedUser,
        role,
      };

      localStorage.setItem("user", JSON.stringify(finalUser));
      localStorage.setItem("smartwardUser", JSON.stringify(finalUser));
      localStorage.setItem("token", storedToken);
      localStorage.setItem("smartward_token", storedToken);

      setUser(finalUser);

      const roleRoutes = allowedRoutes[role] || [];

      const isAllowed = roleRoutes.some((route) => {
        return pathname === route || pathname.startsWith(`${route}/`);
      });

      if (!isAllowed) {
        router.replace("/dashboard");
        return;
      }

      setCheckingAuth(false);
    } catch (error) {
      localStorage.removeItem("user");
      localStorage.removeItem("smartwardUser");
      localStorage.removeItem("token");
      localStorage.removeItem("smartward_token");
      router.replace("/login");
    }
  }, [pathname, router, allowedRoutes]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <div className="rounded-2xl bg-white px-6 py-5 shadow-sm border border-slate-200">
          <p className="text-sm font-bold text-slate-700">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex">
        <Sidebar user={user} role={user.role} />

        <main className="flex-1">
          <Topbar {...topbarProps} user={user} role={user.role} />
          <div className="p-7">{children}</div>
        </main>
      </div>
    </div>
  );
} 