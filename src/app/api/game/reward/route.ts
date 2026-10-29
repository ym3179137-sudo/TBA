import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const { studentId, score } = await req.json();

        if (!studentId || score === undefined) {
            return NextResponse.json({ error: "Missing student ID or score" }, { status: 400 });
        }

        // Use Admin client to bypass RLS and safely update coins
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Get current coins
        const { data: student, error: fetchError } = await supabaseAdmin
            .from("children")
            .select("coins, total_points_earned")
            .eq("id", studentId)
            .single();

        if (fetchError || !student) throw new Error("Student not found");

        // 2. Add the game score to their coins
        // (You can change this to Math.floor(score / 2) if you want to give less coins per point)
        const coinsToAdd = Math.floor(score);
        const newCoins = (student.coins || 0) + coinsToAdd;
        const newTotalPoints = (student.total_points_earned || 0) + coinsToAdd;

        // 3. Update the database
        const { error: updateError } = await supabaseAdmin
            .from("children")
            .update({
                coins: newCoins,
                total_points_earned: newTotalPoints
            })
            .eq("id", studentId);

        if (updateError) throw new Error(updateError.message);

        return NextResponse.json({ success: true, newCoins, added: coinsToAdd });

    } catch (error: any) {
        console.error("Reward Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}