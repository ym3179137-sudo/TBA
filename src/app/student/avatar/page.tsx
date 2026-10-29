import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AvatarStudio from "@/components/ThreeDWorld"; // Adjust path if needed

export default async function AvatarPage() {
    const cookieStore = await cookies();
    const studentId = cookieStore.get("student_id")?.value;

    if (!studentId) redirect("/student-login");

    const supabase = await createClient();
    const { data: student } = await supabase
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