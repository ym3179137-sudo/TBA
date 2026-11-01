"use server";

import { createClient } from "@supabase/supabase-js";

const getAdminClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
};

export async function syncGameCoins(studentId: string, score: number) {
    // 🚨 Reject guests
    if (!studentId || studentId.startsWith("guest-")) {
        console.log("Guest player - coins not saved.");
        return;
    }

    const supabaseAdmin = getAdminClient();

    // 1. Fetch current coins
    const { data: child, error } = await supabaseAdmin
        .from("children")
        .select("coins")
        .eq("id", studentId)
        .maybeSingle();

    if (error || !child) return;

    // 2. Add the game score to their current coins
    const newCoins = (child.coins || 0) + score;

    await supabaseAdmin
        .from("children")
        .update({ coins: newCoins })
        .eq("id", studentId);
}