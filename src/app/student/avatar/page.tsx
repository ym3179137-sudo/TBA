import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import AvatarStudio from "@/components/ThreeDWorld";

export default async function AvatarPage() {
    const cookieStore = await cookies();
    const studentId = cookieStore.get("student_id")?.value;

    if (!studentId) redirect("/student-login");

    // 🛡️ Bypass RLS to get the actual data securely on the server
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: student } = await supabaseAdmin
        .from("children")
        .select("coins, equipped_skin, unlocked_skins")
        .eq("id", studentId)
        .single();

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8 flex flex-col items-center relative">

            {/* 🚨 BACK BUTTON */}
            <div className="w-full max-w-6xl mb-6 flex justify-start">
                <Link href="/student" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold bg-slate-900 px-5 py-2.5 rounded-xl border border-slate-800 shadow-lg">
                    <ArrowLeft size={20} /> Back to Dashboard
                </Link>
            </div>

            <h1 className="text-3xl font-bold text-white mb-6 drop-shadow-md">Avatar Studio</h1>

            <AvatarStudio
                studentId={studentId}
                initialCoins={student?.coins || 0}
                initialSkin={student?.equipped_skin || ""}
                initialUnlockedSkins={student?.unlocked_skins || []}
            />
        </div>
    );
}