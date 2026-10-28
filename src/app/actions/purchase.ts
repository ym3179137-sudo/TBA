"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

export async function purchaseSkin(studentId: string, itemId: string, price: number, modelUrl: string) {
    // 🛡️ Use the Admin Client to bypass RLS for this secure transaction
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get current student data
    const { data: student, error } = await supabaseAdmin
        .from("children")
        .select("coins, unlocked_skins")
        .eq("id", studentId)
        .single();

    if (error || !student) throw new Error("Student not found in database.");

    // 2. Check if they already own it
    const unlocked = student.unlocked_skins || [];
    if (unlocked.includes(modelUrl)) return { success: true, newCoins: student.coins }; // Already owned

    // 3. Check if they have enough coins
    if (student.coins < price) throw new Error("Not enough coins!");

    // 4. Deduct coins and add to unlocked skins
    const newCoins = student.coins - price;
    const newUnlocked = [...unlocked, modelUrl];

    const { error: updateError } = await supabaseAdmin
        .from("children")
        .update({
            coins: newCoins,
            unlocked_skins: newUnlocked,
            equipped_skin: modelUrl // Auto-equip after buying
        })
        .eq("id", studentId);

    if (updateError) throw new Error(updateError.message);

    revalidatePath("/student");
    return { success: true, newCoins };
}