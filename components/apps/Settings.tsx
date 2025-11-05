


import React, { useState, useRef, useEffect, useMemo } from 'react';
import { THEME_SETTINGS, Theme } from '../../constants/theme';
import { APPS, SYSTEM_TOOLS } from '../../constants';
// FIX: Import `AppDefinition` type to resolve the type error.
import { ShortcutMap, ShortcutAction, AppDefinition } from '../../types';
import { SHORTCUT_ACTIONS, DEFAULT_SHORTCUTS } from '../../constants/shortcuts';


interface DockSettingsState {
    visibleApps: Record<string, boolean>;
    showSystemTools: boolean;
}

interface CollaborationSettingsState {
    realtimeCoEditing: boolean;
    workspaces: { id: string; name: string; members: string[] }[];
    teamMembers: { id: string; name: string; role: string; avatar: string }[];
}

interface FileSyncSettingsState {
    isSyncEnabled: boolean;
    syncedFolders: string[];
}

interface SettingsProps {
    theme: Theme;
    setTheme: React.Dispatch<React.SetStateAction<Theme>>;
    dockSettings: DockSettingsState;
    setDockSettings: React.Dispatch<React.SetStateAction<DockSettingsState>>;
    collaborationSettings: CollaborationSettingsState;
    setCollaborationSettings: React.Dispatch<React.SetStateAction<CollaborationSettingsState>>;
    fileSyncSettings: FileSyncSettingsState;
    setFileSyncSettings: React.Dispatch<React.SetStateAction<FileSyncSettingsState>>;
    shortcutMap: ShortcutMap;
    setShortcutMap: React.Dispatch<React.SetStateAction<ShortcutMap>>;
    dockOrder: string[];
    setDockOrder: React.Dispatch<React.SetStateAction<string[]>>;
}

type Category = 'appearance' | 'background' | 'dock' | 'collaboration' | 'file-sync' | 'shortcuts' | 'about';

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; }> = ({ checked, onChange }) => (
    <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${checked ? 'bg-[var(--accent-color)]' : 'bg-gray-600'}`}
    >
        <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
    </button>
);

const NavButton: React.FC<{
    category: Category;
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: (category: Category) => void;
}> = ({ category, icon, label, isActive, onClick }) => (
    <button
        onClick={() => onClick(category)}
        className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors text-sm font-medium ${
            isActive
            ? 'bg-[var(--accent-color)] text-white'
            : 'text-slate-300 hover:bg-white/10'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

export const Settings: React.FC<SettingsProps> = ({ theme, setTheme, dockSettings, setDockSettings, collaborationSettings, setCollaborationSettings, fileSyncSettings, setFileSyncSettings, shortcutMap, setShortcutMap, dockOrder, setDockOrder }) => {
    const [activeCategory, setActiveCategory] = useState<Category>('appearance');

    return (
        <div className="h-full w-full flex bg-black/20 backdrop-blur-xl rounded-b-lg text-white/90">
            <nav className="w-56 flex-shrink-0 bg-black/20 p-4 border-r border-white/10 overflow-y-auto">
                <div className="flex flex-col gap-1">
                    <NavButton category="appearance" icon={<i className="fi fi-rr-swatchbook w-5 h-5" />} label="Appearance" isActive={activeCategory === 'appearance'} onClick={setActiveCategory} />
                    <NavButton category="background" icon={<i className="fi fi-rr-picture w-5 h-5" />} label="Background" isActive={activeCategory === 'background'} onClick={setActiveCategory} />
                    <NavButton category="dock" icon={<i className="fi fi-rr-layout-fluid w-5 h-5" />} label="Dock" isActive={activeCategory === 'dock'} onClick={setActiveCategory} />
                    <NavButton category="collaboration" icon={<i className="fi fi-rr-users-alt w-5 h-5" />} label="Collaboration" isActive={activeCategory === 'collaboration'} onClick={setActiveCategory} />
                    <NavButton category="file-sync" icon={<i className="fi fi-rr-cloud-sync w-5 h-5" />} label="File Sync" isActive={activeCategory === 'file-sync'} onClick={setActiveCategory} />
                    <NavButton category="shortcuts" icon={<i className="fi fi-rr-keyboard w-5 h-5" />} label="Shortcuts" isActive={activeCategory === 'shortcuts'} onClick={setActiveCategory} />
                    <NavButton category="about" icon={<i className="fi fi-rr-info w-5 h-5" />} label="About" isActive={activeCategory === 'about'} onClick={setActiveCategory} />
                </div>
            </nav>
            <main className="flex-1 p-8 overflow-y-auto min-w-0">
                {activeCategory === 'appearance' && <AppearanceSettings theme={theme} setTheme={setTheme} />}
                {activeCategory === 'background' && <BackgroundSettings theme={theme} setTheme={setTheme} />}
                {activeCategory === 'dock' && <DockSettings dockSettings={dockSettings} setDockSettings={setDockSettings} dockOrder={dockOrder} setDockOrder={setDockOrder} />}
                {activeCategory === 'collaboration' && <CollaborationSettings settings={collaborationSettings} setSettings={setCollaborationSettings} />}
                {activeCategory === 'file-sync' && <FileSyncSettings settings={fileSyncSettings} setSettings={setFileSyncSettings} />}
                {activeCategory === 'shortcuts' && <ShortcutsSettings shortcutMap={shortcutMap} setShortcutMap={setShortcutMap} />}
                {activeCategory === 'about' && <AboutSettings />}
            </main>
        </div>
    );
};

const AppearanceSettings: React.FC<Pick<SettingsProps, 'theme' | 'setTheme'>> = ({ theme, setTheme }) => {
    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-1">Appearance</h2>
            <p className="text-sm text-slate-400 mb-8">Customize the look and feel of your workspace.</p>
            
            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-2">Accent Color</h3>
                <p className="text-sm text-slate-400 mb-4">Choose a color for highlights, selections, and buttons.</p>
                <div className="flex flex-wrap gap-4">
                    {THEME_SETTINGS.accentColors.map(color => (
                        <button
                            key={color.name}
                            onClick={() => setTheme(t => ({ ...t, accentColor: color.name }))}
                            className="w-10 h-10 rounded-full transition-transform duration-150 hover:scale-110 relative ring-2 ring-transparent focus:outline-none focus:ring-offset-2 focus:ring-offset-[#1e2738] focus:ring-white"
                            style={{ backgroundColor: color.hex }}
                            aria-label={`Select ${color.name} accent color`}
                        >
                            {theme.accentColor === color.name && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full text-white text-xl">
                                    <i className="fi fi-rr-check" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-2">System Tint</h3>
                <p className="text-sm text-slate-400 mb-4">Select the base color for windows, docks, and other UI elements.</p>
                <div className="flex flex-wrap gap-4">
                    {THEME_SETTINGS.tintColors.map(color => (
                        <button
                            key={color.name}
                            onClick={() => setTheme(t => ({ ...t, tintColor: color.name }))}
                            className="w-10 h-10 rounded-full transition-transform duration-150 hover:scale-110 relative ring-2 ring-transparent focus:outline-none focus:ring-offset-2 focus:ring-offset-[#1e2738] focus:ring-white"
                            style={{ backgroundColor: `rgb(${color.rgb})` }}
                            aria-label={`Select ${color.name} system tint`}
                        >
                            {theme.tintColor === color.name && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full text-white text-xl">
                                    <i className="fi fi-rr-check" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

        </div>
    );
};

const BackgroundSettings: React.FC<Pick<SettingsProps, 'theme' | 'setTheme'>> = ({ theme, setTheme }) => {
    const handleSetWallpaper = (name: string) => {
        setTheme(t => ({ ...t, background: name, customBackgroundUrl: null }));
    };

    const handleCustomWallpaper = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTheme(t => ({ ...t, background: 'Custom', customBackgroundUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-1">Background</h2>
            <p className="text-sm text-slate-400 mb-8">Choose a wallpaper or upload your own.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {THEME_SETTINGS.wallpapers.map(wallpaper => (
                    <button
                        key={wallpaper.name}
                        onClick={() => handleSetWallpaper(wallpaper.name)}
                        className="aspect-video rounded-lg overflow-hidden relative group ring-2 ring-transparent focus:outline-none focus:ring-offset-2 focus:ring-offset-[#1e2738] focus:ring-white"
                    >
                        {wallpaper.url === 'dynamic-ascii' ? (
                            <div className="w-full h-full bg-black flex items-center justify-center text-green-400 font-mono text-xs">[ ASCII Matrix ]</div>
                        ) : (
                            <img src={wallpaper.url} alt={wallpaper.name} className="w-full h-full object-cover" />
                        )}
                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${theme.background === wallpaper.name && theme.customBackgroundUrl === null ? 'bg-black/50' : 'bg-black/70 opacity-0 group-hover:opacity-100'}`}>
                            <p className="font-semibold">{wallpaper.name}</p>
                        </div>
                    </button>
                ))}
                
                <label className="aspect-video rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:border-brand-blue hover:text-brand-blue text-slate-400 transition-colors">
                    <i className="fi fi-rr-upload text-3xl"></i>
                    <span className="text-sm font-semibold mt-1">Upload Image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleCustomWallpaper} />
                </label>
            </div>
            {theme.background === 'Custom' && theme.customBackgroundUrl && (
                 <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Current Custom Background</h3>
                    <div className="max-w-xs rounded-lg overflow-hidden">
                        <img src={theme.customBackgroundUrl} alt="Custom background" className="w-full h-auto" />
                    </div>
                </div>
            )}
        </div>
    );
};

const DockSettings: React.FC<Pick<SettingsProps, 'dockSettings' | 'setDockSettings' | 'dockOrder' | 'setDockOrder'>> = ({ dockSettings, setDockSettings, dockOrder, setDockOrder }) => {
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleAppToggle = (appId: string, isVisible: boolean) => {
        setDockSettings(prev => ({
            ...prev,
            visibleApps: { ...prev.visibleApps, [appId]: isVisible },
        }));
    };

    const handleSystemToolsToggle = (isVisible: boolean) => {
        setDockSettings(prev => ({ ...prev, showSystemTools: isVisible }));
    };

    const orderedMainApps = useMemo(() => {
        const mainAppIds = new Set(APPS.map(app => app.id));
        const filteredDockOrder = dockOrder.filter(id => mainAppIds.has(id));
        return filteredDockOrder.map(id => APPS.find(app => app.id === id)).filter(Boolean) as (AppDefinition[]);
    }, [dockOrder]);
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
        e.currentTarget.classList.add('opacity-50');
    };

    const handleDragEnter = (_e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragOverItem.current = position;
    };
    
    const handleDrop = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        
        const newOrderedIds = [...orderedMainApps.map(app => app.id)];
        const [draggedItem] = newOrderedIds.splice(dragItem.current, 1);
        newOrderedIds.splice(dragOverItem.current, 0, draggedItem);
        
        const systemToolIdsInOrder = SYSTEM_TOOLS.map(t => t.id).filter(id => dockOrder.includes(id));
        setDockOrder([...newOrderedIds, ...systemToolIdsInOrder]);

        dragItem.current = null;
        dragOverItem.current = null;
    };
    
    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('opacity-50');
        dragItem.current = null;
        dragOverItem.current = null;
    };

    const handleResetOrder = () => {
        setDockOrder(APPS.map(app => app.id));
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold mb-1">Dock Management</h2>
                    <p className="text-sm text-slate-400">Customize your dock's appearance and app order.</p>
                </div>
                 <button onClick={handleResetOrder} className="px-3 py-1.5 bg-white/10 text-white/80 text-xs font-semibold rounded-md hover:bg-white/20">Reset to Default</button>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-lg">
                <h3 className="text-md font-semibold mb-3">Application Order & Visibility</h3>
                <p className="text-sm text-slate-400 mb-4">Drag to reorder applications. Use the toggle to show or hide them.</p>
                <div className="space-y-2">
                    {orderedMainApps.map((app, index) => (
                        <div 
                            key={app.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-700/50 cursor-grab active:cursor-grabbing"
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                        >
                            <div className="flex items-center gap-3">
                                <i className="fi fi-rr-menu-dots-vertical text-slate-400"></i>
                                <div className="w-6 h-6 text-xl text-slate-300">{app.icon}</div>
                                <span className="font-medium text-sm">{app.name}</span>
                            </div>
                            <ToggleSwitch
                                checked={!!dockSettings.visibleApps[app.id]}
                                onChange={(isChecked) => handleAppToggle(app.id, isChecked)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg mt-6">
                <h3 className="text-md font-semibold mb-3">System Tools Visibility</h3>
                <div className="space-y-3">
                     <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-semibold">Show All System Tools in Dock</h4>
                            <p className="text-xs text-slate-400">Toggle File Explorer, Settings, and Trash.</p>
                        </div>
                        <ToggleSwitch checked={dockSettings.showSystemTools} onChange={handleSystemToolsToggle} />
                    </div>
                    {SYSTEM_TOOLS.map(app => (
                        <div key={app.id} className="flex items-center justify-between pl-4">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 text-xl text-slate-300">{app.icon}</div>
                                <span className="font-medium text-sm">{app.name}</span>
                            </div>
                            <ToggleSwitch
                                checked={!!dockSettings.visibleApps[app.id]}
                                onChange={(isChecked) => handleAppToggle(app.id, isChecked)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const CollaborationSettings: React.FC<{
    settings: CollaborationSettingsState;
    setSettings: React.Dispatch<React.SetStateAction<CollaborationSettingsState>>;
}> = ({ settings, setSettings }) => {
    
    const handleToggleCoEditing = (enabled: boolean) => {
        setSettings(prev => ({ ...prev, realtimeCoEditing: enabled }));
    };

    const handleCreateWorkspace = () => {
        const name = prompt("Enter new workspace name:");
        if (name) {
            const newWorkspace = { id: `ws-${Date.now()}`, name, members: ['a'] };
            setSettings(prev => ({ ...prev, workspaces: [...prev.workspaces, newWorkspace] }));
        }
    };
    
    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-1">Collaboration</h2>
            <p className="text-sm text-slate-400 mb-8">Manage your team and shared workspaces.</p>
            
            <div className="bg-slate-800/50 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-md font-semibold">Real-time Co-Editing</h3>
                        <p className="text-sm text-slate-400">Allow multiple users to edit projects simultaneously.</p>
                    </div>
                    <ToggleSwitch checked={settings.realtimeCoEditing} onChange={handleToggleCoEditing} />
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-md font-semibold">Shared Workspaces</h3>
                        <button onClick={handleCreateWorkspace} className="px-3 py-1 bg-[var(--accent-color)] text-white text-xs font-semibold rounded-md hover:bg-[var(--accent-color-hover)]">Create New</button>
                    </div>
                    <div className="space-y-2">
                        {settings.workspaces.map(ws => (
                            <div key={ws.id} className="p-2 bg-slate-700/50 rounded-md flex justify-between items-center">
                                <span className="text-sm font-medium">{ws.name}</span>
                                <div className="flex -space-x-2">
                                    {ws.members.slice(0, 3).map(memberId => {
                                        const member = settings.teamMembers.find(m => m.id === memberId);
                                        return member ? <img key={memberId} src={member.avatar} alt={member.name} className="w-6 h-6 rounded-full border-2 border-slate-800" /> : null;
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="bg-slate-800/50 p-4 rounded-lg">
                    <h3 className="text-md font-semibold mb-3">Team Management</h3>
                     <div className="flex gap-2 mb-4">
                        <input type="email" placeholder="invite.by@email.com" className="w-full p-2 bg-slate-700/50 border border-slate-600 rounded-md text-sm" />
                        <button className="px-3 bg-[var(--accent-color)] text-white font-semibold rounded-md hover:bg-[var(--accent-color-hover)] text-sm">Invite</button>
                    </div>
                    <div className="space-y-2">
                        {settings.teamMembers.map(member => (
                            <div key={member.id} className="flex items-center gap-3">
                                <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full" />
                                <div>
                                    <p className="text-sm font-semibold">{member.name}</p>
                                    <p className="text-xs text-slate-400">{member.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const FileSyncSettings: React.FC<{
    settings: FileSyncSettingsState;
    setSettings: React.Dispatch<React.SetStateAction<FileSyncSettingsState>>;
}> = ({ settings, setSettings }) => {
    const handleToggleSync = (enabled: boolean) => {
        setSettings(prev => ({ ...prev, isSyncEnabled: enabled }));
    };

    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-1">File Sync</h2>
            <p className="text-sm text-slate-400 mb-8">Manage your cloud-native file system.</p>
            
            <div className="bg-slate-800/50 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-md font-semibold">Enable Local Sync</h3>
                        <p className="text-sm text-slate-400">Keep a local copy of your cloud files for offline access.</p>
                    </div>
                    <ToggleSwitch checked={settings.isSyncEnabled} onChange={handleToggleSync} />
                </div>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-lg">
                <h3 className="text-md font-semibold mb-3">Sync Management</h3>
                <div className="mb-4">
                    <p className="text-sm font-medium">Local Storage Usage</p>
                    <div className="w-full bg-slate-700 rounded-full h-2.5 mt-1">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `25%` }}></div>
                    </div>
                    <p className="text-right text-xs mt-1 text-slate-400">1.2 GB of 5 GB used</p>
                </div>
                <div>
                     <p className="text-sm font-medium mb-2">Synced Folders</p>
                     <div className="space-y-2">
                        {settings.syncedFolders.map(folderId => (
                            <div key={folderId} className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-md">
                                <i className="fi fi-rr-folder text-amber-400"/>
                                <span className="text-sm">Generated Images</span>
                            </div>
                        )).slice(0,1)}
                         <div className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-md">
                            <i className="fi fi-rr-folder text-amber-400"/>
                            <span className="text-sm">Social Posts</span>
                        </div>
                     </div>
                     <button className="w-full text-center p-2 mt-3 bg-slate-700/50 text-xs rounded-md hover:bg-slate-700">Manage Synced Folders</button>
                </div>
            </div>
        </div>
    );
};

const ShortcutsSettings: React.FC<{
    shortcutMap: ShortcutMap;
    setShortcutMap: React.Dispatch<React.SetStateAction<ShortcutMap>>;
}> = ({ shortcutMap, setShortcutMap }) => {
    const [recordingAction, setRecordingAction] = useState<ShortcutAction | null>(null);

    const formatKey = (key: string) => {
        if (!key) return 'Not set';
        return key.replace('mod+', '⌘/Ctrl+').replace('shift+', 'Shift+').replace('alt+', 'Alt+').replace('space', 'Space').split('+').map(k => k.charAt(0).toUpperCase() + k.slice(1)).join('+');
    };

    useEffect(() => {
        if (!recordingAction) return;

        const handleRecord = (e: KeyboardEvent) => {
            e.preventDefault();
            const key = e.key.toLowerCase();
            if (['control', 'meta', 'shift', 'alt'].includes(key)) return;

            const combo = `${e.metaKey || e.ctrlKey ? 'mod+' : ''}${e.shiftKey ? 'shift+' : ''}${e.altKey ? 'alt+' : ''}${key === ' ' ? 'space' : key}`;
            
            setShortcutMap(prev => ({ ...prev, [recordingAction]: combo }));
            setRecordingAction(null);
        };

        const handleClickOutside = () => setRecordingAction(null);

        window.addEventListener('keydown', handleRecord);
        window.addEventListener('click', handleClickOutside);
        return () => {
            window.removeEventListener('keydown', handleRecord);
            window.removeEventListener('click', handleClickOutside);
        }

    }, [recordingAction, setShortcutMap]);

    const handleReset = () => {
        setShortcutMap(DEFAULT_SHORTCUTS);
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold mb-1">Keyboard Shortcuts</h2>
                    <p className="text-sm text-slate-400">Customize your workflow with custom shortcuts.</p>
                </div>
                <button onClick={handleReset} className="px-3 py-1.5 bg-white/10 text-white/80 text-xs font-semibold rounded-md hover:bg-white/20">Reset all to Defaults</button>
            </div>
            
            <div className="bg-slate-800/50 p-4 rounded-lg">
                <div className="space-y-3">
                    {SHORTCUT_ACTIONS.map(action => (
                        <div key={action.id} className="flex items-center justify-between p-2 rounded-md hover:bg-white/5">
                            <span className="font-medium text-sm">{action.name}</span>
                            <button
                                onClick={() => setRecordingAction(action.id)}
                                className="px-3 py-1 bg-slate-700/50 text-slate-300 text-xs font-mono rounded-md border border-slate-600 hover:bg-slate-700 hover:text-white min-w-[120px] text-center"
                            >
                                {recordingAction === action.id ? 'Press new keys...' : formatKey(shortcutMap[action.id])}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const AboutSettings: React.FC = () => {
    return (
        <div className="animate-fade-in font-mono text-green-400 h-full flex flex-col">
            <h2 className="text-2xl font-bold mb-1">About</h2>
            <p className="text-sm text-slate-400 mb-8">System Information & Diagnostics</p>
            <div className="bg-black/80 p-6 rounded-lg border-2 border-green-400/30 shadow-[0_0_15px_rgba(74,222,128,0.2)] flex-grow flex flex-col">
                <pre className="text-sm leading-tight text-center mb-4 text-green-300">
                    {`
    _    _   _____
   / \\  | | |_   _|
  / _ \\ | |   | |
 / ___ \\| |___| |
/_/   \\_\\_____|_|
`}
                </pre>
                
                <h3 className="text-3xl font-bold mb-1 text-center text-green-300 glitch" data-text="AI Studio">AI Studio</h3>
                <p className="text-center text-green-400/80 mb-6">Version 1.0.0_beta // build_id: {new Date().getTime()}</p>

                <div className="text-sm space-y-1 flex-grow">
                    <p>&gt; Initializing system... <span className="text-green-400/60">OK</span></p>
                    <p>&gt; Loading modules... <span className="text-green-400/60">OK</span></p>
                    <p className="mb-4">&gt; System ready.</p>
                    
                    <p className="whitespace-pre-wrap text-green-300/90">
                        {`An OS-inspired platform for AI-powered content creation and social media management, 
featuring advanced tools for generating high-quality designs, images, and videos.`}
                    </p>
                </div>
                
                <p className="mt-4 text-left">&gt; <span className="animate-pulse">█</span></p>
            </div>
        </div>
    );
};