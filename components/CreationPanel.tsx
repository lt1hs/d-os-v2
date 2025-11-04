import React, { useState } from 'react';

interface CreationPanelProps {
    prompt: string;
    setPrompt: (prompt: string) => void;
    aspectRatio: "16:9" | "9:16";
    setAspectRatio: (ar: "16:9" | "9:16") => void;
    resolution: "720p" | "1080p";
    setResolution: (res: "720p" | "1080p") => void;
    onGenerate: () => void;
    isLoading: boolean;
}

export const CreationPanel: React.FC<CreationPanelProps> = ({ prompt, setPrompt, aspectRatio, setAspectRatio, resolution, setResolution, onGenerate, isLoading }) => {
    const [duration, setDuration] = useState(5);

    return (
        <div className="w-full px-4 pb-4">
            <div className="bg-gray-800/60 backdrop-blur-xl border border-border-color rounded-2xl p-3 shadow-lg w-full max-w-4xl mx-auto flex flex-col gap-2">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe visuals and dynamics in the video."
                    className="w-full bg-transparent text-white/90 placeholder:text-white/40 text-base resize-none focus:outline-none h-10 px-1"
                />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                        <button className="flex items-center px-3 py-1.5 bg-white/10 text-white/80 text-xs font-medium rounded-full hover:bg-white/20 transition-colors">
                            <i className="fi fi-rr-film mr-1.5" /> Video
                        </button>
                        <button className="px-3 py-1.5 bg-white/10 text-white/80 text-xs font-medium rounded-full hover:bg-white/20 transition-colors">
                            Text to Video
                        </button>
                        <button className="flex items-center px-3 py-1.5 bg-white/10 text-white/80 text-xs font-medium rounded-full hover:bg-white/20 transition-colors">
                            <i className="fi fi-rr-globe mr-1.5" /> Wan2.5
                        </button>
                        <button 
                            className="px-3 py-1.5 bg-white/10 text-white/80 text-xs font-medium rounded-full hover:bg-white/20 transition-colors"
                            onClick={() => setAspectRatio(aspectRatio === '16:9' ? '9:16' : '16:9')}
                        >
                            {aspectRatio} | {resolution}
                        </button>
                        <button className="px-3 py-1.5 bg-white/10 text-white/80 text-xs font-medium rounded-full hover:bg-white/20 transition-colors">
                            {duration}s
                        </button>

                        <div className="flex items-center gap-1">
                             <button className="w-8 h-8 flex items-center justify-center bg-white/10 text-white/80 rounded-full hover:bg-white/20 transition-colors text-xl">
                                <i className="fi fi-rr-waveform" />
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center bg-white/10 text-white/80 rounded-full hover:bg-white/20 transition-colors text-xl">
                                <i className="fi fi-rr-book" />
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center bg-white/10 text-white/80 rounded-full hover:bg-white/20 transition-colors text-xl">
                                <i className="fi fi-rr-settings-sliders" />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={onGenerate}
                        disabled={isLoading}
                        className="flex items-center px-4 py-2 bg-gray-300 text-gray-800 text-sm font-semibold rounded-full hover:bg-white disabled:bg-gray-500/50 disabled:cursor-not-allowed transition-colors"
                    >
                        <i className="fi fi-rr-sparkles text-gray-600 mr-1.5" />
                        {isLoading ? '...' : '10'}
                    </button>
                </div>
            </div>
        </div>
    );
};