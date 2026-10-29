import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
    const room = req.nextUrl.searchParams.get('room');
    const username = req.nextUrl.searchParams.get('username');

    if (!room) {
        return NextResponse.json({ error: 'Missing room' }, { status: 400 });
    }

    // 🚨 1. Verify if the Admin has enabled meetings
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: settings } = await supabaseAdmin
        .from("school_settings")
        .select("meetings_enabled_by_admin")
        .single();

    // If the switch is off, block the request entirely
    if (!settings?.meetings_enabled_by_admin) {
        return NextResponse.json(
            { error: 'Meetings are currently disabled by the School Principal.' },
            { status: 403 }
        );
    }

    // 🚨 2. Generate the LiveKit Token
    const identity = username || `guest-${Math.random().toString(36).slice(2, 10)}`;

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
        return NextResponse.json(
            { error: 'LiveKit credentials missing on server' },
            { status: 500 }
        );
    }

    const at = new AccessToken(apiKey, apiSecret, {
        identity,
        ttl: '2h',
    });

    at.addGrant({
        room,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
    });

    const token = await at.toJwt();
    return NextResponse.json({ token });
}