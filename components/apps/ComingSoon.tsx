import React from 'react';
import { AppDefinition } from '../../types';

interface ComingSoonProps {
    app: AppDefinition;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ app }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center text-white/80">
            <div className="w-16 h-16 mb-4 opacity-50">{app.icon}</div>
            <h2 className="text-2xl font-bold mb-2">{app.name}</h2>
            <p className="text-lg">Coming Soon!</p>
            <p className="mt-4 text-sm text-white/60">This feature is under development. Stay tuned for updates!</p>
        </div>
    );
};