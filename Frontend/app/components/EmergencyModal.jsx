"use client";

import { useAppContext } from "../context/AppContext";

export default function EmergencyModal() {
  const { emergencyOpen, closeEmergency } = useAppContext();

  if (!emergencyOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
        <div className="mb-4 text-center text-5xl">🚨</div>

        <h2 className="mb-3 text-center text-3xl font-bold text-red-700">
          Emergency Alert
        </h2>

        <p className="text-center text-base leading-7 text-slate-600">
          Emergency alert has been triggered across the system. Please review
          urgent patients and tasks immediately.
        </p>

        <button
          onClick={closeEmergency}
          className="mt-6 w-full rounded-2xl bg-red-600 px-5 py-3 text-base font-bold text-white hover:bg-red-700"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}