import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function GET(req: NextRequest) {
    const room = req.nextUrl.searchParams.get('room');
    const username = req.nextUrl.searchParams.get('username');

    if (!room) {
        return NextResponse.json({ error: 'Missing room' }, { status: 400 });
    }

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