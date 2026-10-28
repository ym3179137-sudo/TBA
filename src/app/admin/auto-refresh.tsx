"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefresh() {
    const router = useRouter();
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh(); // Refreshes the server component data
        }, 5000); // ⏱️ 5-second refresh
        return () => clearInterval(interval);
    }, [router]);
    return null;
}