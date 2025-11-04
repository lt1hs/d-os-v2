
import React from 'react';
import { AppDefinition } from '../types';

interface DockIconProps {
    app: AppDefinition & { isFolder?: boolean };
    onClick: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    isOpen?: boolean;
    isActive?: boolean;
    isMinimized?: boolean;
    isAnimating: boolean;
    scale: number;
}

export const DockIcon: React.FC<DockIconProps> = ({ app, onClick, onContextMenu, isOpen, isActive, isMinimized, isAnimating, scale }) => {
    const iconSize = 40;
    const yOffset = (1 - scale) * (iconSize / 1.5);

    return (
        <div 
            className="relative flex flex-col items-center justify-end cursor-pointer group w-12 h-12"
            onClick={onClick}
            onContextMenu={onContextMenu}
            aria-label={`Open ${app.name}`}
        >
            {/* Tooltip */}
            <span className="absolute bottom-full mb-3 px-3 py-1.5 bg-gray-900/80 text-white/90 text-sm rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-lg backdrop-blur-sm z-50">
                {app.name}
            </span>

            {/* Icon Container */}
            <div
                className={`flex items-center justify-center text-white/80 rounded-lg transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] ${isAnimating ? 'animate-dock-bounce' : ''}`}
                style={{
                    width: iconSize * scale,
                    height: iconSize * scale,
                    transform: `translateY(${yOffset}px)`,
                }}
            >
                <div className="w-full h-full transform transition-transform duration-200 text-2xl flex items-center justify-center">
                    {app.icon}
                </div>
            </div>
            
            {/* Indicators */}
            <div 
                className={`absolute -bottom-1 h-1 w-full flex justify-center items-center transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
            >
                {isActive ? (
                    <div 
                        className="h-full bg-white rounded-full shadow-[0_0_8px_white] transition-all duration-200 ease-out"
                        style={{ width: `${5 + (scale - 1) * 10}px` }}
                    />
                ) : isMinimized ? (
                    <div className="w-2 h-1 bg-amber-400 rounded-full" />
                ) : isOpen ? (
                    <div className="w-1.5 h-1.5 bg-white/50 rounded-full" />
                ) : null}
            </div>
        </div>
    );
};
