"use client";
import { useState, useEffect } from "react";
import { useLockMode } from "@/hooks/useLockMode";
import { AlertTriangle } from "lucide-react";

export default function StudentFormView({ assignment, onSubmit }: any) {
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [violations, setViolations] = useState<string[]>([]);
    const isLocked = assignment.settings?.lockMode === true;
    const questions = assignment.settings?.questions || [];

    // Hook for Lock Mode (Tab switching)
    useLockMode(isLocked, (reason) => {
        setViolations(prev => [...prev, reason]);
    });

    const handleChange = (id: string, value: any) => {
        setAnswers(prev => ({ ...prev, [id]: value }));
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 p-6">
            {isLocked && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center gap-3 font-bold sticky top-4 z-50 backdrop-blur-md">
                    <AlertTriangle /> LOCK MODE ACTIVE: Leaving this tab will be logged.
                </div>
            )}

            {questions.map((q: any) => (
                <div key={q.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <label className="block text-lg font-bold text-white mb-3">{q.label}</label>

                    {q.type === 'short_text' && (
                        <input type="text" onChange={(e) => handleChange(q.id, e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white" />
                    )}

                    {q.type === 'long_text' && (
                        <textarea onChange={(e) => handleChange(q.id, e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white h-32" />
                    )}

                    {q.type === 'multiple_choice' && q.options.map((opt: string) => (
                        <label key={opt} className="flex items-center gap-3 text-slate-300 mb-2 cursor-pointer p-2 hover:bg-slate-700/50 rounded-lg">
                            <input type="radio" name={q.id} value={opt} onChange={() => handleChange(q.id, opt)} className="w-5 h-5 accent-emerald-500" />
                            {opt}
                        </label>
                    ))}

                    {q.type === 'checkboxes' && q.options.map((opt: string) => (
                        <label key={opt} className="flex items-center gap-3 text-slate-300 mb-2 cursor-pointer p-2 hover:bg-slate-700/50 rounded-lg">
                            <input type="checkbox" value={opt} onChange={(e) => {
                                const current = answers[q.id] || [];
                                const newVals = e.target.checked ? [...current, opt] : current.filter((v: string) => v !== opt);
                                handleChange(q.id, newVals);
                            }} className="w-5 h-5 accent-emerald-500" />
                            {opt}
                        </label>
                    ))}
                </div>
            ))}

            <button onClick={() => onSubmit(answers, violations)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-4 rounded-xl text-lg shadow-lg">
                Submit Assignment
            </button>
        </div>
    );
}