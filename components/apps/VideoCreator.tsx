import React, { useState, useCallback, useEffect } from 'react';
import { generateVideo } from '../../services/geminiService';
import { CreationPanel } from '../CreationPanel';

export const VideoCreator: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('A neon hologram of a cat driving a futuristic car at top speed through a cyberpunk city.');
    const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">('16:9');
    const [resolution, setResolution] = useState<"720p" | "1080p">('720p');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [progressMessage, setProgressMessage] = useState<string>('');
    const [isKeyRequired, setIsKeyRequired] = useState<boolean>(false);

    useEffect(() => {
        const checkApiKey = async () => {
            if (window.aistudio && await !window.aistudio.hasSelectedApiKey()) {
                setIsKeyRequired(true);
            }
        };
        checkApiKey();
    }, []);

    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            // Assume key selection is successful and let the API call verify it.
            setIsKeyRequired(false);
            setError(null);
        }
    };
    
    const handleGenerate = useCallback(async () => {
        if (!prompt) {
            setError('Please enter a prompt.');
            return;
        }

        if (window.aistudio && await !window.aistudio.hasSelectedApiKey()) {
            setError('An API key is required for video generation. Please select a key.');
            setIsKeyRequired(true);
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedVideoUrl(null);

        try {
            const downloadLink = await generateVideo(prompt, aspectRatio, resolution, setProgressMessage);
            const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            if (!response.ok) {
                throw new Error(`Failed to download video: ${response.statusText}`);
            }
            const videoBlob = await response.blob();
            const videoUrl = URL.createObjectURL(videoBlob);
            setGeneratedVideoUrl(videoUrl);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
                if (err.message.includes('API key not valid') || err.message.includes('entity was not found')) {
                    setIsKeyRequired(true);
                }
            } else {
                setError('An unknown error occurred.');
            }
        } finally {
            setIsLoading(false);
            setProgressMessage('');
        }
    }, [prompt, aspectRatio, resolution]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center p-4 bg-window-bg/80 rounded-lg backdrop-blur-sm">
                    <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white font-medium">{progressMessage}</p>
                </div>
            );
        }
        if (error) {
             return (
                <div className="text-center text-red-400 p-4 max-w-sm bg-red-900/40 rounded-lg border border-red-500/50">
                    <p className="font-bold text-lg">Generation Failed</p>
                    <p className="text-sm mt-1">{error}</p>
                    {isKeyRequired && (
                        <button
                            onClick={handleSelectKey}
                            className="mt-4 px-4 py-2 bg-yellow-500 text-black font-semibold rounded-md hover:bg-yellow-600 transition-colors"
                        >
                            Select API Key
                        </button>
                    )}
                    {error.includes("billing") && <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" style={{color: 'var(--accent-color)'}} className="hover:underline mt-2 inline-block">Billing Information</a>}
                </div>
            );
        }
        if (generatedVideoUrl) {
            return <video src={generatedVideoUrl} controls autoPlay loop className="max-w-full max-h-full object-contain" />;
        }
        return (
            <div className="text-center text-white/50 p-4">
                <p>Your generated video will appear here.</p>
            </div>
        );
    };

    return (
        <div className="h-full w-full flex flex-col justify-end text-white/90 bg-black/20">
            <div className="flex-grow flex items-center justify-center p-4 relative bg-black">
                {renderContent()}
            </div>
            {generatedVideoUrl && (
                <div className="absolute top-2 right-2 z-10">
                    <a
                        href={generatedVideoUrl}
                        download={`ai-studio-video-${Date.now()}.mp4`}
                        className="px-3 py-1.5 bg-black/50 text-white/80 text-sm font-medium rounded-md hover:bg-black/70 transition-colors backdrop-blur-sm"
                    >
                        Download
                    </a>
                </div>
            )}
            <CreationPanel
                prompt={prompt}
                setPrompt={setPrompt}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                resolution={resolution}
                setResolution={setResolution}
                onGenerate={handleGenerate}
                isLoading={isLoading}
            />
        </div>
    );
};