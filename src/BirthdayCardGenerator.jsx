import React, { useState, useRef, useCallback } from 'react';
import { toJpeg } from 'html-to-image';
import { Download, X, Type, Calendar, Sparkles } from 'lucide-react';
import bpslLogo from './assets/BPSL logo.png';

// --- BIAS IMAGES ---
const BIAS_IMAGES = {
    lisa: "https://lh3.google.com/u/2/d/1QrIDiPN8oy9_UYtnJbAQjFtOH-19jWDO=w2560-h966-iv1?auditContext=thumbnail&auditContext=prefetch",
    jennie: "https://lh3.google.com/u/2/d/1o2SERMdD8ZZIuWZtn8fMGcucybXLqLFu=w2560-h966-iv1?auditContext=thumbnail&auditContext=prefetch",
    rose: "https://lh3.google.com/u/2/d/1787KLOx3hJly0PNbTIH5YtBTVIQ0BCC1=w2560-h966-iv1?auditContext=thumbnail&auditContext=prefetch",
    jisoo: "https://lh3.google.com/u/2/d/1gYlbnYk9MaTZNmj945u9aig1vVsOtWS1=w2560-h966-iv1?auditContext=thumbnail&auditContext=prefetch",
    ot4: "https://lh3.google.com/u/2/d/1Mn0CPbfhuJLqVvgGXG8MUnvfTt7U7PmC=w1278-h965-iv1?auditContext=thumbnail&auditContext=prefetch"
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
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">

                {/* --- CONTROLS SECTION --- */}
                <div className="w-full md:w-1/3 p-8 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col bg-gray-900/50">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-light text-white tracking-widest uppercase">Generate Wish</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-6 flex-1">
                        <div>
                            <label className="flex items-center text-xs font-bold text-cyan-500 uppercase tracking-widest mb-3">
                                <Type size={14} className="mr-2" /> Recipient Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-pink-500 focus:outline-none transition-colors"
                                placeholder="Enter Name"
                            />
                        </div>

                        <div>
                            <label className="flex items-center text-xs font-bold text-cyan-500 uppercase tracking-widest mb-3">
                                <Calendar size={14} className="mr-2" /> Turning Age
                            </label>
                            <input
                                type="text"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-pink-500 focus:outline-none transition-colors"
                                placeholder="Enter Age"
                            />
                        </div>

                        <div className="p-4 bg-cyan-900/10 border border-cyan-500/20 rounded-lg">
                            <p className="text-xs text-cyan-400 leading-relaxed">
                                <Sparkles size={12} className="inline mr-1" />
                                This premium template is designed for high-quality sharing. Adjust the text to fit perfectly.
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-800">
                        <button
                            onClick={handleDownload}
                            disabled={isGenerating}
                            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-pink-500/20 transition-all transform active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <span className="animate-pulse">Generating...</span>
                            ) : (
                                <>
                                    <Download size={20} className="mr-2" /> Download JPEG
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* --- PREVIEW SECTION --- */}
                <div className="w-full md:w-2/3 bg-black flex items-center justify-center p-8 relative overflow-hidden">
                    {/* Background Ambience */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-50"></div>

                    {/* CARD CONTAINER - Fixed Aspect Ratio Container */}
                    <div className="relative shadow-2xl shadow-black" style={{ width: '400px', height: '500px' }}> {/* 4:5 Ratio approx */}

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

                                    <div className="flex items-center space-x-4 mt-6">
                                        <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-pink-500"></div>
                                        <div className="text-2xl font-light text-white italic">
                                            Turning <span className="text-pink-500 font-bold not-italic">{age}</span>
                                        </div>
                                        <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-pink-500"></div>
                                    </div>
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
        </div>
    );
};

export default BirthdayCardGenerator;
