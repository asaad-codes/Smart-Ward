"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { STORAGE_KEYS, writeStorage } from "../../lib/storage";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "",
  });

  const handleLogin = () => {
    if (!form.email.trim() || !form.password.trim() || !form.role.trim()) {
      toast.error("Please fill all login fields.");
      return;
    }

    const savedUserRaw = localStorage.getItem("smartwardUser");

    if (!savedUserRaw) {
      toast.error("No account found. Please create an account first.");
      router.push("/register");
      return;
    }

    let savedUser = null;

    try {
      savedUser = JSON.parse(savedUserRaw);
    } catch {
      toast.error("Saved account data is corrupted. Please register again.");
      router.push("/register");
      return;
    }

    const emailMatched =
      savedUser.email?.toLowerCase() === form.email.trim().toLowerCase();

    const passwordMatched = savedUser.password === form.password;
    const roleMatched = savedUser.role === form.role;

    if (!emailMatched || !passwordMatched || !roleMatched) {
      toast.error(
        "Invalid credentials. Please use your registered email, password, and role."
      );
      return;
    }

    writeStorage(STORAGE_KEYS.USER, {
      fullName: savedUser.fullName,
      email: savedUser.email,
      role: savedUser.role,
      isLoggedIn: true,
    });

    toast.success("Login successful.");
    router.push("/dashboard");
  };

  return (
    <div className="relative flex h-screen box-border items-center justify-center overflow-hidden bg-[#eef5fb] px-4 py-3">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-200/60 blur-3xl" />

      <div className="grid h-full max-h-[590px] w-full max-w-5xl overflow-hidden rounded-[26px] border border-white bg-white shadow-[0_24px_70px_rgba(15,23,42,0.13)] lg:grid-cols-[0.9fr_1.1fr]">
        
        {/* Left Section */}
        <div className="relative hidden h-full overflow-hidden bg-[#074fae] px-9 py-8 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.20),transparent_25%),radial-gradient(circle_at_80%_80%,rgba(125,211,252,0.20),transparent_30%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#05336f] to-transparent" />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <div className="mb-9">
                <h1 className="text-2xl font-extrabold tracking-tight">
                  SmartWard
                </h1>
                <p className="mt-1 text-xs text-blue-100">
                  Clinical Management Platform
                </p>
              </div>

              <div className="mb-5 inline-flex rounded-full border border-white/20 bg-white/12 px-4 py-1.5 text-[11px] font-semibold text-blue-50 backdrop-blur">
                Secure hospital workspace
              </div>

              <h2 className="max-w-sm text-[30px] font-bold leading-[1.18] tracking-tight">
                Smarter care starts with better clinical access.
              </h2>

              <p className="mt-5 max-w-sm text-[14px] leading-7 text-blue-100">
                Manage patient records, ward activity, vitals, medication
                schedules, and emergency alerts from one clean dashboard.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                <p className="text-base font-bold">Live</p>
                <p className="mt-1 text-[11px] leading-4 text-blue-100">
                  Ward updates
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                <p className="text-base font-bold">Fast</p>
                <p className="mt-1 text-[11px] leading-4 text-blue-100">
                  Patient access
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                <p className="text-base font-bold">Safe</p>
                <p className="mt-1 text-[11px] leading-4 text-blue-100">
                  Record control
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Login Section */}
        <div className="flex h-full items-center justify-center px-6 py-5 sm:px-10">
          <div className="w-full max-w-[390px]">
            <div className="mb-6">
              <div className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#074fae]">
                Secure Clinical Access
              </div>

              <h2 className="text-[27px] font-bold leading-tight tracking-tight text-slate-950">
                Sign in to continue
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Access your dashboard, patient records, vitals, wards, and
                medication schedule securely.
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Email or Username
                </label>

                <input
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="name@clinical.com"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#074fae] focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Password
                </label>

                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="Enter password"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#074fae] focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Clinical Role
                </label>

                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-[#074fae] focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Select role</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Nurse">Nurse</option>
                  <option value="Patient">Patient</option>
                  <option value="Lab Technician">Lab Technician</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex cursor-pointer items-center gap-2 text-slate-500">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 rounded border-slate-300"
                  />
                  Remember me
                </label>

                <button
                  onClick={() => router.push("/forgot-password")}
                  className="font-bold text-[#074fae] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                onClick={handleLogin}
                className="mt-2 h-10 w-full rounded-xl bg-[#074fae] text-sm font-bold text-white shadow-[0_12px_26px_rgba(7,79,174,0.25)] transition hover:-translate-y-0.5 hover:bg-[#053d88] active:translate-y-0"
              >
                Login
              </button>

              <p className="pt-2 text-center text-xs text-slate-500">
                New to SmartWard?{" "}
                <button
                  onClick={() => router.push("/register")}
                  className="font-bold text-[#074fae] hover:underline"
                >
                  Create Account
                </button>
              </p>
            </div>

            <p className="mt-5 text-center text-[11px] leading-5 text-slate-400">
              Protected access for authorized clinical users only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}