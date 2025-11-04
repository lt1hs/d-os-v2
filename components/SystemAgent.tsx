import React, { useState, useEffect, useRef } from 'react';
import { getSystemAction } from '../services/geminiService';
import { SystemAction } from '../types';

interface HistoryItem {
    id: number;
    prompt: string;
    response: string;
}

interface SystemAgentProps {
    onClose: () => void;
    onExecuteAction: (action: SystemAction['action'], payload: SystemAction['payload']) => void;
}

const suggestions = [
    "Open the image studio",
    "Create a new workspace named 'Client X'",
    "Change my accent color to green",
    "Lock the screen",
];

export const SystemAgent: React.FC<SystemAgentProps> = ({ onClose, onExecuteAction }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const paletteRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        inputRef.current?.focus();
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleSend = async (promptText = input) => {
        if (!promptText.trim() || isLoading) return;

        setInput('');
        setIsLoading(true);

        try {
            const result = await getSystemAction(promptText);
            const newHistoryItem: HistoryItem = {
                id: Date.now(),
                prompt: promptText,
                response: "Thinking...",
            };

            if (result.action) {
                onExecuteAction(result.action.action, result.action.payload);
                newHistoryItem.response = result.text || `Action: ${result.action.action} executed.`;
            } else if (result.text) {
                newHistoryItem.response = result.text;
            } else {
                newHistoryItem.response = "Sorry, I couldn't process that. Please try again.";
            }
            setHistory(prev => [newHistoryItem, ...prev]);

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            const errorHistoryItem: HistoryItem = {
                id: Date.now(),
                prompt: promptText,
                response: `An error occurred: ${errorMessage}`,
            };
            setHistory(prev => [errorHistoryItem, ...prev]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-24 animate-fade-in" onClick={onClose}>
            <div 
                ref={paletteRef}
                className="w-full max-w-2xl bg-dock-bg backdrop-blur-xl rounded-2xl shadow-lg border border-border-color flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 p-2 border-b border-border-color focus-within:ring-2 focus-within:ring-brand-blue rounded-t-2xl">
                    <i className="fi fi-rr-sparkles text-brand-blue text-xl px-2"></i>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Ask me to do something... (e.g., open file explorer)"
                        className="w-full bg-transparent py-1 focus:outline-none text-lg"
                        disabled={isLoading}
                    />
                    {isLoading && <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin mr-2"></div>}
                </div>
                
                <div className="max-h-[60vh] overflow-y-auto">
                    {history.length > 0 ? (
                        <div className="p-4 space-y-4">
                            {history.map(item => (
                                <div key={item.id} className="text-sm">
                                    <p className="text-white/80 font-medium pb-1 pl-2 border-l-2 border-white/20">{item.prompt}</p>
                                    <p className="text-white/60 pl-4">{item.response}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="p-4">
                             <h4 className="text-sm font-semibold text-white/70 mb-2">Suggestions</h4>
                             <div className="space-y-2">
                                {suggestions.map(s => (
                                    <button 
                                        key={s}
                                        onClick={() => handleSend(s)}
                                        className="w-full text-left p-2 rounded-md hover:bg-white/10 text-sm text-white/80"
                                    >
                                        {s}
                                    </button>
                                ))}
                             </div>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};