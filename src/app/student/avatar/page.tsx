import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import AvatarStudio from "@/components/ThreeDWorld";
import BackButton from "@/components/BackButton"; // 🚨 Import the smart back button

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
        .select("coins, equipped_skin, equipped_emote, unlocked_skins")
        .eq("id", studentId)
        .maybeSingle();

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8 flex flex-col items-center relative">
            {/* 🚨 SMART BACK BUTTON */}
            <div className="w-full max-w-6xl mb-6 flex justify-start">
                <BackButton fallbackUrl="/student" label="Back to Dashboard" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-6 drop-shadow-md">Avatar Studio</h1>

            <AvatarStudio
                studentId={studentId}
                initialCoins={student?.coins || 0}
                initialSkin={student?.equipped_skin || ""}
                initialEmote={student?.equipped_emote || "none"}
                initialUnlockedSkins={student?.unlocked_skins || []}
            />
        </div>
    );
}