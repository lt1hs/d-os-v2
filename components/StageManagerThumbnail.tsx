import React from 'react';
import { AppDefinition } from '../types';

interface StageManagerThumbnailProps {
    app: AppDefinition;
    onClick: () => void;
}

export const StageManagerThumbnail: React.FC<StageManagerThumbnailProps> = ({ app, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="w-28 h-20 bg-black/20 rounded-lg shadow-lg flex flex-col items-center justify-center p-2 gap-2 text-white/80 hover:bg-white/10 transition-all duration-200 ease-out transform hover:scale-105 border border-border-color"
            aria-label={`Switch to ${app.name}`}
        >
            <div className="w-8 h-8 flex-shrink-0">{app.icon}</div>
            <p className="text-xs font-medium truncate w-full text-center">{app.name}</p>
        </button>
    );
};