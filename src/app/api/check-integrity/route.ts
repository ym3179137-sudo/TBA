import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 🚨 Use Admin Client to bypass RLS and ensure logs are saved safely
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { text, studentId, assignmentId } = await req.json();

        if (!text || !studentId || !assignmentId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let aiScore = 0;
        try {
            // Using ZeroGPT API as a free, quick first pass
            // Note: If you don't have a ZeroGPT API key, you can remove this fetch block.
            const res = await fetch('https://api.zerogpt.com/api/detect/detectText', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ApiKey': process.env.ZEROGPT_API_KEY || ""
                },
                body: JSON.stringify({ input_text: text })
            });

            if (res.ok) {
                const data = await res.json();
                aiScore = (data.data?.fakePercentage || 0) / 100; // Normalized to 0-1
            }
        } catch (e) {
            console.error("Detection API failed, skipping.", e);
        }

        // Log the violation but do NOT block immediately
        if (aiScore > 0.8) {
            // 1. Fetch the current submission to get existing violations
            const { data: submission } = await supabaseAdmin
                .from('submissions')
                .select('violations')
                .eq('assignment_id', assignmentId)
                .eq('student_id', studentId)
                .single();

            if (submission) {
                const currentViolations = submission.violations || [];
                const newViolation = { type: "high_ai_score", score: aiScore, date: new Date().toISOString() };

                // 2. Append new violation to the array and update
                await supabaseAdmin.from('submissions').update({
                    integrity_score: Math.max(0, 100 - ((currentViolations.length + 1) * 15)),
                    violations: [...currentViolations, newViolation]
                }).eq('assignment_id', assignmentId).eq('student_id', studentId);
            }
        }

        return NextResponse.json({ aiScore, blocked: false });

    } catch (error: any) {
        console.error("Integrity Check Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}