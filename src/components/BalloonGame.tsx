"use client";

import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";

const BALLOON_COLORS = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-400", "bg-purple-500", "bg-pink-500"];
const BALLOON_WORDS = ["Cat", "Dog", "Apple", "Car", "Sun", "Ball"];

export default function BalloonGame() {
    const [balloons, setBalloons] = useState<any[]>([]);
    const [score, setScore] = useState(0);
    const [targetColor, setTargetColor] = useState("bg-red-500");
    const [gameActive, setGameActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);

    // Game Loop: Spawn Balloons
    useEffect(() => {
        if (!gameActive) return;

        const spawner = setInterval(() => {
            const newBalloon = {
                id: Math.random().toString(),
                color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
                x: Math.floor(Math.random() * 80) + 10, // random X position (10% to 90%)
                speed: Math.random() * 2 + 2, // 2s to 4s fall time
                word: BALLOON_WORDS[Math.floor(Math.random() * BALLOON_WORDS.length)]
            };
            setBalloons((prev) => [...prev, newBalloon]);
        }, 800); // spawn every 0.8s

        return () => clearInterval(spawner);
    }, [gameActive]);

    // Game Loop: Timer
    useEffect(() => {
        if (!gameActive) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) { setGameActive(false); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameActive]);

    // Remove balloons that have fallen off screen
    useEffect(() => {
        const cleaner = setInterval(() => {
            setBalloons((prev) => prev.filter(b => b.speed > 0)); // quick mock cleanup
        }, 1000);
        return () => clearInterval(cleaner);
    }, []);

    const popBalloon = (balloon: any) => {
        if (!gameActive) return;

        // Check if they popped the right color
        if (balloon.color === targetColor) {
            setScore(score + 10);
            setBalloons((prev) => prev.filter(b => b.id !== balloon.id));
        } else {
            setScore(score - 5); // Penalty for wrong color
        }
    };

    const startGame = () => {
        setScore(0);
        setTimeLeft(30);
        setBalloons([]);
        setGameActive(true);
        // Pick a random target color
        setTargetColor(BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)]);
    };

    return (
        <div className="w-full h-[600px] bg-sky-200 rounded-3xl relative overflow-hidden shadow-inner border-4 border-white">
            {/* UI Overlay */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
                <div className="bg-white/90 px-6 py-2 rounded-full font-bold text-xl shadow-lg flex items-center gap-2">
                    <Trophy className="text-yellow-500 w-6 h-6" /> Score: {score}
                </div>
                <div className="bg-white/90 px-6 py-2 rounded-full font-bold text-xl shadow-lg">
                    Time: {timeLeft}s
                </div>
            </div>

            {/* Target Instructions */}
            <div className="absolute top-20 w-full text-center z-20">
                <div className="bg-white/90 inline-block px-8 py-3 rounded-2xl shadow-lg font-bold text-2xl">
                    Pop the <span className={`inline-block w-6 h-6 rounded-full ${targetColor} border-2 border-slate-800`}></span> balloons!
                </div>
            </div>

            {/* Game Area */}
            {gameActive ? (
                <>
                    {balloons.map((b) => (
                        <div
                            key={b.id}
                            onClick={() => popBalloon(b)}
                            className={`absolute bottom-[-100px] w-20 h-24 rounded-full ${b.color} cursor-pointer flex items-center justify-center shadow-lg transform hover:scale-105 active:scale-95`}
                            style={{
                                left: `${b.x}%`,
                                animation: `floatUp ${b.speed}s linear forwards`
                            }}
                        >
                            <div className="w-2 h-10 bg-slate-800/20 absolute bottom-[-30px] left-1/2 -translate-x-1/2"></div>
                            <span className="text-white font-bold text-sm drop-shadow-md">{b.word}</span>
                        </div>
                    ))}
                    <style jsx>{`
            @keyframes floatUp {
              0% { transform: translateY(0); }
              100% { transform: translateY(-800px); opacity: 0; }
            }
          `}</style>
                </>
            ) : (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-30 backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-3xl text-center shadow-2xl">
                        <h2 className="text-4xl font-extrabold text-slate-800 mb-4">
                            {timeLeft === 0 ? "Time's Up!" : "Ready to Play?"}
                        </h2>
                        {timeLeft === 0 && <p className="text-2xl font-bold text-emerald-600 mb-6">Final Score: {score}</p>}
                        <button onClick={startGame} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-2xl px-12 py-4 rounded-full shadow-lg">
                            {timeLeft === 0 ? "Play Again" : "Start Game"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}