"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("smartwardUser");
    if (!user) {
      router.push("/login");
    } else {
      setAllowed(true);
    }
  }, [router]);

  if (!allowed) return null;

  return children;
}