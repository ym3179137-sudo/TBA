"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

export async function purchaseSkin(studentId: string, itemId: string, price: number, modelUrl: string) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: student, error } = await supabaseAdmin
        .from("children")
        .select("coins, unlocked_skins")
        .eq("id", studentId)
        .single();

    if (error || !student) throw new Error("Student not found.");

    const unlocked = student.unlocked_skins || [];
    if (unlocked.includes(modelUrl)) return { success: true, newCoins: student.coins };

    if (student.coins < price) throw new Error("Not enough coins!");

    const newCoins = student.coins - price;
    const newUnlocked = [...unlocked, modelUrl];

    const { error: updateError } = await supabaseAdmin
        .from("children")
        .update({
            coins: newCoins,
            unlocked_skins: newUnlocked,
            equipped_skin: modelUrl
        })
        .eq("id", studentId);

    if (updateError) throw new Error(updateError.message);

    revalidatePath("/student/avatar");
    return { success: true, newCoins };
}

// 🚨 NEW: Securely Equip an already owned skin
export async function equipSkin(studentId: string, modelUrl: string) {
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin
        .from("children")
        .update({ equipped_skin: modelUrl })
        .eq("id", studentId);

    if (error) throw new Error("Failed to equip skin: " + error.message);

    revalidatePath("/student/avatar");
    return { success: true };
}