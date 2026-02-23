import React from 'react';
import { Loader, Wifi } from 'lucide-react';

const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center">
                {/* Logo/Icon */}
                <div className="w-20 h-20 mb-8 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl animate-spin-slow blur-md opacity-50"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.5)] overflow-hidden">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                    </div>
                </div>

                {/* Loading Text */}
                <h2 className="text-3xl font-thin text-white tracking-[0.2em] mb-4 animate-pulse">
                    SYNCING
                </h2>

                <div className="flex items-center space-x-2 text-cyan-400/70 text-sm font-mono">
                    <Wifi size={14} className="animate-pulse" />
                    <span>ESTABLISHING SECURE CONNECTION</span>
                </div>

                {/* Progress Bar */}
                <div className="w-64 h-1 bg-gray-900 rounded-full mt-8 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent w-1/2 animate-shimmer"></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
