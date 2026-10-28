"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Blocks, Sparkles, LogOut, FileText, Paintbrush, Eye, Gamepad2,
    ClipboardList, MonitorPlay, Plus, Save, Trash2, Type, List, Users, UploadCloud
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import DeckViewer from "@/components/DeckViewer";
import TBAArena from "@/components/TBAArena";

export default function TeacherDashboard() {
    const [activeTab, setActiveTab] = useState("presentations");

    // Presentation State
    const [lessonText, setLessonText] = useState("");
    const [designPrompt, setDesignPrompt] = useState("");
    const [generatedDeck, setGeneratedDeck] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Assessment State
    const [isCreatingForm, setIsCreatingForm] = useState(false);
    const [formTitle, setFormTitle] = useState("");
    const [formQuestions, setFormQuestions] = useState<any[]>([]);

    // Game State
    const [gameTopic, setGameTopic] = useState("");
    const [activeGame, setActiveGame] = useState<any>(null);
    const [generatingGame, setGeneratingGame] = useState(false);
    const [hostedPin, setHostedPin] = useState<string | null>(null);

    // Live Monitor State
    const [students, setStudents] = useState<any[]>([]);

    const router = useRouter();
    const supabase = createClient();

    // 1. Fetch latest students for Live Monitor
    const fetchStudents = useCallback(async () => {
        const { data } = await supabase.from("children").select("*").eq("is_approved", true);
        if (data) setStudents(data);
    }, [supabase]);

    // 2. 5-Second Auto-Refresh for Live Monitor
    useEffect(() => {
        fetchStudents();
        const interval = setInterval(fetchStudents, 5000); // ⏱️ 5-second refresh
        return () => clearInterval(interval);
    }, [fetchStudents]);

    // 3. 🚨 TRACKING: Log when teacher leaves the screen
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.hidden) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from("audit_logs").insert({
                        user_id: user.id,
                        action: "TEACHER_LEFT_APP",
                        details: { page: activeTab, message: "Teacher switched tabs or minimized the window." }
                    });
                }
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [activeTab, supabase]);

    async function handleGeneratePresentation(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setGeneratedDeck(null);
        try {
            const res = await fetch("/api/generate-html", {
                method: "POST",
                body: JSON.stringify({ lessonText, designPrompt }),
            });
            const data = await res.json();
            setGeneratedDeck(data.deck);
        } catch (err) {
            alert("Failed to generate.");
        } finally {
            setLoading(false);
        }
    }

    async function handleGenerateGame(e: React.FormEvent) {
        e.preventDefault();
        setGeneratingGame(true);
        try {
            const res = await fetch("/api/game/generate", {
                method: "POST",
                body: JSON.stringify({ topic: gameTopic }),
            });
            const data = await res.json();
            if (data.gameData) {
                setActiveGame(data.gameData);
            }
        } catch (err) {
            alert("Failed to generate game.");
        } finally {
            setGeneratingGame(false);
        }
    }

    async function hostGame() {
        if (!activeGame) return;
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        const { data: { user } } = await supabase.auth.getUser();

        const { data: gameData, error: gameError } = await supabase.from("games").insert({
            teacher_id: user?.id,
            title: activeGame.title,
            game_type: "arena",
            content: activeGame
        }).select().single();

        if (gameError) return alert("Database Error (Games): " + gameError.message);

        if (gameData) {
            const { error: sessionError } = await supabase.from("game_sessions").insert({
                game_id: gameData.id,
                teacher_id: user?.id,
                pin: pin,
                status: 'lobby'
            });

            if (sessionError) return alert("Database Error (Sessions): " + sessionError.message);
            setHostedPin(pin);
        }
    }

    async function startLiveGame() {
        if (!hostedPin) return;
        await supabase.from("game_sessions").update({ status: 'playing' }).eq("pin", hostedPin);
        alert("Game Started! Students are now entering the Arena.");
    }

    async function saveAssessment() {
        if (!formTitle) return alert("Please add a title");
        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from("assessments").insert({
            teacher_id: user?.id,
            title: formTitle,
            questions: formQuestions
        });

        alert("Assessment saved successfully!");
        setIsCreatingForm(false);
        setFormTitle("");
        setFormQuestions([]);
    }

    async function handleSignOut() {
        await supabase.auth.signOut();
        router.push("/sign-in");
    }

    const addQuestion = (type: "multiple_choice" | "text_input") => {
        setFormQuestions([...formQuestions, { type, text: "", options: ["", "", "", ""], correctIndex: 0 }]);
    };

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 flex">
            {/* 🧭 SIDEBAR */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen shrink-0">
                <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <Blocks className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-lg">Teacher Hub</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={() => setActiveTab("presentations")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'presentations' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <MonitorPlay className="w-5 h-5" /> AI Presentations
                    </button>
                    <button onClick={() => setActiveTab("assessments")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'assessments' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <ClipboardList className="w-5 h-5" /> Assessments
                    </button>
                    <button onClick={() => setActiveTab("games")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'games' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <Gamepad2 className="w-5 h-5" /> TBA Arena
                    </button>
                    <button onClick={() => setActiveTab("uploads")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'uploads' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <UploadCloud className="w-5 h-5" /> Uploads
                    </button>
                    <button onClick={() => setActiveTab("live")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'live' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <Eye className="w-5 h-5" /> Live Monitor
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors">
                        <LogOut className="w-5 h-5" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* 🖥️ MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">

                {/* PRESENTATIONS TAB */}
                {activeTab === "presentations" && (
                    <div className="flex flex-1 overflow-hidden">
                        <div className="w-1/3 p-6 border-r bg-white overflow-y-auto">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Sparkles className="text-emerald-500" /> AI Designer
                            </h2>
                            <form onSubmit={handleGeneratePresentation} className="space-y-4">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium mb-2"><FileText className="w-4 h-4" /> Lesson Content</label>
                                    <textarea value={lessonText} onChange={(e) => setLessonText(e.target.value)} placeholder="Paste your lesson notes here..." className="w-full border rounded-xl px-3 py-2 bg-slate-50 min-h-[200px]" required />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium mb-2"><Paintbrush className="w-4 h-4" /> Design Instructions</label>
                                    <textarea value={designPrompt} onChange={(e) => setDesignPrompt(e.target.value)} placeholder="e.g., Floating balloons, pastel colors..." className="w-full border rounded-xl px-3 py-2 bg-slate-50 min-h-[100px]" />
                                </div>
                                <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex justify-center gap-2">
                                    {loading ? "Generating..." : "Generate Presentation"} <Eye className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                        <div className="flex-1 bg-slate-100 relative">
                            {generatedDeck ? <DeckViewer deck={generatedDeck} /> : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                    <MonitorPlay className="w-16 h-16 mb-4 opacity-50" />
                                    <p>Your presentation preview will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ASSESSMENTS TAB */}
                {activeTab === "assessments" && (
                    <div className="p-8 overflow-y-auto">
                        {!isCreatingForm ? (
                            <>
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold">My Assessments</h2>
                                        <p className="text-slate-500">Create and manage quizzes for your students.</p>
                                    </div>
                                    <button onClick={() => setIsCreatingForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2">
                                        <Plus className="w-5 h-5" /> Create Form
                                    </button>
                                </div>
                                <div className="bg-white p-8 rounded-2xl border shadow-sm text-center text-slate-500">
                                    No assessments created yet. Click "Create Form" to start.
                                </div>
                            </>
                        ) : (
                            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold">New Assessment</h2>
                                    <button onClick={() => setIsCreatingForm(false)} className="text-slate-500 hover:text-slate-800 font-medium">Cancel</button>
                                </div>

                                <input placeholder="Form Title (e.g., Math Quiz 1)" value={formTitle} onChange={e => setFormTitle(e.target.value)} className="text-3xl font-bold border-b-2 w-full mb-8 outline-none p-2 bg-slate-50 rounded-t-lg" />

                                {formQuestions.map((q, i) => (
                                    <div key={i} className="p-6 border border-slate-200 rounded-xl mb-6 bg-slate-50 relative shadow-sm">
                                        <button onClick={() => setFormQuestions(formQuestions.filter((_, idx) => idx !== i))} className="absolute top-4 right-4 text-red-500 hover:text-red-700">
                                            <Trash2 className="w-5 h-5" />
                                        </button>

                                        <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-500 uppercase tracking-wider">
                                            {q.type === "multiple_choice" ? <><List className="w-4 h-4" /> Multiple Choice</> : <><Type className="w-4 h-4" /> Text Input</>}
                                        </div>

                                        <input placeholder="Question prompt" value={q.text} onChange={e => { const n = [...formQuestions]; n[i].text = e.target.value; setFormQuestions(n); }} className="w-full p-3 border rounded-lg mb-4 font-medium bg-white" />

                                        {q.type === "multiple_choice" && (
                                            <div className="space-y-2">
                                                {q.options.map((opt: string, optIdx: number) => (
                                                    <div key={optIdx} className="flex gap-3 items-center">
                                                        <input type="radio" name={`correct-${i}`} checked={q.correctIndex === optIdx} onChange={() => { const n = [...formQuestions]; n[i].correctIndex = optIdx; setFormQuestions(n); }} className="w-5 h-5 text-emerald-600" />
                                                        <input placeholder={`Option ${optIdx + 1}`} value={opt} onChange={e => { const n = [...formQuestions]; n[i].options[optIdx] = e.target.value; setFormQuestions(n); }} className="flex-1 p-2 border-b bg-transparent focus:border-emerald-500 outline-none" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {q.type === "text_input" && (
                                            <div className="p-4 bg-slate-100 border border-slate-300 rounded-lg text-slate-400 italic">
                                                Students will type their answer here...
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <button onClick={() => addQuestion("multiple_choice")} className="py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-50 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                                        <Plus className="w-5 h-5" /> Multiple Choice
                                    </button>
                                    <button onClick={() => addQuestion("text_input")} className="py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-50 hover:border-amber-500 hover:text-amber-600 transition-colors flex items-center justify-center gap-2">
                                        <Plus className="w-5 h-5" /> Text Input
                                    </button>
                                </div>

                                <button onClick={saveAssessment} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl flex justify-center gap-2 text-lg shadow-md">
                                    <Save className="w-5 h-5" /> Save Assessment
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* GAMES TAB */}
                {activeTab === "games" && (
                    <div className="p-8 overflow-y-auto h-full">
                        {!activeGame && (
                            <div className="max-w-2xl mx-auto bg-white p-10 rounded-3xl shadow-lg border border-slate-200 text-center">
                                <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Gamepad2 className="w-10 h-10 text-purple-600" />
                                </div>
                                <h2 className="text-3xl font-extrabold mb-3">TBA Arena</h2>
                                <p className="text-slate-500 mb-8 text-lg">Generate a custom quiz for your students.</p>
                                <form onSubmit={handleGenerateGame} className="flex flex-col sm:flex-row gap-4">
                                    <input value={gameTopic} onChange={e => setGameTopic(e.target.value)} placeholder="e.g., Math Shapes, Colors, Animals" className="flex-1 border-2 border-slate-200 rounded-xl px-5 py-4 bg-slate-50 text-lg outline-none focus:border-purple-500" required />
                                    <button type="submit" disabled={generatingGame} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-xl text-lg shadow-md disabled:opacity-50 transition-colors">
                                        {generatingGame ? "Building..." : "Generate Game"}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeGame && !hostedPin && (
                            <div className="max-w-4xl mx-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold">Preview: {activeGame.title}</h2>
                                    <button onClick={() => setActiveGame(null)} className="text-slate-500 font-medium">Discard</button>
                                </div>
                                <div className="h-[500px] rounded-3xl overflow-hidden shadow-2xl border-4 border-indigo-950 relative">
                                    <TBAArena gameData={activeGame} onFinish={() => { }} isPreview={true} />
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                                        <h3 className="text-white text-4xl font-extrabold mb-8">Ready to play?</h3>
                                        <button onClick={hostGame} className="bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-3xl px-12 py-6 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.5)] animate-pulse hover:animate-none transition-all hover:scale-105">
                                            Host Live Game
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeGame && hostedPin && (
                            <div className="max-w-3xl mx-auto bg-white p-12 rounded-3xl shadow-2xl border border-slate-200 text-center h-[80vh] flex flex-col justify-center">
                                <h2 className="text-2xl font-bold text-slate-500 mb-2 uppercase tracking-widest">Join at localhost:3000/join</h2>
                                <h1 className="text-8xl font-black text-indigo-600 tracking-widest mb-12 drop-shadow-sm">{hostedPin}</h1>

                                <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 mb-12 flex-1 flex flex-col items-center justify-center">
                                    <Users className="w-16 h-16 text-indigo-300 mb-4 animate-bounce" />
                                    <h3 className="font-bold text-2xl text-slate-700 mb-2">Waiting for students...</h3>
                                    <p className="text-slate-500">Students are entering the lobby and choosing their skins.</p>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => { setHostedPin(null); setActiveGame(null); }} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-4 rounded-xl text-lg transition-colors">
                                        Cancel Game
                                    </button>
                                    <button onClick={startLiveGame} className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-4 rounded-xl text-xl shadow-lg transition-transform hover:scale-105">
                                        Start Game Now
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* UPLOADS TAB */}
                {activeTab === "uploads" && (
                    <div className="p-8 max-w-2xl mx-auto w-full">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                            <h2 className="text-2xl font-bold mb-6">Upload Custom Content</h2>
                            <p className="text-slate-500 mb-6">Upload your own PDFs, documents, or slides and publish them to a class.</p>

                            <form className="space-y-4">
                                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                                    <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                    <p className="font-bold text-slate-700">Click to upload or drag and drop</p>
                                    <p className="text-sm text-slate-500 mt-1">PDF, DOCX, PPTX, or Images</p>
                                    <input type="file" className="hidden" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Assign to Class</label>
                                    <select className="w-full border rounded-xl px-4 py-3 bg-slate-50">
                                        <option>KG1</option>
                                        <option>KG2</option>
                                        <option>Pre-K</option>
                                    </select>
                                </div>

                                <button type="button" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mt-4">
                                    Publish Document
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* LIVE MONITOR TAB */}
                {activeTab === "live" && (
                    <div className="p-8 overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-2">Live Student Monitor</h2>
                        <p className="text-slate-500 mb-8">Real-time view of approved students in your academy.</p>

                        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="p-4 font-medium text-slate-600">Student Name</th>
                                        <th className="p-4 font-medium text-slate-600">Class</th>
                                        <th className="p-4 font-medium text-slate-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="p-8 text-center text-slate-500">
                                                No approved students found.
                                            </td>
                                        </tr>
                                    ) : (
                                        students.map(s => (
                                            <tr key={s.id} className="border-b last:border-0 hover:bg-slate-50">
                                                <td className="p-4 font-bold text-slate-800">{s.full_name}</td>
                                                <td className="p-4 text-slate-600">{s.class_name}</td>
                                                <td className="p-4">
                                                    <span className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                                                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span> Active
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </main>
    );
}