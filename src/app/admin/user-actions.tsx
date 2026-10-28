"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Ban, CheckCircle } from "lucide-react";

export default function UserActions({
    userId,
    currentRole,
    isBanned,
}: {
    userId: string;
    currentRole: string;
    isBanned: boolean;
}) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    async function updateRole(newRole: string) {
        setLoading(true);
        const { error } = await supabase
            .from("tba_profiles")
            .update({ role: newRole })
            .eq("id", userId);

        setLoading(false);
        if (error) return alert("Failed to update role: " + error.message);
        router.refresh();
    }

    async function toggleBan() {
        setLoading(true);
        const { error } = await supabase
            .from("tba_profiles")
            .update({ is_banned: !isBanned })
            .eq("id", userId);

        setLoading(false);
        if (error) return alert("Failed to update ban status: " + error.message);
        router.refresh();
    }

    return (
        <div className="flex items-center gap-2">
            <select
                disabled={loading}
                value={currentRole}
                onChange={(e) => updateRole(e.target.value)}
                className="border rounded-lg px-2 py-1 text-sm bg-white disabled:opacity-50"
            >
                <option value="parent">Parent</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
            </select>

            <button
                onClick={toggleBan}
                disabled={loading}
                className={`p-1.5 rounded-lg border transition-colors ${isBanned
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                        : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                    }`}
                title={isBanned ? "Unban User" : "Ban User"}
            >
                {isBanned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
            </button>
        </div>
    );
}