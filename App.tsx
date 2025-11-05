


import React, { useState, useCallback, useEffect } from 'react';
import { Dock } from './components/Dock';
import { Window } from './components/Window';
import { ImageStudio } from './components/apps/ImageStudio';
import { VideoStudio } from './components/apps/VideoStudio';
import { VideoEditor } from './components/apps/VideoEditor';
import { DesignStudio } from './components/apps/DesignStudio';
import { CopyStudio } from './components/apps/CopyStudio';
import { AudioStudio } from './components/apps/AudioStudio';
import { PodcastStudio } from './components/apps/PodcastStudio';
import { CodeStudio } from './components/apps/CodeStudio';
import { AgentStudio } from './components/apps/AgentStudio';
import { WorkflowStudio } from './components/apps/WorkflowStudio';
import { FileExplorer } from './components/apps/FileExplorer';
import { Settings } from './components/apps/Settings';
import { ComingSoon } from './components/apps/ComingSoon';
import { WebApps } from './components/apps/WebApps';
import { ToDo } from './components/apps/ToDo';
import { UserProfile } from './components/apps/UserProfile';
import { Terminal } from './components/apps/Terminal';
import { Browser } from './components/apps/Browser';
import { MediaPlayer } from './components/apps/MediaPlayer';
import { FileViewer } from './components/apps/FileViewer';
import { AppDefinition, ContextMenuItem, Workspace, WindowSnapHint, SystemAction, ShortcutAction, ShortcutMap, Notification, UserProfileState, Project, CreativeAppProps, WindowState, CloudFile, MediaState } from './types';
import { APPS, SYSTEM_TOOLS, mockFolders, mockFiles } from './constants';
import { THEME_SETTINGS, DEFAULT_THEME, Theme } from './constants/theme';
import { StartMenu } from './components/StartMenu';
import { LockScreen } from './components/LockScreen';
import { StageManager } from './components/StageManager';
import { ContextMenu } from './components/ContextMenu';
import { TopBar } from './components/TopBar';
import { SystemAgent } from './components/SystemAgent';
import { DEFAULT_SHORTCUTS } from './constants/shortcuts';
import { NotificationCenter } from './components/NotificationCenter';
import { NotificationHost } from './components/NotificationHost';
import { AsciiBackground } from './components/AsciiBackground';
import { GlobalSearch } from './components/GlobalSearch';

const ALL_APPS = [...APPS, ...SYSTEM_TOOLS];
const TOP_BAR_HEIGHT = 56;
const DOCK_HEIGHT = 64; // Adjusted for smaller dock
const CREATIVE_APP_IDS = ['image-studio', 'video-studio', 'video-editor', 'design-studio', 'copy-studio', 'audio-studio', 'podcast-studio', 'code-studio'];
const DEFAULT_AVATAR = 'https://i.imgur.com/3f8n1fX.png';


const createDefaultWorkspaceState = () => ({
    openApps: ['video-editor'],
    minimizedApps: new Set<string>(),
    maximizedApps: new Set<string>(),
    activeApp: 'video-editor',
    windowStates: {},
});

const App: React.FC = () => {
    const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
    const [isLocked, setIsLocked] = useState(true);
    const [snapHint, setSnapHint] = useState<WindowSnapHint | null>(null);
    const [isAgentOpen, setIsAgentOpen] = useState(false);
    const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Session State (not persisted for security)
    const [userPassword, setUserPassword] = useState('password');
    const [activeProjects, setActiveProjects] = useState<Record<string, string | null>>({});
    
    // Global Media State
    const [mediaState, setMediaState] = useState<MediaState>({
        isPlaying: false,
        currentTrack: null,
        playlist: [],
        trackIndex: -1,
    });

    // Persistent State
    const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
        try {
            const saved = localStorage.getItem('ai-studio-workspaces');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Ensure sets are properly hydrated from arrays
                return parsed.map((ws: any) => ({
                    ...ws,
                    state: {
                        ...ws.state,
                        minimizedApps: new Set(Array.isArray(ws.state.minimizedApps) ? ws.state.minimizedApps : []),
                        maximizedApps: new Set(Array.isArray(ws.state.maximizedApps) ? ws.state.maximizedApps : []),
                    }
                }));
            }
        } catch (e) { console.error("Failed to parse workspaces", e); }
        return [{ id: `ws-${Date.now()}`, name: 'Workspace 1', state: createDefaultWorkspaceState() }];
    });

    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() => {
        try {
            return localStorage.getItem('ai-studio-active-workspace') || workspaces[0].id;
        } catch (e) { return workspaces[0].id; }
    });
    
    const [projects, setProjects] = useState<Project[]>(() => {
        try {
            const saved = localStorage.getItem('ai-studio-projects');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse projects", e);
            return [];
        }
    });

    const [theme, setTheme] = useState<Theme>(() => {
        try {
            const saved = localStorage.getItem('ai-studio-theme');
            return saved ? JSON.parse(saved) : DEFAULT_THEME;
        } catch (e) { return DEFAULT_THEME; }
    });
    
    const [animatingIcon, setAnimatingIcon] = useState<string | null>(null);
    
    const [connectedWebApps, setConnectedWebApps] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem('ai-studio-connected-web-apps');
            return saved ? new Set(JSON.parse(saved)) : new Set(['instagram']);
        } catch (e) { return new Set(['instagram']); }
    });
    
    const [dockSettings, setDockSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('ai-studio-dock-settings');
            if (saved) return JSON.parse(saved);
        } catch (e) { console.error(e) }
        return {
            visibleApps: ALL_APPS.reduce((acc, app) => ({...acc, [app.id]: true}), {}),
            showSystemTools: true,
        };
    });
    
    const [dockOrder, setDockOrder] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('ai-studio-dock-order');
            if (saved) {
                const parsedOrder = JSON.parse(saved);
                const appIds = APPS.map(app => app.id);
                const currentAppIds = new Set(parsedOrder);
                const missingAppIds = appIds.filter(id => !currentAppIds.has(id));
                return [...parsedOrder, ...missingAppIds];
            }
        } catch (e) { console.error(e) }
        return APPS.map(app => app.id);
    });

    const [pinnedFolders, setPinnedFolders] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('ai-studio-pinned-folders');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });
    
    const [userProfile, setUserProfile] = useState<UserProfileState>(() => {
        try {
            const saved = localStorage.getItem('ai-studio-user-profile');
            return saved ? JSON.parse(saved) : { name: 'AI Studio User', avatar: DEFAULT_AVATAR };
        } catch (e) {
            return { name: 'AI Studio User', avatar: DEFAULT_AVATAR };
        }
    });
    
    const [collaborationSettings, setCollaborationSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('ai-studio-collaboration-settings');
            if (saved) return JSON.parse(saved);
        } catch (e) { console.error(e) }
        return {
          realtimeCoEditing: true,
          workspaces: [{ id: 'ws-proj1', name: 'Project Alpha', members: ['a', 'b'] }],
          teamMembers: [
            { id: 'a', name: 'You', role: 'Admin', avatar: DEFAULT_AVATAR },
            { id: 'b', name: 'Jane Doe', role: 'Editor', avatar: 'https://i.pravatar.cc/100?u=jane' }
          ]
        };
    });
    
    const [fileSyncSettings, setFileSyncSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('ai-studio-file-sync-settings');
            if (saved) return JSON.parse(saved);
        } catch (e) { console.error(e) }
        return { isSyncEnabled: true, syncedFolders: ['1', '2'] };
    });

    const [shortcutMap, setShortcutMap] = useState<ShortcutMap>(() => {
        try {
            const saved = localStorage.getItem('ai-studio-shortcuts');
            return saved ? { ...DEFAULT_SHORTCUTS, ...JSON.parse(saved) } : DEFAULT_SHORTCUTS;
        } catch (e) { return DEFAULT_SHORTCUTS; }
    });

    const [notifications, setNotifications] = useState<Notification[]>(() => {
        try {
            const saved = localStorage.getItem('ai-studio-notifications');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);

    // Save state to localStorage
    useEffect(() => {
        const stateToSave = workspaces.map(ws => ({
            ...ws,
            state: {
                ...ws.state,
                minimizedApps: Array.from(ws.state.minimizedApps),
                maximizedApps: Array.from(ws.state.maximizedApps),
            }
        }));
        
        const serializableProjects = projects.map(p => {
            // Strip non-serializable blob URLs before saving
            if (p.appId === 'video-editor' || p.appId === 'video-studio') {
                const cleanedData = { ...p.data };
                if (cleanedData.media) {
                    cleanedData.media = cleanedData.media.map((m: any) => ({ ...m, url: '' }));
                }
                if (cleanedData.scenes) {
                    cleanedData.scenes = cleanedData.scenes.map((s: any) => ({ ...s, generatedUrl: null }));
                }
                return { ...p, data: cleanedData };
            }
            return p;
        });
        
        localStorage.setItem('ai-studio-projects', JSON.stringify(serializableProjects));
        localStorage.setItem('ai-studio-workspaces', JSON.stringify(stateToSave));
        localStorage.setItem('ai-studio-active-workspace', activeWorkspaceId);
        localStorage.setItem('ai-studio-theme', JSON.stringify(theme));
        localStorage.setItem('ai-studio-dock-settings', JSON.stringify(dockSettings));
        localStorage.setItem('ai-studio-dock-order', JSON.stringify(dockOrder));
        localStorage.setItem('ai-studio-pinned-folders', JSON.stringify(pinnedFolders));
        localStorage.setItem('ai-studio-connected-web-apps', JSON.stringify(Array.from(connectedWebApps)));
        localStorage.setItem('ai-studio-user-profile', JSON.stringify(userProfile));
        localStorage.setItem('ai-studio-collaboration-settings', JSON.stringify(collaborationSettings));
        localStorage.setItem('ai-studio-file-sync-settings', JSON.stringify(fileSyncSettings));
        localStorage.setItem('ai-studio-shortcuts', JSON.stringify(shortcutMap));
        localStorage.setItem('ai-studio-notifications', JSON.stringify(notifications));
    }, [workspaces, activeWorkspaceId, theme, dockSettings, dockOrder, pinnedFolders, connectedWebApps, userProfile, collaborationSettings, fileSyncSettings, shortcutMap, notifications, projects]);
    
    // Sync user profile changes with collaboration settings
    useEffect(() => {
        setCollaborationSettings(prev => ({
            ...prev,
            teamMembers: prev.teamMembers.map(m => 
                m.id === 'a' 
                    ? { ...m, name: userProfile.name, avatar: userProfile.avatar } 
                    : m
            )
        }));
    }, [userProfile.name, userProfile.avatar]);

    useEffect(() => {
        const root = document.documentElement;
        
        const accentColor = THEME_SETTINGS.accentColors.find(c => c.name === theme.accentColor) || THEME_SETTINGS.accentColors[0];
        root.style.setProperty('--accent-color', accentColor.hex);
        root.style.setProperty('--accent-color-hover', accentColor.hoverHex);
        root.style.setProperty('--accent-color-rgb', accentColor.rgb);

        const tintColor = THEME_SETTINGS.tintColors.find(c => c.name === theme.tintColor) || THEME_SETTINGS.tintColors[0];
        root.style.setProperty('--tint-color-rgb', tintColor.rgb);

        const wallpaper = THEME_SETTINGS.wallpapers.find(w => w.name === theme.background);
        if (wallpaper?.name === 'Aurora' && !theme.customBackgroundUrl) {
            document.body.classList.add('aurora-bg');
        } else {
            document.body.classList.remove('aurora-bg');
        }
    }, [theme]);
    
    useEffect(() => {
        const handleGlobalClick = () => setContextMenu(null);
        window.addEventListener('click', handleGlobalClick);
        return () => window.removeEventListener('click', handleGlobalClick);
    }, []);

    const activeWorkspace = workspaces.find(ws => ws.id === activeWorkspaceId)!;
    const { openApps, minimizedApps, maximizedApps, activeApp } = activeWorkspace.state;

    const updateActiveWorkspace = (updater: (draft: Workspace['state']) => Workspace['state']) => {
        setWorkspaces(prev => prev.map(ws => 
            ws.id === activeWorkspaceId ? { ...ws, state: updater(ws.state) } : ws
        ));
    };
    
    const handleLogin = () => setIsLocked(false);
    const handleLock = () => setIsLocked(true);
    
    const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
        const newNotification: Notification = {
            ...notification,
            id: Date.now(),
            read: false,
            timestamp: Date.now(),
        };
        setNotifications(prev => [newNotification, ...prev]);
    }, []);

    const markNotificationAsRead = useCallback((id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);
    
    const markAllNotificationsAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const bringToFront = useCallback((id: string) => {
        updateActiveWorkspace(draft => ({...draft, activeApp: id}));
    }, [activeWorkspaceId]);

    const openApp = useCallback((id: string, options: {folderId?: string, fileId?: string} = {}) => {
        updateActiveWorkspace(draft => {
            const newMinimized = new Set(draft.minimizedApps);
            newMinimized.delete(id);
            const newOpen = draft.openApps.includes(id) ? draft.openApps : [...draft.openApps, id];

            let newWindowStates = { ...draft.windowStates };
            if (id === 'file-explorer' && options.folderId) {
                const currentFEState = newWindowStates['file-explorer'] || {};
                newWindowStates = {
                    ...newWindowStates,
                    'file-explorer': {
                        ...currentFEState,
                        folderId: options.folderId,
                    }
                };
            }
            
            if (id === 'file-viewer' && options.fileId) {
                const currentFVState = newWindowStates['file-viewer'] || {};
                newWindowStates = {
                    ...newWindowStates,
                    'file-viewer': {
                        ...currentFVState,
                        fileId: options.fileId,
                    }
                };
            }

            return {
                ...draft, 
                openApps: newOpen, 
                minimizedApps: newMinimized, 
                activeApp: id,
                windowStates: newWindowStates
            };
        });
    }, [activeWorkspaceId]);

    const executeShortcut = useCallback((action: ShortcutAction) => {
        console.log('Executing shortcut:', action);
        if (action.startsWith('openApp:')) {
            const appId = action.split(':')[1];
            openApp(appId);
        } else if (action === 'openAgent') {
            setIsAgentOpen(p => !p);
        } else if (action === 'openSearch') {
            setIsSearchOpen(p => !p);
        } else if (action === 'lockScreen') {
            handleLock();
        }
    }, [openApp, handleLock]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) || (e.target as HTMLElement).isContentEditable) {
                return;
            }

            const key = e.key.toLowerCase();
            const combo = `${e.metaKey || e.ctrlKey ? 'mod+' : ''}${e.shiftKey ? 'shift+' : ''}${e.altKey ? 'alt+' : ''}${key === ' ' ? 'space' : key}`;
            
            const action = (Object.keys(shortcutMap) as ShortcutAction[]).find(
                act => shortcutMap[act] === combo
            );

            if (action) {
                e.preventDefault();
                executeShortcut(action);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcutMap, executeShortcut]);

    const handleOpenAppFromMenu = (id: string) => {
        openApp(id);
        setIsStartMenuOpen(false);
    };

    const handleStopMedia = () => {
        setMediaState({ isPlaying: false, currentTrack: null, playlist: [], trackIndex: -1 });
    };

    const closeApp = useCallback((id: string) => {
        if (id === 'media-player') {
            handleStopMedia();
        }
        updateActiveWorkspace(draft => {
            const remaining = draft.openApps.filter(appId => appId !== id);
            const newMinimized = new Set(draft.minimizedApps);
            newMinimized.delete(id);
            const newMaximized = new Set(draft.maximizedApps);
            newMaximized.delete(id);
            
            let newActive = draft.activeApp;
            if (newActive === id) {
                const openAndNotMinimized = remaining.filter(appId => !newMinimized.has(appId));
                newActive = openAndNotMinimized[openAndNotMinimized.length - 1] || '';
            }
            return {...draft, openApps: remaining, minimizedApps: newMinimized, maximizedApps: newMaximized, activeApp: newActive};
        });
        if (CREATIVE_APP_IDS.includes(id)) {
            setActiveProjects(prev => ({ ...prev, [id]: null }));
        }
    }, [activeWorkspaceId]);
    
    const handleMinimizeApp = useCallback((id: string) => {
        updateActiveWorkspace(draft => {
            const newMinimized = new Set(draft.minimizedApps).add(id);
            let newActive = draft.activeApp;
            if (newActive === id) {
                const openAndNotMinimized = draft.openApps.filter(appId => appId !== id && !newMinimized.has(appId));
                newActive = openAndNotMinimized[openAndNotMinimized.length - 1] || '';
            }
            return {...draft, minimizedApps: newMinimized, activeApp: newActive};
        });
    }, [activeWorkspaceId]);

    const handleMaximizeApp = useCallback((id: string) => {
        updateActiveWorkspace(draft => {
            const newMaximized = new Set(draft.maximizedApps);
            newMaximized.has(id) ? newMaximized.delete(id) : newMaximized.add(id);
            return {...draft, maximizedApps: newMaximized, activeApp: id};
        });
    }, [activeWorkspaceId]);

    const handleDockClick = useCallback((id: string) => {
        setAnimatingIcon(id);
        setTimeout(() => setAnimatingIcon(null), 400);

        if (minimizedApps.has(id)) {
            updateActiveWorkspace(draft => {
                const newMinimized = new Set(draft.minimizedApps);
                newMinimized.delete(id);
                return {...draft, minimizedApps: newMinimized, activeApp: id};
            });
            return;
        }
        if (!openApps.includes(id)) {
            openApp(id);
            return;
        }
        if (activeApp === id) {
            handleMinimizeApp(id);
            return;
        }
        bringToFront(id);
    }, [minimizedApps, openApps, activeApp, openApp, handleMinimizeApp, bringToFront, activeWorkspaceId]);
    
    const handleTogglePinFolder = (folderId: string) => {
        setPinnedFolders(prev => 
            prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]
        );
    };

    const handleExecuteAction = (action: SystemAction['action'], payload: SystemAction['payload']) => {
        console.log('Executing action:', action, payload);
        switch (action) {
            case 'openApp':
                if (payload.appId && ALL_APPS.some(app => app.id === payload.appId)) {
                    openApp(payload.appId);
                }
                break;
            case 'closeApp':
                if (payload.appId && openApps.includes(payload.appId)) {
                    closeApp(payload.appId);
                }
                break;
            case 'minimizeApp':
                if (payload.appId && openApps.includes(payload.appId)) {
                    handleMinimizeApp(payload.appId);
                }
                break;
            case 'maximizeApp':
                 if (payload.appId && openApps.includes(payload.appId)) {
                    handleMaximizeApp(payload.appId);
                }
                break;
            case 'createWorkspace':
                if (payload.name) {
                    const newWorkspace: Workspace = {
                        id: `ws-${Date.now()}`,
                        name: payload.name,
                        state: createDefaultWorkspaceState(),
                    };
                    setWorkspaces(prev => [...prev, newWorkspace]);
                    setActiveWorkspaceId(newWorkspace.id);
                }
                break;
            case 'switchWorkspace':
                if (payload.workspaceName) {
                    const targetWs = workspaces.find(ws => ws.name.toLowerCase() === payload.workspaceName.toLowerCase());
                    if (targetWs) {
                        setActiveWorkspaceId(targetWs.id);
                    }
                }
                break;
            case 'setTheme':
                setTheme(prev => {
                    const newTheme = { ...prev };
                    if (payload.accentColor && THEME_SETTINGS.accentColors.some(c => c.name.toLowerCase() === payload.accentColor.toLowerCase())) {
                        const color = THEME_SETTINGS.accentColors.find(c => c.name.toLowerCase() === payload.accentColor.toLowerCase());
                        newTheme.accentColor = color!.name;
                    }
                     if (payload.background && THEME_SETTINGS.wallpapers.some(w => w.name.toLowerCase() === payload.background.toLowerCase())) {
                        const wall = THEME_SETTINGS.wallpapers.find(w => w.name.toLowerCase() === payload.background.toLowerCase());
                        newTheme.background = wall!.name;
                        newTheme.customBackgroundUrl = null;
                    }
                    return newTheme;
                });
                break;
            case 'pinFolder':
                if (payload.folderName) {
                    const folder = mockFolders.find(f => f.name.toLowerCase() === payload.folderName.toLowerCase());
                    if (folder && !pinnedFolders.includes(folder.id)) {
                        handleTogglePinFolder(folder.id);
                    }
                }
                break;
            case 'unpinFolder':
                if (payload.folderName) {
                    const folder = mockFolders.find(f => f.name.toLowerCase() === payload.folderName.toLowerCase());
                    if (folder && pinnedFolders.includes(folder.id)) {
                        handleTogglePinFolder(folder.id);
                    }
                }
                break;
            case 'lockScreen':
                handleLock();
                break;
        }
        setIsAgentOpen(false); // close agent after action
    };

    // Project Handlers
    const handleSetActiveProjectId = (appId: string, projectId: string | null) => {
        setActiveProjects(prev => ({ ...prev, [appId]: projectId }));
    };

    const handleCreateProject = (appId: string, name: string, initialData: any): string => {
        const newProject: Project = {
            id: `proj-${Date.now()}`,
            name,
            appId,
            data: initialData,
            lastModified: Date.now(),
        };
        setProjects(prev => [newProject, ...prev]);
        return newProject.id;
    };
    
    const handleUpdateProject = (projectId: string, data: any, thumbnail?: string) => {
        setProjects(prev => prev.map(p => 
            p.id === projectId 
            ? { ...p, data, thumbnail: thumbnail || p.thumbnail, lastModified: Date.now() } 
            : p
        ));
    };

    const handleDeleteProject = (projectId: string) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
    };

    const handleUpdateWindowState = (appId: string, newState: WindowState) => {
        updateActiveWorkspace(draft => ({
            ...draft,
            windowStates: {
                ...draft.windowStates,
                [appId]: newState
            }
        }));
    };
    
    // Media Controls
    const handleTogglePlay = () => {
        if (mediaState.currentTrack) {
            setMediaState(s => ({ ...s, isPlaying: !s.isPlaying }));
        }
    };

    const handlePlayNext = () => {
        if (mediaState.playlist.length === 0) return;
        const nextIndex = (mediaState.trackIndex + 1) % mediaState.playlist.length;
        setMediaState(s => ({
            ...s,
            trackIndex: nextIndex,
            currentTrack: s.playlist[nextIndex],
            isPlaying: true,
        }));
    };

    const handlePlayPrev = () => {
        if (mediaState.playlist.length === 0) return;
        const prevIndex = (mediaState.trackIndex - 1 + mediaState.playlist.length) % mediaState.playlist.length;
        setMediaState(s => ({
            ...s,
            trackIndex: prevIndex,
            currentTrack: s.playlist[prevIndex],
            isPlaying: true,
        }));
    };

    const handlePlayTrack = (track: CloudFile, playlist: CloudFile[]) => {
        const trackIndex = playlist.findIndex(t => t.id === track.id);
        setMediaState({
            playlist,
            trackIndex,
            currentTrack: track,
            isPlaying: true,
        });
    };


    const renderAppComponent = (app: AppDefinition) => {
        if (CREATIVE_APP_IDS.includes(app.id)) {
             const creativeAppProps: CreativeAppProps = {
                projects: projects,
                appId: app.id,
                activeProjectId: activeProjects[app.id] || null,
                onSetActiveProjectId: handleSetActiveProjectId,
                onUpdateProject: handleUpdateProject,
                onCreateProject: handleCreateProject,
                onDeleteProject: handleDeleteProject,
                appDefinition: app,
            };
            switch (app.id) {
                case 'image-studio': return <ImageStudio {...creativeAppProps} />;
                case 'video-studio': return <VideoStudio {...creativeAppProps} />;
                case 'video-editor': return <VideoEditor {...creativeAppProps} />;
                case 'audio-studio': return <AudioStudio {...creativeAppProps} />;
                case 'podcast-studio': return <PodcastStudio {...creativeAppProps} />;
                case 'design-studio': return <DesignStudio {...creativeAppProps} />;
                case 'copy-studio': return <CopyStudio {...creativeAppProps} />;
                case 'code-studio': return <CodeStudio {...creativeAppProps} />;
                default: return <ComingSoon app={app} />;
            }
        }
        
        switch (app.id) {
            case 'agent-studio': return <AgentStudio />;
            case 'workflow-studio': return <WorkflowStudio />;
            case 'webapps-store': return <WebApps connectedApps={connectedWebApps} setConnectedApps={setConnectedWebApps} />;
            case 'file-explorer': return <FileExplorer setContextMenu={setContextMenu} pinnedFolders={pinnedFolders} onTogglePin={handleTogglePinFolder} openApp={openApp} />;
            case 'settings': return <Settings theme={theme} setTheme={setTheme} dockSettings={dockSettings} setDockSettings={setDockSettings} collaborationSettings={collaborationSettings} setCollaborationSettings={setCollaborationSettings} fileSyncSettings={fileSyncSettings} setFileSyncSettings={setFileSyncSettings} shortcutMap={shortcutMap} setShortcutMap={setShortcutMap} dockOrder={dockOrder} setDockOrder={setDockOrder} />;
            case 'todo': return <ToDo />;
            case 'browser': return <Browser />;
            case 'media-player': return <MediaPlayer files={mockFiles} folders={mockFolders} mediaState={mediaState} onPlayTrack={handlePlayTrack} onTogglePlay={handleTogglePlay} onPlayNext={handlePlayNext} onPlayPrev={handlePlayPrev} />;
            case 'file-viewer': return <FileViewer files={mockFiles} folders={mockFolders} />;
            case 'user-profile': return <UserProfile userProfile={userProfile} setUserProfile={setUserProfile} setUserPassword={setUserPassword} />;
            case 'secret-terminal': return <Terminal userProfile={userProfile} onClose={() => closeApp('secret-terminal')} />;
            default: return <ComingSoon app={app} />;
        }
    };

    const handleDesktopContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        const items: ContextMenuItem[] = [
            { label: 'Appearance Settings', action: () => openApp('settings'), icon: <i className="fi fi-rr-swatchbook" /> },
            { label: 'Dock Settings', action: () => openApp('settings'), icon: <i className="fi fi-rr-layout-fluid" /> },
            { label: 'Lock Screen', action: handleLock, icon: <i className="fi fi-rr-lock" /> },
        ];
        setContextMenu({ x: e.clientX, y: e.clientY, items });
    };

    if (isLocked) {
        return <LockScreen onLogin={handleLogin} userProfile={userProfile} userPassword={userPassword} />;
    }

    const stageManagerApps = openApps.filter(id => id !== activeApp && !minimizedApps.has(id));
    const isStageVisible = stageManagerApps.length > 0;
    
    const wallpaper = THEME_SETTINGS.wallpapers.find(w => w.name === theme.background);
    const backgroundUrl = theme.customBackgroundUrl || wallpaper?.url;
    const isAurora = wallpaper?.name === 'Aurora' && !theme.customBackgroundUrl;

    return (
        <div className="w-screen h-screen overflow-hidden font-sans relative" onContextMenu={handleDesktopContextMenu}>
            {backgroundUrl === 'dynamic-ascii' ? (
                <AsciiBackground />
            ) : !isAurora && (
                 <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-500 z-0"
                    style={{
                        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
                        backgroundColor: '#020617'
                    }}
                />
            )}
            
            <div className="absolute inset-0 z-10 flex flex-col">
                {contextMenu && <ContextMenu {...contextMenu} onClose={() => setContextMenu(null)} />}
                {snapHint && <div className="absolute bg-white/10 border-2 border-dashed border-white/50 z-50 pointer-events-none transition-all duration-100" style={snapHint} />}
                
                <NotificationHost notifications={notifications} onDismiss={markNotificationAsRead} />
                
                <TopBar
                    workspaces={workspaces}
                    setWorkspaces={setWorkspaces}
                    activeWorkspaceId={activeWorkspaceId}
                    setActiveWorkspaceId={setActiveWorkspaceId}
                    activeAppId={activeApp}
                    allApps={ALL_APPS}
                    onToggleAgent={() => setIsAgentOpen(p => !p)}
                    onToggleSearch={() => setIsSearchOpen(p => !p)}
                    notifications={notifications}
                    onToggleNotifications={() => setIsNotificationCenterOpen(p => !p)}
                    userProfile={userProfile}
                    onOpenApp={openApp}
                    mediaState={mediaState}
                    onTogglePlay={handleTogglePlay}
                    onPlayNext={handlePlayNext}
                    onPlayPrev={handlePlayPrev}
                />
                {isAgentOpen && (
                    <SystemAgent 
                        onClose={() => setIsAgentOpen(false)}
                        onExecuteAction={handleExecuteAction}
                    />
                )}
                {isSearchOpen && (
                    <GlobalSearch
                        apps={ALL_APPS}
                        projects={projects}
                        files={mockFiles}
                        folders={mockFolders}
                        onClose={() => setIsSearchOpen(false)}
                        onOpenApp={(appId, options) => {
                            openApp(appId, options);
                            setIsSearchOpen(false);
                        }}
                        onOpenProject={(appId, projectId) => {
                            openApp(appId);
                            handleSetActiveProjectId(appId, projectId);
                            setIsSearchOpen(false);
                        }}
                    />
                )}
                 {isNotificationCenterOpen && (
                    <NotificationCenter
                        notifications={notifications}
                        onClose={() => setIsNotificationCenterOpen(false)}
                        onMarkAsRead={markNotificationAsRead}
                        onClearAll={clearAllNotifications}
                        onMarkAllAsRead={markAllNotificationsAsRead}
                    />
                )}

                <main className="w-full flex-grow relative" style={{ paddingTop: `${TOP_BAR_HEIGHT}px`}}>
                    <StageManager apps={ALL_APPS} stageManagerApps={stageManagerApps} onAppSelect={bringToFront} />
                    {isStartMenuOpen && <StartMenu apps={ALL_APPS} onAppClick={handleOpenAppFromMenu} onClose={() => setIsStartMenuOpen(false)} onLock={handleLock} dockHeight={DOCK_HEIGHT} />}
                    {ALL_APPS
                        .filter(app => openApps.includes(app.id) && !minimizedApps.has(app.id))
                        .map((app) => (
                        <Window
                            key={`${activeWorkspaceId}-${app.id}`}
                            app={app}
                            onClose={() => closeApp(app.id)}
                            onMinimize={() => handleMinimizeApp(app.id)}
                            onMaximize={() => handleMaximizeApp(app.id)}
                            onFocus={() => bringToFront(app.id)}
                            isActive={activeApp === app.id}
                            isMaximized={maximizedApps.has(app.id)}
                            isStageVisible={isStageVisible}
                            setSnapHint={setSnapHint}
                            topBarHeight={TOP_BAR_HEIGHT}
                            dockHeight={DOCK_HEIGHT}
                            initialState={activeWorkspace.state.windowStates[app.id]}
                            onStateChange={handleUpdateWindowState}
                        >
                            {renderAppComponent(app)}
                        </Window>
                    ))}
                </main>

                <Dock 
                    apps={APPS} 
                    systemTools={SYSTEM_TOOLS.filter(t => t.id !== 'user-profile')} 
                    onAppClick={handleDockClick}
                    openApps={openApps} 
                    activeApp={activeApp}
                    minimizedApps={minimizedApps}
                    onStartClick={() => setIsStartMenuOpen(p => !p)}
                    animatingIcon={animatingIcon}
                    dockSettings={dockSettings}
                    dockOrder={dockOrder}
                    pinnedFolders={pinnedFolders.map(id => mockFolders.find(f => f.id === id)).filter(Boolean) as any[]}
                    onPinnedFolderClick={(folderId) => openApp('file-explorer', { folderId })}
                    onCloseApp={closeApp}
                    onMinimizeApp={handleMinimizeApp}
                    onTogglePin={handleTogglePinFolder}
                    setContextMenu={setContextMenu}
                />
            </div>
        </div>
    );
};

export default App;