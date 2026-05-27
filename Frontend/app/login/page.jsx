"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { STORAGE_KEYS, writeStorage } from "../../lib/storage";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const AUTH_API = `${API_BASE_URL}/auth`;

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const getRolePreview = (email) => {
    const value = String(email || "").toLowerCase().trim();

    if (value.endsWith("@admin.com")) return "admin";
    if (value.endsWith("@doctor.com")) return "doctor";
    if (value.endsWith("@nurse.com")) return "nurse";

    return "patient";
  };

  const handleLogin = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      toast.error("Please enter email and password.");
      return;
    }

    if (!API_BASE_URL) {
      toast.error("Frontend API URL is missing. Check NEXT_PUBLIC_API_URL.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${AUTH_API}/login`,
        {
          email: form.email.trim().toLowerCase(),
          password: form.password,
        },
        {
          withCredentials: true,
        }
      );

      const data = response.data;

      if (!data.success) {
        toast.error(data.message || "Login failed.");
        return;
      }

      const user = data.user;

      const loggedInUser = {
        id: user.id,
        name: user.name,
        fullName: user.name,
        email: user.email,
        role: user.role,
        isLoggedIn: true,
      };

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(loggedInUser));

      localStorage.setItem("smartward_token", data.token);
      localStorage.setItem("smartwardUser", JSON.stringify(loggedInUser));

      writeStorage(STORAGE_KEYS.USER, loggedInUser);

      toast.success(`Login successful as ${user.role}.`);
      router.push("/dashboard");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Login failed. Please check your email and password.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const rolePreview = getRolePreview(form.email);

  return (
    <div className="relative flex h-screen box-border items-center justify-center overflow-hidden bg-[#eef5fb] px-4 py-3">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-200/60 blur-3xl" />

      <div className="grid h-full max-h-[590px] w-full max-w-5xl overflow-hidden rounded-[26px] border border-white bg-white shadow-[0_24px_70px_rgba(15,23,42,0.13)] lg:grid-cols-[0.9fr_1.1fr]">
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
                Your role is detected automatically from your registered
                account.
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600">
                  Email
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
                  Detected Role
                </label>

                <div className="flex h-10 w-full items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 text-sm font-bold capitalize text-[#074fae]">
                  <span>{rolePreview}</span>
                  <span className="text-[11px] font-semibold normal-case text-slate-500">
                    Auto assigned
                  </span>
                </div>
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
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="font-bold text-[#074fae] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="mt-2 h-10 w-full rounded-xl bg-[#074fae] text-sm font-bold text-white shadow-[0_12px_26px_rgba(7,79,174,0.25)] transition hover:-translate-y-0.5 hover:bg-[#053d88] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <p className="pt-2 text-center text-xs text-slate-500">
                New to SmartWard?{" "}
                <button
                  type="button"
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