import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'https://esm.sh/react-markdown@9';
import { WindowState, CloudFile, CloudFolder } from '../../types';

interface FileViewerProps {
    initialState?: WindowState;
    files: CloudFile[];
    folders: CloudFolder[];
}

export const FileViewer: React.FC<FileViewerProps> = ({ initialState, files }) => {
    const [currentFile, setCurrentFile] = useState<CloudFile | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialState?.fileId) {
            const file = files.find(f => f.id === initialState.fileId);
            if (file) {
                setCurrentFile(file);
                setError(null);
            } else {
                setError(`File with ID "${initialState.fileId}" not found.`);
                setCurrentFile(null);
            }
        } else {
            setCurrentFile(null);
            setError(null);
        }
    }, [initialState?.fileId, files]);

    const renderContent = () => {
        if (error) {
            return <div className="text-center text-red-400 p-4">{error}</div>;
        }

        if (!currentFile) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-white/50">
                    <i className="fi fi-rr-file text-6xl mb-4"></i>
                    <p>No file selected.</p>
                    <p className="text-sm">Open a file from the File Explorer.</p>
                </div>
            );
        }

        switch (currentFile.type) {
            case 'image':
                return <img src={currentFile.url} alt={currentFile.name} className="max-w-full max-h-full object-contain mx-auto" />;
            case 'video':
                return <video src={currentFile.url} controls autoPlay className="max-w-full max-h-full mx-auto" />;
            case 'audio':
                return (
                    <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
                        <i className="fi fi-rr-music-alt text-8xl text-cyan-400"></i>
                        <p className="font-semibold text-center">{currentFile.name}</p>
                        <audio src={currentFile.url} controls autoPlay />
                    </div>
                );
            case 'document':
                 if (currentFile.content) {
                    if (currentFile.name.endsWith('.md')) {
                        return <ReactMarkdown className="prose prose-invert max-w-none p-6">{currentFile.content}</ReactMarkdown>;
                    }
                    return <pre className="whitespace-pre-wrap p-6 font-mono text-sm">{currentFile.content}</pre>;
                }
                return <p className="p-6 text-white/70">This document has no readable content.</p>;

            default:
                return <p className="p-6 text-white/70">Unsupported file type: {currentFile.type}</p>;
        }
    };

    return (
        <div className="h-full w-full bg-black/20 flex flex-col text-white/90">
            <header className="flex-shrink-0 h-10 bg-black/30 border-b border-border-color flex items-center px-4">
                <p className="font-semibold text-sm truncate">{currentFile ? currentFile.name : 'File Viewer'}</p>
            </header>
            <main className="flex-grow overflow-auto">
                {renderContent()}
            </main>
        </div>
    );
};
