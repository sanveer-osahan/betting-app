"use client";

import { useEffect } from "react";

const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export default function KeepAlive() {
  useEffect(() => {
    const ping = () => {
      fetch("/api/health").catch(() => {
        // Silently ignore errors — the app may be unreachable
      });
    };

    // Ping immediately on mount, then every 10 minutes
    ping();
    const interval = setInterval(ping, PING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return null;
}
