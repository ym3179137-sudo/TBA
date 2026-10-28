"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
    const router = useRouter();
    const supabase = createClient();

    return (
        <button
            onClick={async () => {
                await supabase.auth.signOut();
                // Delete the timer cookie
                document.cookie = "tba_login_time=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                router.push("/sign-in");
                router.refresh();
            }}
            className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
            Sign out
        </button>
    );
}