'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    LiveKitRoom,
    LayoutContextProvider,
    ControlBar,
    RoomAudioRenderer,
    GridLayout,
    ParticipantTile,
    useTracks,
    useRoomContext,
    useConnectionState,
    useDataChannel,
    VideoTrack,
    TrackReference,
} from '@livekit/components-react';
import { Track, ConnectionState } from 'livekit-client';
import '@livekit/components-styles';
import {
    LayoutGrid, Maximize, PhoneOff, PenTool, Highlighter, Type, Trash2, X, MousePointer2, Circle
} from 'lucide-react';

// (Keep the useScreenRecorder hook exactly as it is in your current file)

export default function MeetingClient() {
    const params = useParams<{ roomName: string }>();
    const roomName = decodeURIComponent(params.roomName ?? '');
    const router = useRouter();

    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const identity = useMemo(() => `guest-${Math.random().toString(36).slice(2, 10)}`, []);

    useEffect(() => {
        if (!roomName) return;
        let cancelled = false;

        (async () => {
            try {
                setError(null);
                const res = await fetch(`/api/livekit/token?room=${encodeURIComponent(roomName)}&username=${encodeURIComponent(identity)}`);
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || 'Failed to join meeting');

                if (!cancelled) setToken(data.token);
            } catch (err: any) {
                if (!cancelled) setError(err.message);
            }
        })();

        return () => { cancelled = true; };
    }, [roomName, identity]);

    if (error) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
                <div className="max-w-md rounded-3xl border border-red-900/50 bg-red-950/30 p-10 text-center shadow-2xl backdrop-blur-xl">
                    <h1 className="mb-4 text-2xl font-bold text-red-400">Access Denied</h1>
                    <p className="text-slate-300">{error}</p>
                    <button onClick={() => router.push('/dashboard')} className="mt-6 bg-red-600 px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition-colors">Return to Dashboard</button>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
                <div className="animate-pulse text-xl font-medium text-indigo-400">Connecting to Live Classroom...</div>
            </div>
        );
    }

    return (
        <LiveKitRoom token={token} serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL} connect={true} audio={true} video={true} onDisconnected={() => router.push('/dashboard')} className="h-screen w-screen bg-slate-950 font-sans overflow-hidden">
            <LayoutContextProvider>
                <RoomContent />
                <RoomAudioRenderer />
            </LayoutContextProvider>
        </LiveKitRoom>
    );
}

function RoomContent() {
    const room = useRoomContext();
    const connectionState = useConnectionState();
    const [isFocusMode, setIsFocusMode] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // (Keep all your existing Annotation & Recording state variables here)
    const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }, { source: Track.Source.ScreenShare, withPlaceholder: false }], { onlySubscribed: false });
    const focusTrack = tracks.find((t) => t.source === Track.Source.ScreenShare) || tracks[0];
    const isScreenShare = focusTrack?.source === Track.Source.ScreenShare;

    const handleMouseMove = () => {
        setShowControls(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 4000);
    };

    useEffect(() => {
        handleMouseMove();
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }, []);

    return (
        <div className={`flex h-full w-full overflow-hidden bg-slate-950 text-zinc-100 ${!showControls ? 'cursor-none' : 'cursor-auto'}`} onMouseMove={handleMouseMove}>

            <div className="flex flex-1 relative min-w-0 bg-black/50">
                <div className="flex-1 w-full h-full p-2 sm:p-6 flex items-center justify-center">
                    {isFocusMode && focusTrack ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-slate-900/50 overflow-hidden rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-sm">
                            {/* Your VideoTrack / ParticipantTile logic goes here */}
                            <ParticipantTile trackRef={focusTrack} className="w-full h-full [&>video]:object-contain" />

                            {/* Floating Name Tag */}
                            <div className="absolute bottom-6 left-6 z-10 bg-black/60 px-5 py-2.5 rounded-full text-sm font-semibold tracking-wide backdrop-blur-xl border border-white/10 shadow-lg pointer-events-none">
                                {focusTrack.participant.name || focusTrack.participant.identity}
                            </div>
                        </div>
                    ) : (
                        <GridLayout tracks={tracks.filter(t => t.publication !== undefined)} className="h-full w-full gap-6">
                            <ParticipantTile className="overflow-hidden rounded-[2rem] border border-white/5 bg-slate-900 shadow-2xl [&>video]:object-contain" />
                        </GridLayout>
                    )}
                </div>

                {/* TOP HEADER BAR */}
                <div className={`absolute top-6 left-6 z-30 flex items-center gap-4 rounded-full bg-slate-900/80 backdrop-blur-xl px-5 py-2.5 border border-white/10 shadow-2xl transition-all duration-500 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
                    <div className="flex items-center gap-2">
                        <span className={`h-3 w-3 rounded-full ${connectionState === ConnectionState.Connected ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500'}`} />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-200">
                            {connectionState === ConnectionState.Connected ? 'Live' : 'Connecting'}
                        </span>
                    </div>
                    <div className="h-5 w-px bg-white/20" />
                    <button onClick={() => setIsFocusMode(!isFocusMode)} className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors">
                        {isFocusMode ? <LayoutGrid size={16} /> : <Maximize size={16} />}
                        {isFocusMode ? 'Grid' : 'Focus'}
                    </button>
                </div>

                {/* BOTTOM CONTROL BAR - INSANE UI */}
                <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-30 transition-all duration-500 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                    <div className="flex items-center gap-2 rounded-[1.5rem] border border-white/10 bg-slate-900/90 p-2 shadow-2xl backdrop-blur-2xl">
                        <ControlBar variation="minimal" controls={{ microphone: true, camera: true, screenShare: true, chat: false, leave: false }} className="!border-none !bg-transparent !p-0" />

                        <div className="mx-2 h-8 w-px bg-white/10" />

                        {/* Insert your Record and Annotate buttons here (same logic as before) */}

                        <button onClick={() => room.disconnect()} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-500 hover:bg-red-600 px-6 font-bold text-white transition-all shadow-lg shadow-red-500/20">
                            <PhoneOff size={20} /> Leave
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}