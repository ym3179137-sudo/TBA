"use client";
import { useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";

export default function TeacherFormBuilder({ onSave }: { onSave: (schema: any) => void }) {
    const [questions, setQuestions] = useState<any[]>([
        { id: "q1", type: "short_text", label: "Question 1", required: true }
    ]);

    const addQuestion = (type: string) => {
        setQuestions([...questions, {
            id: `q${Date.now()}`,
            type,
            label: "New Question",
            options: type === 'multiple_choice' || type === 'checkboxes' ? ["Option 1", "Option 2"] : undefined
        }]);
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const newQ = [...questions];
        newQ[index][field] = value;
        setQuestions(newQ);
    };

    return (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Form Builder</h2>

            {questions.map((q, i) => (
                <div key={q.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 relative">
                    <button onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 text-red-400 p-2 hover:bg-red-500/10 rounded-lg">
                        <Trash2 size={16} />
                    </button>

                    <input
                        type="text"
                        value={q.label}
                        onChange={(e) => updateQuestion(i, 'label', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded-lg mb-3 font-bold"
                    />

                    <select value={q.type} onChange={(e) => updateQuestion(i, 'type', e.target.value)} className="bg-slate-800 text-sm text-slate-300 p-2 rounded-lg mb-3">
                        <option value="short_text">Short Text</option>
                        <option value="long_text">Long Text</option>
                        <option value="multiple_choice">Multiple Choice (Radio)</option>
                        <option value="checkboxes">Checkboxes</option>
                    </select>

                    {(q.type === 'multiple_choice' || q.type === 'checkboxes') && (
                        <div className="mt-3 space-y-2 pl-4 border-l-2 border-slate-700">
                            {q.options.map((opt: string, optIdx: number) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => {
                                            const newOpts = [...q.options];
                                            newOpts[optIdx] = e.target.value;
                                            updateQuestion(i, 'options', newOpts);
                                        }}
                                        className="flex-1 bg-slate-900 border border-slate-700 text-sm text-white p-1 rounded"
                                    />
                                </div>
                            ))}
                            <button onClick={() => updateQuestion(i, 'options', [...q.options, `Option ${q.options.length + 1}`])} className="text-xs text-emerald-400 font-bold mt-2">+ Add Option</button>
                        </div>
                    )}
                </div>
            ))}

            <div className="flex gap-2">
                <button onClick={() => addQuestion('short_text')} className="text-sm bg-slate-800 text-white p-2 rounded-lg flex items-center gap-1"><Plus size={14} /> Text</button>
                <button onClick={() => addQuestion('multiple_choice')} className="text-sm bg-slate-800 text-white p-2 rounded-lg flex items-center gap-1"><Plus size={14} /> Choice</button>
                <button onClick={() => addQuestion('checkboxes')} className="text-sm bg-slate-800 text-white p-2 rounded-lg flex items-center gap-1"><Plus size={14} /> Checkbox</button>
            </div>

            <button onClick={() => onSave({ questions })} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                <Save size={18} /> Save Form Schema
            </button>
        </div>
    );
}