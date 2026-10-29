import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js"; // 🚨 Use Admin Client
import AvatarStudio from "@/components/ThreeDWorld"; // Adjust path if needed

export default async function AvatarPage() {
    const cookieStore = await cookies();
    const studentId = cookieStore.get("student_id")?.value;

    if (!studentId) redirect("/student-login");

    // 🚨 Bypass RLS to get the actual data
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
        <div className="min-h-screen bg-slate-950 p-4 md:p-8 flex flex-col items-center">
            <h1 className="text-3xl font-bold text-white mb-8">Avatar Studio</h1>
            <AvatarStudio
                studentId={studentId}
                initialCoins={student?.coins || 0}
                initialSkin={student?.equipped_skin || ""}
                initialUnlockedSkins={student?.unlocked_skins || []}
            />
        </div>
    );
}