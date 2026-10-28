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
} from '@livekit/components-react';
import { Track, ConnectionState } from 'livekit-client';
import '@livekit/components-styles';
import {
    LayoutGrid,
    Maximize,
    PhoneOff,
    PenTool,
    Highlighter,
    Type,
    Trash2,
    X,
    MousePointer2,
    Circle,
} from 'lucide-react';

// ==========================================
// Client-Side Screen Recorder Hook
// ==========================================
const useScreenRecorder = () => {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    const startRecording = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });
            streamRef.current = screenStream;

            mediaRecorderRef.current = new MediaRecorder(screenStream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `meeting-recording-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                // Stop all tracks to release the screen share
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach((track) => track.stop());
                    streamRef.current = null;
                }
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);

            // Handle user stopping the share via the browser's native UI
            screenStream.getVideoTracks()[0].onended = () => {
                stopRecording();
            };
        } catch (err) {
            console.error("Error starting screen recording:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // Cleanup if component unmounts
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                mediaRecorderRef.current.stop();
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    return { isRecording, startRecording, stopRecording };
};

// ==========================================
// Main Meeting Component
// ==========================================

export default function MeetingClient() {
    const params = useParams<{ roomName: string }>();
    const roomName = decodeURIComponent(params.roomName ?? '');
    const router = useRouter();

    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const identity = useMemo(
        () => `guest-${Math.random().toString(36).slice(2, 10)}`,
        []
    );

    useEffect(() => {
        if (!roomName) return;
        let cancelled = false;

        (async () => {
            try {
                setError(null);
                const res = await fetch(
                    `/api/livekit/token?room=${encodeURIComponent(
                        roomName
                    )}&username=${encodeURIComponent(identity)}`
                );
                if (!res.ok) throw new Error(`Token request failed: ${res.status}`);
                const data = await res.json();
                if (!cancelled) setToken(data.token);
            } catch (err) {
                if (!cancelled)
                    setError(
                        err instanceof Error ? err.message : 'Failed to get LiveKit token'
                    );
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [roomName, identity]);

    if (error) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-white">
                <div className="max-w-md rounded-xl border border-red-900/50 bg-red-950/30 p-8 text-center shadow-2xl">
                    <h1 className="mb-2 text-xl font-bold text-red-400">Connection Error</h1>
                    <p className="text-sm text-red-200">{error}</p>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-white">
                <div className="animate-pulse text-lg font-medium text-zinc-400">
                    Connecting to room...
                </div>
            </div>
        );
    }

    return (
        <LiveKitRoom
            token={token}
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            connect={true}
            audio={true}
            video={true}
            onDisconnected={() => router.push('/')}
            className="h-screen w-screen bg-black font-sans overflow-hidden"
        >
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

    // --- Recording Hook ---
    const { isRecording, startRecording, stopRecording } = useScreenRecorder();

    // --- Annotation & Control States ---
    const [isAnnotating, setIsAnnotating] = useState(false);
    const [isControlling, setIsControlling] = useState(false);
    const [tool, setTool] = useState<'pen' | 'highlighter' | 'text'>('pen');
    const [color, setColor] = useState('#ef4444');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const lastPos = useRef({ x: 0, y: 0 });

    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false }
    );

    const focusTrack = tracks.find((t) => t.source === Track.Source.ScreenShare) || tracks[0];
    const isScreenShare = focusTrack?.source === Track.Source.ScreenShare;

    // --- LiveKit Data Channel for Sync ---
    const onDataReceived = useCallback((msg: { payload: Uint8Array }) => {
        const data = JSON.parse(new TextDecoder().decode(msg.payload));
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (data.type === 'clear') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        } else if (data.type === 'draw') {
            const x = data.x * canvas.width;
            const y = data.y * canvas.height;
            const prevX = data.prevX * canvas.width;
            const prevY = data.prevY * canvas.height;

            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = data.color;
            ctx.lineWidth = data.size;
            ctx.globalAlpha = data.alpha;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        } else if (data.type === 'control') {
            console.log(`[Remote Control] Action: ${data.action} at (${data.x}, ${data.y})`);
        }
    }, []);

    const { send } = useDataChannel('whiteboard-sync', onDataReceived);

    // Handle Canvas Resize
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                tempCanvas.getContext('2d')?.drawImage(canvas, 0, 0);

                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;

                const ctx = canvas.getContext('2d');
                if (ctx) ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
            }
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [isAnnotating, isFocusMode]);

    // --- Drawing Logic ---
    const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top) / rect.height,
            rawX: clientX - rect.left,
            rawY: clientY - rect.top
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isAnnotating || isControlling) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const coords = getCoordinates(e, canvas);
        lastPos.current = { x: coords.x, y: coords.y };

        if (tool === 'text') {
            const text = prompt('Enter text to annotate:');
            if (text) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = color;
                    ctx.font = '24px sans-serif';
                    ctx.fillText(text, coords.rawX, coords.rawY);

                    const payload = new TextEncoder().encode(JSON.stringify({
                        type: 'draw', x: coords.x, y: coords.y, prevX: coords.x, prevY: coords.y,
                        color, size: 0, alpha: 0, text
                    }));
                    send(payload, { reliable: true });
                }
            }
            return;
        }
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !isAnnotating || isControlling) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const coords = getCoordinates(e, canvas);
        const size = tool === 'pen' ? 3 : 20;
        const alpha = tool === 'pen' ? 1.0 : 0.4;

        ctx.beginPath();
        ctx.moveTo(lastPos.current.x * canvas.width, lastPos.current.y * canvas.height);
        ctx.lineTo(coords.rawX, coords.rawY);
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.globalAlpha = alpha;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        const payload = new TextEncoder().encode(JSON.stringify({
            type: 'draw',
            x: coords.x, y: coords.y, prevX: lastPos.current.x, prevY: lastPos.current.y,
            color, size, alpha
        }));
        send(payload, { reliable: false });

        lastPos.current = { x: coords.x, y: coords.y };
    };

    const stopDrawing = () => setIsDrawing(false);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        const payload = new TextEncoder().encode(JSON.stringify({ type: 'clear' }));
        send(payload, { reliable: true });
    };

    // --- Remote Control Logic ---
    const handleRemoteControlClick = (e: React.MouseEvent) => {
        if (!isControlling) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const coords = getCoordinates(e, canvas);

        const payload = new TextEncoder().encode(JSON.stringify({
            type: 'control', action: 'click', x: coords.x, y: coords.y
        }));
        send(payload, { reliable: true });

        const rect = canvas.getBoundingClientRect();
        const ripple = document.createElement('div');
        ripple.className = 'absolute w-8 h-8 bg-blue-500/50 rounded-full animate-ping pointer-events-none';
        ripple.style.left = `${e.clientX - rect.left - 16}px`;
        ripple.style.top = `${e.clientY - rect.top - 16}px`;
        canvas.parentElement?.appendChild(ripple);
        setTimeout(() => ripple.remove(), 500);
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            if (!isAnnotating && !isControlling) setShowControls(false);
        }, 4000);
    };

    useEffect(() => {
        handleMouseMove();
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [isAnnotating, isControlling]);

    return (
        <div
            className={`flex h-full w-full overflow-hidden bg-black text-zinc-100 ${!showControls && !isAnnotating && !isControlling ? 'cursor-none' : 'cursor-auto'}`}
            onMouseMove={handleMouseMove}
        >
            <div className="flex flex-1 relative min-w-0 bg-black">

                <div className="flex-1 w-full h-full p-2 sm:p-4 flex items-center justify-center">
                    {isFocusMode && focusTrack ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden rounded-2xl">
                            <ParticipantTile
                                trackRef={focusTrack}
                                className="w-full h-full [&>video]:object-contain"
                            />

                            {/* Overlay Canvas for Annotations & Remote Control */}
                            <canvas
                                ref={canvasRef}
                                className={`absolute inset-0 z-20 ${isControlling ? 'cursor-pointer pointer-events-auto' :
                                        isAnnotating ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
                                    }`}
                                onMouseDown={isControlling ? handleRemoteControlClick : startDrawing}
                                onMouseMove={isControlling ? undefined : draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={isControlling ? undefined : startDrawing}
                                onTouchMove={isControlling ? undefined : draw}
                                onTouchEnd={stopDrawing}
                            />

                            <div className="absolute bottom-4 left-4 z-10 bg-black/60 px-4 py-2 rounded-lg text-sm backdrop-blur-md border border-white/10 shadow-lg pointer-events-none">
                                {focusTrack.participant.name || focusTrack.participant.identity}
                            </div>
                        </div>
                    ) : (
                        <GridLayout tracks={tracks} className="h-full w-full gap-4">
                            <ParticipantTile className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl" />
                        </GridLayout>
                    )}
                </div>

                {/* TOP HEADER BAR */}
                <div
                    className={`absolute top-4 left-4 sm:top-6 sm:left-6 z-30 flex items-center gap-3 rounded-full bg-zinc-900/80 backdrop-blur-md px-4 py-2 border border-zinc-700/50 shadow-lg transition-opacity duration-300 ${showControls || isAnnotating || isControlling ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${connectionState === ConnectionState.Connected ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                            {connectionState === ConnectionState.Connected ? 'Connected' : 'Connecting'}
                        </span>
                    </div>
                    <div className="h-4 w-px bg-zinc-700" />
                    <button
                        onClick={() => setIsFocusMode(!isFocusMode)}
                        className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
                    >
                        {isFocusMode ? <LayoutGrid size={14} /> : <Maximize size={14} />}
                        {isFocusMode ? 'Grid' : 'Focus'}
                    </button>
                </div>

                {/* ANNOTATION & CONTROL TOOLBAR */}
                {(isAnnotating || isControlling) && (
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-2xl bg-zinc-900/90 border border-zinc-700/50 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4">

                        {isControlling ? (
                            <div className="flex items-center gap-2 px-4 text-sm text-blue-400 font-medium">
                                <MousePointer2 size={18} className="animate-pulse" /> You have remote control
                            </div>
                        ) : (
                            <>
                                <button onClick={() => setTool('pen')} className={`p-2 rounded-xl transition-colors ${tool === 'pen' ? 'bg-indigo-600 text-white' : 'hover:bg-zinc-800 text-zinc-400'}`} title="Pen"><PenTool size={18} /></button>
                                <button onClick={() => setTool('highlighter')} className={`p-2 rounded-xl transition-colors ${tool === 'highlighter' ? 'bg-indigo-600 text-white' : 'hover:bg-zinc-800 text-zinc-400'}`} title="Highlighter"><Highlighter size={18} /></button>
                                <button onClick={() => setTool('text')} className={`p-2 rounded-xl transition-colors ${tool === 'text' ? 'bg-indigo-600 text-white' : 'hover:bg-zinc-800 text-zinc-400'}`} title="Text"><Type size={18} /></button>

                                <div className="w-px h-6 bg-zinc-700 mx-1" />

                                <button onClick={() => setColor('#ef4444')} className={`w-6 h-6 rounded-full bg-red-500 border-2 ${color === '#ef4444' ? 'border-white' : 'border-transparent'}`} />
                                <button onClick={() => setColor('#eab308')} className={`w-6 h-6 rounded-full bg-yellow-500 border-2 ${color === '#eab308' ? 'border-white' : 'border-transparent'}`} />
                                <button onClick={() => setColor('#3b82f6')} className={`w-6 h-6 rounded-full bg-blue-500 border-2 ${color === '#3b82f6' ? 'border-white' : 'border-transparent'}`} />
                                <button onClick={() => setColor('#22c55e')} className={`w-6 h-6 rounded-full bg-green-500 border-2 ${color === '#22c55e' ? 'border-white' : 'border-transparent'}`} />

                                <div className="w-px h-6 bg-zinc-700 mx-1" />

                                <button onClick={clearCanvas} className="p-2 rounded-xl hover:bg-red-500/20 text-red-400 transition-colors" title="Clear"><Trash2 size={18} /></button>
                            </>
                        )}

                        <div className="w-px h-6 bg-zinc-700 mx-1" />
                        <button
                            onClick={() => { setIsAnnotating(false); setIsControlling(false); }}
                            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 transition-colors"
                            title="Exit Mode"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* BOTTOM CONTROL BAR */}
                <div
                    className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all duration-300 ${showControls || isAnnotating || isControlling ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
                        }`}
                >
                    <div className="flex items-center gap-1 sm:gap-2 rounded-2xl border border-zinc-700/50 bg-zinc-900/80 p-1.5 sm:p-2 shadow-2xl backdrop-blur-xl">
                        <ControlBar
                            variation="minimal"
                            controls={{ microphone: true, camera: true, screenShare: true, chat: false, leave: false }}
                            className="!border-none !bg-transparent !p-0"
                        />

                        <div className="mx-1 h-8 w-px bg-zinc-700/50" />

                        {/* Record Button */}
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`flex h-10 items-center justify-center gap-2 rounded-xl px-3 sm:px-4 font-medium transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                }`}
                            title={isRecording ? "Stop Recording" : "Record Screen"}
                        >
                            <Circle size={18} fill={isRecording ? "white" : "none"} className={isRecording ? "text-white" : "text-zinc-400"} />
                            <span className="hidden sm:inline text-sm">{isRecording ? 'Stop Rec' : 'Record'}</span>
                        </button>

                        <div className="mx-1 h-8 w-px bg-zinc-700/50" />

                        {/* Screen Share Tools */}
                        {isScreenShare && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => { setIsAnnotating(!isAnnotating); setIsControlling(false); }}
                                    className={`flex h-10 items-center justify-center gap-2 rounded-xl px-3 sm:px-4 font-medium transition-all ${isAnnotating ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                        }`}
                                >
                                    <PenTool size={18} />
                                    <span className="hidden sm:inline text-sm">Annotate</span>
                                </button>
                                <button
                                    onClick={() => { setIsControlling(!isControlling); setIsAnnotating(false); }}
                                    className={`flex h-10 items-center justify-center gap-2 rounded-xl px-3 sm:px-4 font-medium transition-all ${isControlling ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                        }`}
                                >
                                    <MousePointer2 size={18} />
                                    <span className="hidden sm:inline text-sm">Control</span>
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => room.disconnect()}
                            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-3 sm:px-5 font-medium text-white transition-all hover:bg-red-700"
                        >
                            <PhoneOff size={18} />
                            <span className="hidden sm:inline text-sm">Leave</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}