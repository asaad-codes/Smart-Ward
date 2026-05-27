"use client";

import { createContext, useContext, useState } from "react";
import toast from "react-hot-toast";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  const openEmergency = () => {
    toast.error("🚨 Emergency Alert Triggered!");
    setEmergencyOpen(true);
  };

  const closeEmergency = () => {
    setEmergencyOpen(false);
  };

  return (
    <AppContext.Provider value={{ emergencyOpen, openEmergency, closeEmergency }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}