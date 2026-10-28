import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const { studentId, pin } = await req.json();

        if (!studentId || !pin) {
            return NextResponse.json({ error: "Missing ID or PIN" }, { status: 400 });
        }

        const supabase = await createClient();

        // 🛡️ Call the secure database function
        const { data: studentData, error } = await supabase.rpc("verify_student_login", {
            p_student_id: studentId,
            p_pin: pin
        });

        // If the function returns no data, the PIN was wrong
        if (error || !studentData || studentData.length === 0) {
            return NextResponse.json({ error: "Wrong PIN! Try again." }, { status: 401 });
        }

        const student = studentData[0];

        // Save their session in secure cookies
        const cookieStore = await cookies();
        cookieStore.set("student_id", student.id, { maxAge: 86400, path: "/" });
        cookieStore.set("student_name", student.full_name, { maxAge: 86400, path: "/" });

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error("Login Error:", err);
        return NextResponse.json({ error: "Server error. Please try again later." }, { status: 500 });
    }
}