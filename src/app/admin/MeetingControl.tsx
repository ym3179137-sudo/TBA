"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Video, Lock, Unlock, Copy } from "lucide-react";
import Link from "next/link";

export default function MeetingControl() {
    const [isEnabled, setIsEnabled] = useState(false);
    const [roomName, setRoomName] = useState("tba-live-class");
    const supabase = createClient();

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from("classroom_settings").select("*").single();
            if (data) {
                setIsEnabled(data.meeting_enabled);
                setRoomName(data.meeting_room_name);
            }
        };
        fetchSettings();
    }, [supabase]);

    const toggleMeeting = async () => {
        const newState = !isEnabled;
        setIsEnabled(newState);
        await supabase.from("classroom_settings").update({ meeting_enabled: newState }).eq("id", 1);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl text-white">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Video className="text-indigo-400" /> Live Classroom Control
            </h2>

            <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6">
                <div>
                    <p className="font-semibold text-lg">{isEnabled ? "🟢 Meeting is LIVE" : "🔴 Meeting is LOCKED"}</p>
                    <p className="text-sm text-slate-400">Students {isEnabled ? "can" : "cannot"} join the room right now.</p>
                </div>
                <button
                    onClick={toggleMeeting}
                    className={`p-4 rounded-xl font-bold transition-all shadow-lg ${isEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                >
                    {isEnabled ? <Lock /> : <Unlock />}
                </button>
            </div>

            {isEnabled && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <input readOnly value={roomName} className="bg-slate-800 border border-slate-700 p-3 rounded-xl flex-1 text-sm font-mono" />
                        <button onClick={() => navigator.clipboard.writeText(roomName)} className="p-3 bg-slate-700 rounded-xl hover:bg-slate-600"><Copy size={18} /></button>
                    </div>
                    <Link href={`/meet/${roomName}`} className="block text-center w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all">
                        Join Meeting as Host
                    </Link>
                </div>
            )}
        </div>
    );
}