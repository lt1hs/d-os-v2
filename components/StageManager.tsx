import React from 'react';
import { AppDefinition } from '../types';
import { StageManagerThumbnail } from './StageManagerThumbnail';

interface StageManagerProps {
    apps: AppDefinition[];
    stageManagerApps: string[];
    onAppSelect: (id: string) => void;
}

export const StageManager: React.FC<StageManagerProps> = ({ apps, stageManagerApps, onAppSelect }) => {
    if (stageManagerApps.length === 0) {
        return null;
    }

    const appsToShow = apps.filter(app => stageManagerApps.includes(app.id));

    return (
        <div 
            className="fixed top-0 right-0 w-36 h-full z-40 flex items-center justify-center animate-fade-in"
            onContextMenu={(e) => e.stopPropagation()}
        >
            <div className="flex flex-col gap-4">
                {appsToShow.map(app => (
                    <StageManagerThumbnail 
                        key={app.id} 
                        app={app} 
                        onClick={() => onAppSelect(app.id)} 
                    />
                ))}
            </div>
        </div>
    );
};