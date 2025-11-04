import React, { useState, useRef, KeyboardEvent } from 'react';

export const Browser: React.FC = () => {
    const [history, setHistory] = useState<string[]>(['https://www.google.com/webhp?igu=1']);
    const [historyIndex, setHistoryIndex] = useState<number>(0);
    const [inputValue, setInputValue] = useState<string>(history[0]);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const currentUrl = history[historyIndex];

    const navigate = (url: string, addToHistory: boolean = true) => {
        let finalUrl = url;
        if (!/^https?:\/\//i.test(url)) {
            finalUrl = `https://${url}`;
        }
        
        setInputValue(finalUrl);

        if (addToHistory) {
            const newHistory = history.slice(0, historyIndex + 1);
            // Avoid adding duplicate entries if user re-submits same URL
            if (newHistory[newHistory.length - 1] !== finalUrl) {
                newHistory.push(finalUrl);
                setHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);
            } else {
                // If it is the same URL, just refresh
                refresh();
            }
        }
    };

    const handleAddressBarSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        navigate(inputValue);
    };
    
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        navigate(inputValue);
      }
    };

    const goBack = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setInputValue(history[newIndex]);
        }
    };

    const goForward = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setInputValue(history[newIndex]);
        }
    };

    const refresh = () => {
        if (iframeRef.current) {
            // A common trick to force iframe reload
            iframeRef.current.src = iframeRef.current.src;
        }
    };

    return (
        <div className="flex flex-col h-full bg-white text-black rounded-b-lg">
            <div className="flex items-center p-2 bg-gray-200 border-b border-gray-300 gap-2 flex-shrink-0">
                <button onClick={goBack} disabled={historyIndex === 0} className="p-1 rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700">
                    <i className="fi fi-rr-arrow-left"></i>
                </button>
                <button onClick={goForward} disabled={historyIndex === history.length - 1} className="p-1 rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700">
                    <i className="fi fi-rr-arrow-right"></i>
                </button>
                <button onClick={refresh} className="p-1 rounded-full hover:bg-gray-300 text-gray-700">
                    <i className="fi fi-rr-refresh"></i>
                </button>
                <form onSubmit={handleAddressBarSubmit} className="flex-grow">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                        placeholder="Search or enter address"
                    />
                </form>
            </div>
            <iframe
                ref={iframeRef}
                src={currentUrl}
                title="Browser"
                className="flex-grow border-0"
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-presentation"
            />
        </div>
    );
};
