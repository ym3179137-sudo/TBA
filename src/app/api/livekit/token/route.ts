import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
    const room = req.nextUrl.searchParams.get('room');
    const username = req.nextUrl.searchParams.get('username');

    if (!room) return NextResponse.json({ error: 'Missing room' }, { status: 400 });

    // 🛡️ SECURITY CHECK: Verify meeting is enabled in DB
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: settings } = await supabaseAdmin.from("classroom_settings").select("*").single();

    // If meeting is not enabled, block access (unless it's a special admin room)
    if (!settings?.meeting_enabled && room === 'tba-live-class') {
        return NextResponse.json({ error: 'The classroom is currently locked by the Admin.' }, { status: 403 });
    }

    const identity = username || `guest-${Math.random().toString(36).slice(2, 10)}`;
    const at = new AccessToken(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!, { identity, ttl: '2h' });

    at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true });

    return NextResponse.json({ token: await at.toJwt() });
}