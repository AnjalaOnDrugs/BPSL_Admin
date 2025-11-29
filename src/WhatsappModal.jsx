import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Plus, Trash2, Edit2, Save, Send, ChevronRight } from 'lucide-react';

const WhatsappModal = ({ member, config, onClose, onSave, adminName }) => {
    const [activeTab, setActiveTab] = useState('initial'); // 'initial' or 'questions'
    const [isEditing, setIsEditing] = useState(false);
    const [localConfig, setLocalConfig] = useState(JSON.parse(JSON.stringify(config))); // Deep copy
    const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

    // Sync local config if prop changes (and not editing)
    useEffect(() => {
        if (!isEditing) {
            setLocalConfig(JSON.parse(JSON.stringify(config)));
        }
    }, [config, isEditing]);

    const handleSendMessage = (text) => {
        if (!member.phone) {
            alert("Member has no phone number!");
            return;
        }

        // Replace placeholders
        let finalMsg = text.replace(/{{Name}}/g, adminName || "Admin");

        // Encode and open WhatsApp
        const encodedText = encodeURIComponent(finalMsg);
        // Remove leading 0 and add 94 for Sri Lanka if needed, or just use as is if it's international format.
        // Assuming phone is stored as 07xxxxxxxx, we might need to format it.
        // The backend code suggests removing non-digits. Let's assume standard format.
        // If it starts with 0, replace with 94? Or just let user handle it?
        // The backend `getAllContactPhoneNumbers` replaces +94 with 0.
        // WhatsApp API usually expects country code.
        // Let's try to be smart: if starts with 0, replace with 94.
        let phone = member.phone.replace(/\D/g, '');
        if (phone.startsWith('0')) {
            phone = '94' + phone.substring(1);
        }

        window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
    };

    const handleSaveConfig = () => {
        onSave(localConfig);
        setIsEditing(false);
    };

    // --- EDIT HANDLERS ---
    const addInitialMessage = () => {
        const newMsg = prompt("Enter new initial message template:");
        if (newMsg) {
            setLocalConfig(prev => ({
                ...prev,
                initialMessages: [...prev.initialMessages, newMsg]
            }));
        }
    };

    const removeInitialMessage = (index) => {
        if (confirm("Delete this message template?")) {
            setLocalConfig(prev => ({
                ...prev,
                initialMessages: prev.initialMessages.filter((_, i) => i !== index)
            }));
        }
    };

    const addCategory = () => {
        const name = prompt("Enter new category name:");
        if (name) {
            setLocalConfig(prev => ({
                ...prev,
                categories: [...prev.categories, { name, questions: [] }]
            }));
        }
    };

    const removeCategory = (index) => {
        if (confirm("Delete this category and all its questions?")) {
            setLocalConfig(prev => ({
                ...prev,
                categories: prev.categories.filter((_, i) => i !== index)
            }));
            if (selectedCategoryIndex >= index && selectedCategoryIndex > 0) {
                setSelectedCategoryIndex(selectedCategoryIndex - 1);
            }
        }
    };

    const addQuestion = () => {
        const q = prompt("Enter new question:");
        if (q) {
            setLocalConfig(prev => {
                const newCats = [...prev.categories];
                newCats[selectedCategoryIndex].questions.push(q);
                return { ...prev, categories: newCats };
            });
        }
    };

    const removeQuestion = (qIndex) => {
        if (confirm("Delete this question?")) {
            setLocalConfig(prev => {
                const newCats = [...prev.categories];
                newCats[selectedCategoryIndex].questions = newCats[selectedCategoryIndex].questions.filter((_, i) => i !== qIndex);
                return { ...prev, categories: newCats };
            });
        }
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
                        <button
                            onClick={() => isEditing ? handleSaveConfig() : setIsEditing(true)}
                            className={`p-2 rounded-full transition-colors ${isEditing ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                            title={isEditing ? "Save Configuration" : "Edit Templates"}
                        >
                            {isEditing ? <Save size={20} /> : <Edit2 size={20} />}
                        </button>
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
                            {localConfig.initialMessages.map((msg, i) => (
                                <div key={i} className="group relative">
                                    <button
                                        onClick={() => !isEditing && handleSendMessage(msg)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${isEditing
                                            ? 'bg-gray-800/50 border-gray-700 cursor-default'
                                            : 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10 hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                                            }`}
                                    >
                                        <p className="text-gray-300 text-sm leading-relaxed font-light">
                                            {msg.replace(/{{Name}}/g, isEditing ? "{{Name}}" : (adminName || "Admin"))}
                                        </p>
                                        {!isEditing && (
                                            <div className="mt-3 flex items-center text-green-500 text-xs font-bold uppercase tracking-wider">
                                                <Send size={12} className="mr-2" /> Click to Send
                                            </div>
                                        )}
                                    </button>
                                    {isEditing && (
                                        <button
                                            onClick={() => removeInitialMessage(i)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}

                            {isEditing && (
                                <button
                                    onClick={addInitialMessage}
                                    className="w-full py-4 border-2 border-dashed border-gray-800 rounded-xl text-gray-500 hover:border-gray-600 hover:text-gray-300 transition-all flex items-center justify-center uppercase tracking-widest text-xs font-bold"
                                >
                                    <Plus size={16} className="mr-2" /> Add New Template
                                </button>
                            )}
                        </div>
                    )}

                    {/* QUESTIONS VIEW */}
                    {activeTab === 'questions' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">

                            {/* Categories */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {localConfig.categories.map((cat, i) => (
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
                                        {isEditing && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeCategory(i); }}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={10} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {isEditing && (
                                    <button
                                        onClick={addCategory}
                                        className="px-4 py-2 rounded-full border border-dashed border-gray-700 text-gray-500 hover:text-white hover:border-gray-500 transition-colors"
                                    >
                                        <Plus size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Questions List */}
                            <div className="space-y-3">
                                {localConfig.categories[selectedCategoryIndex]?.questions.length === 0 ? (
                                    <div className="text-center text-gray-600 py-8 italic">No questions in this category.</div>
                                ) : (
                                    localConfig.categories[selectedCategoryIndex]?.questions.map((q, i) => (
                                        <div key={i} className="group relative">
                                            <button
                                                onClick={() => !isEditing && handleSendMessage(q)}
                                                className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${isEditing
                                                    ? 'bg-gray-800/30 border-gray-800 cursor-default'
                                                    : 'bg-gray-900 border-gray-800 hover:border-pink-500/50 hover:bg-gray-800'
                                                    }`}
                                            >
                                                <span className="text-gray-300 text-sm">{q}</span>
                                                {!isEditing && <ChevronRight size={16} className="text-gray-600 group-hover:text-pink-500 transition-colors" />}
                                            </button>
                                            {isEditing && (
                                                <button
                                                    onClick={() => removeQuestion(i)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-400 p-2"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}

                                {isEditing && (
                                    <button
                                        onClick={addQuestion}
                                        className="w-full py-3 border border-dashed border-gray-800 rounded-lg text-gray-500 hover:border-gray-600 hover:text-gray-300 transition-all flex items-center justify-center uppercase tracking-widest text-xs font-bold mt-4"
                                    >
                                        <Plus size={14} className="mr-2" /> Add Question
                                    </button>
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
