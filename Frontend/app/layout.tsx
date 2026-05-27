import "./globals.css"; 
import { Toaster } from "react-hot-toast";
import { AppProvider } from "./context/AppContext";
import EmergencyModal from "./components/EmergencyModal";

export const metadata = {
  title: "SmartWard",
  description: "Clinical Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">
        <AppProvider>
          {children}
          <EmergencyModal />
          <Toaster position="top-right" />
        </AppProvider>
      </body>
    </html>
  );
}