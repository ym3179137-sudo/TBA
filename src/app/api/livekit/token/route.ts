import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
    const room = req.nextUrl.searchParams.get('room');
    const username = req.nextUrl.searchParams.get('username');
    const password = req.nextUrl.searchParams.get('password');

    if (!room || !password) {
        return NextResponse.json({ error: 'Missing room or password' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 🚨 Security Check
    const { data: meeting, error } = await supabaseAdmin
        .from("meetings")
        .select("*")
        .eq("room_name", room)
        .eq("is_active", true)
        .single();

    if (error || !meeting || meeting.password !== password) {
        return NextResponse.json({ error: 'Invalid meeting password.' }, { status: 403 });
    }

    const identity = username || `guest-${Math.random().toString(36).slice(2, 10)}`;
    const at = new AccessToken(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!, { identity, ttl: '4h' });

    at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true });

    return NextResponse.json({ token: await at.toJwt() });
}