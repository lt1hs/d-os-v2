import React, { useState, useEffect, useRef } from 'react';
import { Workspace, AppDefinition, Notification, UserProfileState, MediaState } from '../types';

interface TopBarProps {
    workspaces: Workspace[];
    setWorkspaces: React.Dispatch<React.SetStateAction<Workspace[]>>;
    activeWorkspaceId: string;
    setActiveWorkspaceId: React.Dispatch<React.SetStateAction<string>>;
    activeAppId: string;
    allApps: AppDefinition[];
    onToggleAgent: () => void;
    notifications: Notification[];
    onToggleNotifications: () => void;
    userProfile: UserProfileState;
    onOpenApp: (id: string) => void;
    mediaState: MediaState;
    onTogglePlay: () => void;
    onPlayNext: () => void;
    onPlayPrev: () => void;
}

const createDefaultWorkspaceState = () => ({
    openApps: [],
    minimizedApps: new Set<string>(),
    maximizedApps: new Set<string>(),
    activeApp: '',
    windowStates: {},
});

const MediaControls: React.FC<Pick<TopBarProps, 'mediaState' | 'onTogglePlay' | 'onPlayNext' | 'onPlayPrev'>> = ({ mediaState, onTogglePlay, onPlayNext, onPlayPrev }) => {
    if (!mediaState.currentTrack) return null;

    return (
        <div className="flex items-center gap-2 h-10 px-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full shadow-lg animate-fade-in">
            <div className="text-xl">
                {mediaState.currentTrack.type === 'audio' ? <i className="fi fi-rr-music-alt" /> : <i className="fi fi-rr-film" />}
            </div>
            <span className="text-xs truncate max-w-[120px]">{mediaState.currentTrack.name}</span>
            <div className="w-px h-5 bg-white/20 mx-1" />
            <button onClick={onPlayPrev} className="p-1 rounded-full hover:bg-white/10"><i className="fi fi-rr-backward"/></button>
            <button onClick={onTogglePlay} className="p-1 rounded-full hover:bg-white/10 text-lg">{mediaState.isPlaying ? <i className="fi fi-rr-pause"/> : <i className="fi fi-rr-play"/>}</button>
            <button onClick={onPlayNext} className="p-1 rounded-full hover:bg-white/10"><i className="fi fi-rr-forward"/></button>
        </div>
    );
};


export const TopBar: React.FC<TopBarProps> = (props) => {
    const { workspaces, setWorkspaces, activeWorkspaceId, setActiveWorkspaceId, activeAppId, allApps, onToggleAgent, notifications, onToggleNotifications, userProfile, onOpenApp, mediaState } = props;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [time, setTime] = useState(new Date());
    const menuRef = useRef<HTMLDivElement>(null);

    const activeApp = allApps.find(app => app.id === activeAppId);
    const activeWorkspace = workspaces.find(ws => ws.id === activeWorkspaceId);
    const hasUnread = notifications.some(n => !n.read);

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addWorkspace = () => {
        const newWorkspace: Workspace = {
            id: `ws-${Date.now()}`,
            name: `Workspace ${workspaces.length + 1}`,
            state: createDefaultWorkspaceState(),
        };
        setWorkspaces(prev => [...prev, newWorkspace]);
        setActiveWorkspaceId(newWorkspace.id);
        setIsMenuOpen(false);
    };
    
    const handleRename = (workspace: Workspace) => {
        setRenamingId(workspace.id);
        setNewName(workspace.name);
        setIsMenuOpen(false);
    };

    const submitRename = (id: string) => {
        if (newName.trim()) {
            setWorkspaces(prev => prev.map(ws => ws.id === id ? { ...ws, name: newName.trim() } : ws));
        }
        setRenamingId(null);
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between px-3 text-sm text-white/90">
            {/* Left Pill */}
            <div className="flex items-center gap-2 h-10 px-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full shadow-lg">
                <button onClick={() => onOpenApp('user-profile')} className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-blue">
                    <img src={userProfile.avatar} alt={userProfile.name} className="w-full h-full object-cover" />
                </button>
                <div className="flex items-center gap-2 pr-2">
                    <div className="w-5 h-5 text-lg flex items-center justify-center">
                        {activeApp && activeApp.icon}
                    </div>
                    <span className="font-bold">{activeApp ? activeApp.name : "Desktop"}</span>
                </div>
                <div className="w-px h-5 bg-white/20" />
                <div className="flex items-center gap-1 text-white/70 pl-1">
                    <button className="px-2 py-1 rounded hover:bg-white/10 hover:text-white transition-colors">File</button>
                    <button className="px-2 py-1 rounded hover:bg-white/10 hover:text-white transition-colors">Edit</button>
                </div>
            </div>

            {/* Center Pills */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                 <MediaControls {...props} />
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(p => !p)} className="flex items-center gap-2 h-10 px-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/20 transition-colors shadow-lg">
                        <span>{activeWorkspace?.name || 'Workspaces'}</span>
                        <i className="fi fi-rr-angle-small-down pt-1"></i>
                    </button>
                    {isMenuOpen && (
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg border border-white/10 py-1 animate-fade-in">
                            {workspaces.map(ws => (
                                <div key={ws.id} className="px-3 py-1.5 flex items-center justify-between group">
                                    {renamingId === ws.id ? (
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={e => setNewName(e.target.value)}
                                            onBlur={() => submitRename(ws.id)}
                                            onKeyDown={e => e.key === 'Enter' && submitRename(ws.id)}
                                            autoFocus
                                            className="w-full bg-gray-900 border border-brand-blue rounded text-sm px-1 focus:outline-none"
                                        />
                                    ) : (
                                        <button onClick={() => { setActiveWorkspaceId(ws.id); setIsMenuOpen(false); }} className="flex-grow text-left text-sm hover:text-brand-blue">{ws.name}</button>
                                    )}
                                    <button onClick={() => handleRename(ws)} className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-white"><i className="fi fi-rr-pencil"></i></button>
                                </div>
                            ))}
                            <div className="border-t border-white/10 my-1"></div>
                            <button onClick={addWorkspace} className="w-full text-left px-3 py-1.5 text-sm hover:bg-brand-blue flex items-center gap-2 rounded-b-md">
                                <i className="fi fi-rr-add"></i> New Workspace
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Right Pill */}
            <div className="flex items-center gap-3 h-10 px-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full shadow-lg">
                <div className="flex items-center gap-3 text-lg text-white/80">
                    <button className="p-1 rounded-full hover:bg-white/10 hover:text-white transition-colors"><i className="fi fi-rr-search"></i></button>
                    <button className="p-1 rounded-full hover:bg-white/10 hover:text-white transition-colors"><i className="fi fi-rr-wifi-alt"></i></button>
                    <button onClick={onToggleAgent} className="p-1 rounded-full hover:bg-white/10 hover:text-white transition-colors" aria-label="Open AI Agent">
                        <i className="fi fi-rr-sparkles"></i>
                    </button>
                    <button onClick={onToggleNotifications} className="p-1 rounded-full hover:bg-white/10 hover:text-white transition-colors relative" aria-label="Open Notifications">
                        <i className="fi fi-rr-bell"></i>
                        {hasUnread && <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-black/50 animate-pulse-dot"></div>}
                    </button>
                </div>
                <div className="w-px h-5 bg-white/20" />
                <span className="font-mono text-xs">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </header>
    );
};