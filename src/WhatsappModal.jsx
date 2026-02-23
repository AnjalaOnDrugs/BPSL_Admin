import React, { useState } from 'react';
import { X, MessageCircle, Send, ChevronRight } from 'lucide-react';

const WhatsappModal = ({ member, config, onClose, adminName }) => {
    const [activeTab, setActiveTab] = useState('initial'); // 'initial' or 'questions'
    const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

    const handleSendMessage = (text) => {
        if (!member.phone) {
            alert("Member has no phone number!");
            return;
        }

        // Replace placeholders
        let finalMsg = text.replace(/{{Name}}/g, adminName || "Admin");

        // Encode and open WhatsApp
        const encodedText = encodeURIComponent(finalMsg);

        // Format phone number
        let phone = member.phone.replace(/\D/g, '');
        if (phone.startsWith('0')) {
            phone = '94' + phone.substring(1);
        }

        window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-gray-900 border border-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-black/40">
                    <div>
                        <h2 className="text-xl font-light text-white flex items-center">
                            <MessageCircle className="mr-3 text-green-500" size={24} />
                            WhatsApp <span className="text-gray-500 mx-2">to</span> <span className="text-cyan-400">{member.name}</span>
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">Send predefined messages or questions</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* TABS */}
                    <div className="flex space-x-6 border-b border-gray-800 pb-1">
                        <button
                            onClick={() => setActiveTab('initial')}
                            className={`pb-3 text-sm font-medium uppercase tracking-wider transition-all ${activeTab === 'initial' ? 'text-green-500 border-b-2 border-green-500' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Initial Messages
                        </button>
                        <button
                            onClick={() => setActiveTab('questions')}
                            className={`pb-3 text-sm font-medium uppercase tracking-wider transition-all ${activeTab === 'questions' ? 'text-pink-500 border-b-2 border-pink-500' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Questions
                        </button>
                    </div>

                    {/* INITIAL MESSAGES VIEW */}
                    {activeTab === 'initial' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {config?.initialMessages?.map((msg, i) => (
                                <div key={i} className="group relative">
                                    <button
                                        onClick={() => handleSendMessage(msg)}
                                        className="w-full text-left p-4 rounded-xl border transition-all duration-300 bg-green-500/5 border-green-500/20 hover:bg-green-500/10 hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                                    >
                                        <p className="text-gray-300 text-sm leading-relaxed font-light">
                                            {msg.replace(/{{Name}}/g, adminName || "Admin")}
                                        </p>
                                        <div className="mt-3 flex items-center text-green-500 text-xs font-bold uppercase tracking-wider">
                                            <Send size={12} className="mr-2" /> Click to Send
                                        </div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* QUESTIONS VIEW */}
                    {activeTab === 'questions' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">

                            {/* Categories */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {config?.categories?.map((cat, i) => (
                                    <div key={i} className="relative group">
                                        <button
                                            onClick={() => setSelectedCategoryIndex(i)}
                                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${selectedCategoryIndex === i
                                                ? 'bg-pink-500 text-white border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.4)]'
                                                : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
                                                }`}
                                        >
                                            {cat.name}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Questions List */}
                            <div className="space-y-3">
                                {config?.categories?.[selectedCategoryIndex]?.questions.length === 0 ? (
                                    <div className="text-center text-gray-600 py-8 italic">No questions in this category.</div>
                                ) : (
                                    config?.categories?.[selectedCategoryIndex]?.questions.map((q, i) => (
                                        <div key={i} className="group relative">
                                            <button
                                                onClick={() => handleSendMessage(q)}
                                                className="w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-300 bg-gray-900 border-gray-800 hover:border-pink-500/50 hover:bg-gray-800"
                                            >
                                                <span className="text-gray-300 text-sm">{q}</span>
                                                <ChevronRight size={16} className="text-gray-600 group-hover:text-pink-500 transition-colors" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default WhatsappModal;
