import { Smile, Heart, Star, Sun, Cloud, Music, Leaf, Fish, Droplet, Sparkles, Crown, Gift, Moon, Flower, Bird } from "lucide-react";

export const THEMES = [
    // --- SOFT & PASTEL (Great for calming/relaxing) ---
    { id: "bubble_bath", name: "Bubble Bath", icon: Droplet, bg: "bg-sky-100", text: "text-sky-900", btn: "bg-sky-300 hover:bg-sky-200 shadow-md", border: "border-sky-300", accent: "text-sky-600" },
    { id: "cloud_nine", name: "Cloud Nine", icon: Cloud, bg: "bg-slate-50", text: "text-slate-700", btn: "bg-blue-200 hover:bg-blue-100 shadow-md", border: "border-blue-200", accent: "text-blue-500" },
    { id: "fairy_garden", name: "Fairy Garden", icon: Flower, bg: "bg-pink-50", text: "text-pink-900", btn: "bg-pink-300 hover:bg-pink-200 shadow-md", border: "border-pink-200", accent: "text-pink-500" },
    { id: "starlight", name: "Starlight Lullaby", icon: Moon, bg: "bg-indigo-100", text: "text-indigo-900", btn: "bg-indigo-300 hover:bg-indigo-200 shadow-md", border: "border-indigo-300", accent: "text-indigo-600" },
    { id: "rainbow", name: "Rainbow Road", icon: Sparkles, bg: "bg-gradient-to-br from-red-100 via-yellow-100 to-blue-100", text: "text-slate-800", btn: "bg-white/80 hover:bg-white shadow-md", border: "border-white", accent: "text-purple-600" },

    // --- ANIMALS & NATURE (Great for engagement) ---
    { id: "jungle", name: "Jungle Pals", icon: Leaf, bg: "bg-green-100", text: "text-green-900", btn: "bg-green-400 hover:bg-green-300 shadow-md", border: "border-green-400", accent: "text-green-700" },
    { id: "under_sea", name: "Under the Sea", icon: Fish, bg: "bg-cyan-100", text: "text-cyan-900", btn: "bg-cyan-400 hover:bg-cyan-300 shadow-md", border: "border-cyan-400", accent: "text-cyan-700" },
    { id: "farmyard", name: "Farmyard", icon: Sun, bg: "bg-amber-100", text: "text-amber-900", btn: "bg-amber-400 hover:bg-amber-300 shadow-md", border: "border-amber-400", accent: "text-amber-700" },
    { id: "dino_dig", name: "Dino Dig", icon: Sparkles, bg: "bg-lime-100", text: "text-lime-900", btn: "bg-lime-400 hover:bg-lime-300 shadow-md", border: "border-lime-400", accent: "text-lime-700" },
    { id: "teddy_bear", name: "Teddy Bear Picnic", icon: Heart, bg: "bg-orange-100", text: "text-orange-900", btn: "bg-orange-300 hover:bg-orange-200 shadow-md", border: "border-orange-300", accent: "text-orange-600" },

    // --- PLAYFUL & FUN (Great for high energy) ---
    { id: "candy_land", name: "Candy Land", icon: Gift, bg: "bg-pink-100", text: "text-pink-900", btn: "bg-pink-400 hover:bg-pink-300 text-white shadow-md", border: "border-pink-400", accent: "text-pink-600" },
    { id: "toy_box", name: "Toy Box", icon: Gift, bg: "bg-yellow-100", text: "text-yellow-900", btn: "bg-yellow-400 hover:bg-yellow-300 shadow-md", border: "border-yellow-400", accent: "text-yellow-700" },
    { id: "doodle_bug", name: "Doodle Bug", icon: Music, bg: "bg-white", text: "text-slate-800", btn: "bg-yellow-200 hover:bg-yellow-100 shadow-md border-2 border-dashed border-yellow-400", border: "border-yellow-300", accent: "text-blue-500" },
    { id: "royal_castle", name: "Royal Castle", icon: Crown, bg: "bg-purple-100", text: "text-purple-900", btn: "bg-purple-400 hover:bg-purple-300 text-white shadow-md", border: "border-purple-400", accent: "text-purple-700" },
    { id: "sunny_day", name: "Sunny Day", icon: Sun, bg: "bg-yellow-50", text: "text-yellow-800", btn: "bg-yellow-400 hover:bg-yellow-300 shadow-md", border: "border-yellow-400", accent: "text-yellow-600" },
];