"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Plus, Users, BookOpen, CheckCircle, Loader2, UserPlus, ShieldAlert } from "lucide-react";

export default function TeacherClassManager() {
    const router = useRouter();
    const supabase = createClient();

    const [classes, setClasses] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [newClassName, setNewClassName] = useState("");

    // New Student States
    const [newStudentName, setNewStudentName] = useState("");
    const [newStudentGrade, setNewStudentGrade] = useState("Pre-K");
    const [newStudentPin, setNewStudentPin] = useState("");

    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [addingStudent, setAddingStudent] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push("/sign-in");

        // Fetch teacher's custom classes
        const { data: classData } = await supabase
            .from("teacher_classes")
            .select("*")
            .eq("teacher_id", user.id)
            .order("created_at", { ascending: true });
        if (classData) setClasses(classData);

        // Fetch ONLY students assigned to this teacher
        const { data: studentData } = await supabase
            .from("children")
            .select("id, full_name, class_id, class_name")
            .eq("teacher_id", user.id)
            .eq("is_approved", true)
            .order("full_name", { ascending: true });

        if (studentData) setStudents(studentData);

        setLoading(false);
    }

    async function createClass() {
        if (!newClassName.trim()) return;
        setCreating(true);

        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from("teacher_classes").insert({
            teacher_id: user?.id,
            name: newClassName
        });

        setNewClassName("");
        setCreating(false);
        fetchData();
    }

    // 🚨 UPDATED: Handle existing students gracefully via the API route
    async function addNewStudent(e: React.FormEvent) {
        e.preventDefault();
        if (!newStudentName.trim() || newStudentPin.length !== 4) {
            return alert("Please enter a name and a 4-digit PIN.");
        }
        setAddingStudent(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("You must be logged in.");
            setAddingStudent(false);
            return;
        }

        try {
            const res = await fetch("/api/teacher/add-student", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: newStudentName,
                    studentPin: newStudentPin,
                    grade: newStudentGrade,
                    teacherId: user.id
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            alert("✅ " + data.message);
            setNewStudentName("");
            setNewStudentPin("");
            fetchData(); // Refresh the list

        } catch (err: any) {
            alert("Failed to add student: " + err.message);
        } finally {
            setAddingStudent(false);
        }
    }

    async function assignStudent(studentId: string, classId: string) {
        await supabase.from("children").update({ class_id: classId }).eq("id", studentId);
        fetchData();
    }

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

    const unassignedStudents = students.filter(s => !s.class_id);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
            <div className="max-w-6xl mx-auto">

                <Link href="/teacher" prefetch={false} className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white mb-6">
                    <ArrowLeft size={16} /> Back to Hub
                </Link>

                <h1 className="text-3xl font-extrabold text-white mb-8 flex items-center gap-3">
                    <Users className="text-indigo-400 w-8 h-8" /> Class Manager
                </h1>

                <div className="grid md:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: Forms */}
                    <div className="space-y-6">

                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Create a Class Group</h2>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="e.g., KG1 Blue Group"
                                    value={newClassName}
                                    onChange={(e) => setNewClassName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-indigo-500"
                                />
                                <button
                                    onClick={createClass}
                                    disabled={creating}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                                >
                                    {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} Create Class
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                <UserPlus className="text-emerald-400" size={20} /> Add Student
                            </h2>
                            <p className="text-xs text-slate-500 mb-4">Normally the Admin assigns students, but you can add one manually here.</p>
                            <form onSubmit={addNewStudent} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Student Full Name"
                                    value={newStudentName}
                                    onChange={(e) => setNewStudentName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-emerald-500"
                                />
                                <select
                                    value={newStudentGrade}
                                    onChange={(e) => setNewStudentGrade(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-emerald-500"
                                >
                                    <option value="Pre-K">Pre-K</option>
                                    <option value="KG1">KG1</option>
                                    <option value="KG2">KG2</option>
                                    <option value="Grade 1">Grade 1</option>
                                </select>
                                <input
                                    type="text"
                                    maxLength={4}
                                    placeholder="4-Digit PIN"
                                    value={newStudentPin}
                                    onChange={(e) => setNewStudentPin(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-emerald-500 text-center tracking-widest font-bold"
                                />
                                <button
                                    type="submit"
                                    disabled={addingStudent}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                                >
                                    {addingStudent ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />} Add to Roster
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Manage Students */}
                    <div className="md:col-span-2 space-y-6">

                        {unassignedStudents.length > 0 && (
                            <div className="bg-amber-900/20 border border-amber-500/30 rounded-3xl p-6">
                                <h2 className="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                                    <ShieldAlert size={20} /> New Students Needing a Class
                                </h2>
                                <p className="text-sm text-amber-200 mb-4">These students are in your roster but not assigned to a specific group yet.</p>

                                <div className="grid sm:grid-cols-2 gap-3">
                                    {unassignedStudents.map(student => (
                                        <div key={student.id} className="flex flex-col bg-slate-950 p-4 rounded-xl border border-amber-500/20 gap-3">
                                            <div>
                                                <span className="font-bold text-white block">{student.full_name}</span>
                                                <span className="text-xs text-slate-400">{student.class_name}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {classes.length === 0 && <span className="text-xs text-amber-500">Create a class group first.</span>}
                                                {classes.map(cls => (
                                                    <button
                                                        key={cls.id}
                                                        onClick={() => assignStudent(student.id, cls.id)}
                                                        className="text-xs bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded-lg font-bold transition-colors"
                                                    >
                                                        + {cls.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {classes.length === 0 ? (
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center">
                                <p className="text-slate-500">Create a class group first to start organizing your students.</p>
                            </div>
                        ) : (
                            classes.map((cls) => (
                                <div key={cls.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <BookOpen className="text-emerald-400" size={20} />
                                        <h3 className="font-bold text-lg text-white">{cls.name}</h3>
                                        <span className="bg-slate-800 text-xs px-2 py-1 rounded-full text-slate-400 ml-auto">
                                            {students.filter(s => s.class_id === cls.id).length} Students
                                        </span>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {students.filter(s => s.class_id === cls.id).map(student => (
                                            <div key={student.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                                                <span className="font-medium text-sm text-white">{student.full_name}</span>
                                                <button
                                                    onClick={() => assignStudent(student.id, "")}
                                                    className="text-xs text-red-400 hover:text-red-300 font-bold"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                        {students.filter(s => s.class_id === cls.id).length === 0 && (
                                            <p className="text-slate-600 text-sm italic col-span-2">No students assigned to this group yet.</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}