"use client";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({
  children,
  topbarProps = {},
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          <Topbar {...topbarProps} />
          <div className="p-7">{children}</div>
        </main>
      </div>
    </div>
  );
}