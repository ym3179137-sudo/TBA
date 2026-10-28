"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ActivityTracker() {
    const supabase = createClient();

    useEffect(() => {
        // 🚨 1. Detect Code Injection (Console Hijacking)
        const originalLog = console.log;
        console.log = function (...args) {
            if (args[0] && typeof args[0] === "string" && args[0].includes("<script>")) {
                supabase.rpc("log_security_alert", {
                    p_type: "CODE_INJECTION",
                    p_message: `Injected code detected: ${args[0].substring(0, 50)}...`,
                });
            }
            originalLog.apply(console, args);
        };

        // 👆 2. Track Critical Clicks
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.innerText && (target.innerText.includes("Login") || target.innerText.includes("Sign Up"))) {
                supabase.from("audit_logs").insert({
                    action: "BUTTON_CLICK",
                    details: { text: target.innerText, tag: target.tagName },
                });
            }
        };

        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, [supabase]);

    return null; // This component is invisible
}