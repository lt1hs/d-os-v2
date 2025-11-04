import React, { useEffect, useRef, useState } from 'react';
import { AppDefinition } from '../types';
import { LockIcon, AIStudioLogo } from '../constants';

interface StartMenuProps {
    apps: AppDefinition[];
    onAppClick: (id: string) => void;
    onClose: () => void;
    onLock: () => void;
    dockHeight: number;
}

const AppButton: React.FC<{ app: AppDefinition; onClick: () => void; }> = ({ app, onClick }) => (
    <button
        onClick={onClick}
        className="w-full flex flex-col items-center justify-center p-2 rounded-lg transition-colors hover:bg-white/10"
    >
        <div className="w-10 h-10 flex items-center justify-center text-3xl text-white/90 mb-1">{app.icon}</div>
        <span className="text-xs font-medium text-white/90 text-center w-full truncate">{app.name}</span>
    </button>
);

export const StartMenu: React.FC<StartMenuProps> = ({ apps, onAppClick, onClose, onLock, dockHeight }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                const dock = document.querySelector('footer');
                if (dock && dock.contains(event.target as Node)) return;
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const filteredApps = apps.filter(app => app.name.toLowerCase().includes(search.toLowerCase()));
    
    const bottomPosition = dockHeight + 16;

    return (
        <div
            ref={menuRef}
            className="absolute z-40 w-full max-w-lg bg-dock-bg backdrop-blur-xl rounded-2xl shadow-lg border border-border-color p-4 flex flex-col animate-menu-pop-up"
            style={{
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: `${bottomPosition}px`,
                maxHeight: 'calc(100vh - 120px)'
            }}
        >
            <div className="relative mb-4 flex-shrink-0">
                <i className="fi fi-rr-search absolute left-4 top-1/2 -translate-y-1/2 text-white/50"></i>
                <input
                    type="search"
                    placeholder="Search for apps..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-border-color rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2">
                <h3 className="px-1 py-2 text-sm font-semibold text-white/60">Applications</h3>
                <div className="grid grid-cols-5 gap-2">
                    {filteredApps.map(app => (
                        <AppButton key={app.id} app={app} onClick={() => onAppClick(app.id)} />
                    ))}
                </div>
            </div>

            <div className="border-t border-border-color mt-4 pt-4 flex-shrink-0 flex items-center justify-between">
                <button onClick={() => onAppClick('user-profile')} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xl"><i className="fi fi-rr-user" /></div>
                    <span className="text-sm font-medium">User Profile</span>
                </button>
                <button onClick={onLock} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 text-xl"><LockIcon /></button>
            </div>
        </div>
    );
};