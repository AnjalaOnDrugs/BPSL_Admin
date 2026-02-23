import React, { useState, useRef, useCallback } from 'react';
import { toJpeg } from 'html-to-image';
import { Download, X, Type, Calendar, Cake } from 'lucide-react';
import bpslLogo from './assets/BPSL logo.png';

// --- BIAS IMAGES ---
const BIAS_IMAGES = {
    lisa: "https://i.ibb.co/6cjn2p3K/20240314-Lisa-Manoban-07.jpg",
    jennie: "https://i.ibb.co/N2N5tWXC/FI-S-Z7ak-AAFRVy.jpg",
    rose: "https://i.ibb.co/JjMdDydt/Blackpink-Ros-Rimowa-1.jpg",
    jisoo: "https://i.ibb.co/8DM6vjrs/Fg8zt-Qx-WQAE-5c0.jpg",
    ot4: "https://i.ibb.co/qLQD7J9S/b3f41670-7a3c-11f0-a34f-318be3fb0481.jpg"
};

const getBiasImage = (bias) => {
    if (!bias) return null;
    const b = bias.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (b.includes('lisa')) return BIAS_IMAGES.lisa;
    if (b.includes('jennie')) return BIAS_IMAGES.jennie;
    if (b.includes('rose') || b.includes('rosé')) return BIAS_IMAGES.rose;
    if (b.includes('jisoo')) return BIAS_IMAGES.jisoo;
    if (b.includes('ot4') || b.includes('all') || b.includes('group')) return BIAS_IMAGES.ot4;
    return null;
};

const BirthdayCardGenerator = ({ member, onClose }) => {
    console.log(getBiasImage(member?.bias));
    const [name, setName] = useState(member?.name || 'Name');
    const [age, setAge] = useState(member?.ageTurning?.toString() || 'Age');
    const [showAge, setShowAge] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const cardRef = useRef(null);

    const handleDownload = useCallback(async () => {
        if (cardRef.current === null) {
            return;
        }

        setIsGenerating(true);

        try {
            const dataUrl = await toJpeg(cardRef.current, { quality: 0.95, pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `birthday-wish-${name.replace(/\s+/g, '-').toLowerCase()}.jpeg`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate image', err);
        } finally {
            setIsGenerating(false);
        }
    }, [name]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row-reverse max-h-[90vh] md:max-h-[85vh]">

                {/* --- PREVIEW SECTION --- */}
                <div className="w-full md:w-2/3 bg-black flex items-center justify-center p-4 md:p-8 relative overflow-hidden shrink-0">
                    {/* Background Ambience */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-50"></div>

                    {/* CARD CONTAINER - Fixed Aspect Ratio Container */}
                    {/* On mobile: scale down but keep aspect ratio. On desktop: fixed size. */}
                    {/* WRAPPER: Explicit height on mobile to reclaim space from scaled element */}
                    <div className="relative w-full h-[320px] md:h-auto md:w-auto flex items-center justify-center">
                        <div className="absolute md:relative shadow-2xl shadow-black transform scale-[0.55] sm:scale-75 md:scale-90 lg:scale-100 transition-transform duration-300 origin-center" style={{ width: '400px', height: '500px' }}> {/* 4:5 Ratio approx */}

                            {/* THE ACTUAL CARD TO CAPTURE */}
                            <div
                                ref={cardRef}
                                className="w-full h-full bg-black relative overflow-hidden flex flex-col items-center justify-center text-center"
                            >
                                {/* 1. Background Layer */}
                                <div className="absolute inset-0 z-0">
                                    {/* Dark Base */}
                                    <div className="absolute inset-0 bg-[#050505]"></div>

                                    {/* Neon Gradients */}
                                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-purple-900/40 to-transparent"></div>
                                    <div className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-gradient-to-t from-cyan-900/20 to-transparent rounded-full blur-3xl"></div>

                                    {/* Abstract Shapes */}
                                    <div className="absolute top-10 left-10 w-32 h-32 border border-pink-500/20 rounded-full blur-[2px]"></div>
                                    <div className="absolute bottom-20 right-10 w-48 h-48 border border-cyan-500/20 rounded-full blur-[1px]"></div>

                                    {/* Grid Pattern Overlay */}
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

                                    {/* Bias Image Overlay (Blended) */}
                                    {getBiasImage(member?.bias) && (
                                        <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none">
                                            <img
                                                src={getBiasImage(member?.bias)}
                                                alt="Bias"
                                                className="w-full h-full object-cover grayscale contrast-125 brightness-75 mask-image-gradient"
                                                style={{ maskImage: 'linear-gradient(to bottom, transparent, black, transparent)' }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* 2. Border Frame */}
                                <div className="absolute inset-4 border border-white/10 z-10 rounded-lg">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-1 bg-black"></div>
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-20 h-1 bg-black"></div>
                                </div>

                                {/* 3. Content Layer */}
                                <div className="relative z-20 px-8 py-12 flex flex-col items-center h-full justify-between">

                                    {/* Top Decoration */}
                                    <div className="mb-4 animate-pulse">
                                        <img src={bpslLogo} alt="BPSL Logo" className="w-16 h-auto drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                                    </div>

                                    {/* Main Text */}
                                    <div className="flex-1 flex flex-col justify-center items-center space-y-2">
                                        <h3 className="text-cyan-400 tracking-[0.3em] text-sm font-bold uppercase mb-2">Happy Birthday</h3>

                                        <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] leading-tight">
                                            {name}
                                        </h1>

                                        {showAge ? (
                                            <div className="flex items-center space-x-4 mt-6">
                                                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-pink-500"></div>
                                                <div className="text-2xl font-light text-white italic">
                                                    Turning <span className="text-pink-500 font-bold not-italic">{age}</span>
                                                </div>
                                                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-pink-500"></div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-3 !mt-16 animate-in fade-in zoom-in duration-500">
                                                <Cake size={16} className="text-cyan-400" />
                                                <div className="px-4 py-1.5 border border-cyan-500/30 rounded-full bg-cyan-950/30 backdrop-blur-md">
                                                    <span className="text-cyan-300 text-xs font-bold tracking-[0.25em] uppercase">
                                                        {member?.dateAdded ? `BPSL Member • Since ${new Date(member.dateAdded).getFullYear()}` : 'Official Member'}
                                                    </span>
                                                </div>
                                                <Cake size={16} className="text-cyan-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-auto">
                                        <p className="text-gray-500 text-[10px] tracking-[0.2em] uppercase">
                                            Wishing you a fantastic year ahead
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- CONTROLS SECTION --- */}
                <div className="w-full md:w-1/3 p-6 md:p-8 border-t md:border-t-0 md:border-r border-gray-800 flex flex-col bg-gray-900/50 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6 md:mb-8">
                        <h2 className="text-lg md:text-xl font-light text-white tracking-widest uppercase">Generate Wish</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-4 md:space-y-6 flex-1">
                        <div>
                            <label className="flex items-center text-xs font-bold text-cyan-500 uppercase tracking-widest mb-2 md:mb-3">
                                <Type size={14} className="mr-2" /> Recipient Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-pink-500 focus:outline-none transition-colors text-sm"
                                placeholder="Enter Name"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2 md:mb-3">
                                <label className="flex items-center text-xs font-bold text-cyan-500 uppercase tracking-widest">
                                    <Calendar size={14} className="mr-2" /> Turning Age
                                </label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={showAge}
                                        onChange={(e) => setShowAge(e.target.checked)}
                                    />
                                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                                </label>
                            </div>

                            {showAge && (
                                <input
                                    type="text"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-pink-500 focus:outline-none transition-colors text-sm animate-in fade-in slide-in-from-top-2 duration-200"
                                    placeholder="Enter Age"
                                />
                            )}
                        </div>
                    </div>

                    <div className="mt-6 md:mt-8 pt-6 border-t border-gray-800">
                        <button
                            onClick={handleDownload}
                            disabled={isGenerating}
                            className="w-full bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-cyan-500/50 text-gray-400 hover:text-cyan-400 font-medium py-3 md:py-4 rounded-xl transition-all transform active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
                        >
                            {isGenerating ? (
                                <span className="animate-pulse">Generating...</span>
                            ) : (
                                <>
                                    <Download size={16} className="mr-2" /> Download JPEG
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BirthdayCardGenerator;
