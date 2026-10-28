import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    const { studentId, score } = await req.json();
    const supabase = await createClient();

    // Convert score to coins (e.g., 100 points = 10 coins)
    const coinsEarned = Math.floor(score / 10);

    // Save to database
    const { error } = await supabase.rpc("add_coins_to_student", {
        p_student_id: studentId,
        p_coins: coinsEarned
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, coinsEarned });
}