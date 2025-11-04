import React, { useState } from 'react';
import { WEB_APPS } from '../../constants';

interface WebAppsProps {
    connectedApps: Set<string>;
    setConnectedApps: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const allCategories = ['All', ...Array.from(new Set(WEB_APPS.map(app => app.category)))];

export const WebApps: React.FC<WebAppsProps> = ({ connectedApps, setConnectedApps }) => {
    const [selectedCategory, setSelectedCategory] = useState('All');

    const handleToggleConnect = (appId: string) => {
        setConnectedApps(prev => {
            const newSet = new Set(prev);
            if (newSet.has(appId)) {
                newSet.delete(appId);
            } else {
                newSet.add(appId);
            }
            return newSet;
        });
    };

    const filteredApps = selectedCategory === 'All'
        ? WEB_APPS
        : WEB_APPS.filter(app => app.category === selectedCategory);

    const NavButton: React.FC<{ category: string }> = ({ category }) => (
        <button
            onClick={() => setSelectedCategory(category)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === category ? 'bg-brand-blue text-white' : 'hover:bg-white/10 text-white/80'}`}
        >
            {category}
        </button>
    );

    return (
        <div className="flex h-full bg-black/10 text-white/90">
            <nav className="w-1/5 min-w-[180px] bg-black/20 p-2 border-r border-border-color flex-shrink-0">
                <h3 className="font-semibold px-3 py-2 mb-2">Categories</h3>
                <div className="flex flex-col gap-1">
                    {allCategories.map(category => <NavButton key={category} category={category} />)}
                </div>
            </nav>
            <main className="flex-grow p-6 overflow-y-auto">
                <h2 className="text-3xl font-bold mb-6">WebApps Store</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredApps.map(app => {
                        const isConnected = connectedApps.has(app.id);
                        return (
                            <div key={app.id} className="bg-white/5 p-4 rounded-lg border border-border-color flex flex-col transition-all hover:bg-white/10 hover:border-[var(--accent-color)]">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-12 h-12 bg-brand-blue/20 rounded-lg flex items-center justify-center text-brand-blue text-3xl">
                                        {app.icon}
                                    </div>
                                    <span className="text-xs font-medium bg-white/10 px-2 py-1 rounded-full">{app.category}</span>
                                </div>
                                <div className="flex-grow">
                                    <h4 className="font-semibold text-lg mb-1">{app.name}</h4>
                                    <p className="text-sm text-white/60">{app.description}</p>
                                </div>
                                <button
                                    onClick={() => handleToggleConnect(app.id)}
                                    className={`w-full mt-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                                        isConnected
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30'
                                            : 'bg-brand-blue text-white hover:bg-brand-blue-hover'
                                    }`}
                                >
                                    {isConnected ? 'Connected' : 'Connect'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};