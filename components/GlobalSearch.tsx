import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppDefinition, Project, CloudFile, CloudFolder, SearchResult, WindowState } from '../types';

interface GlobalSearchProps {
    apps: AppDefinition[];
    projects: Project[];
    files: CloudFile[];
    folders: CloudFolder[];
    onClose: () => void;
    onOpenApp: (appId: string, options?: { folderId?: string, fileId?: string }) => void;
    onOpenProject: (appId: string, projectId: string) => void;
}

const getFileIcon = (type: 'folder' | 'image' | 'video' | 'audio' | 'document') => {
    switch (type) {
        case 'folder': return <i className="fi fi-rr-folder text-amber-400"></i>;
        case 'image': return <i className="fi fi-rr-picture text-purple-400"></i>;
        case 'video': return <i className="fi fi-rr-film text-red-400"></i>;
        case 'audio': return <i className="fi fi-rr-music-alt text-cyan-400"></i>;
        case 'document': return <i className="fi fi-rr-document text-blue-400"></i>;
        default: return <i className="fi fi-rr-file text-gray-400"></i>;
    }
};

export const GlobalSearch: React.FC<GlobalSearchProps> = (props) => {
    const { apps, projects, files, folders, onClose, onOpenApp, onOpenProject } = props;

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        inputRef.current?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setSelectedIndex(prev => Math.max(0, prev - 1));
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                setSelectedIndex(prev => Math.min(results.length - 1, prev + 1));
            } else if (event.key === 'Enter') {
                event.preventDefault();
                if (results[selectedIndex]) {
                    results[selectedIndex].action();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, results, selectedIndex]);

    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const newResults: SearchResult[] = [];

        // Apps
        apps.forEach(app => {
            if (app.name.toLowerCase().includes(lowerQuery)) {
                newResults.push({
                    id: `app-${app.id}`,
                    type: 'app',
                    name: app.name,
                    description: 'Application',
                    icon: app.icon,
                    action: () => onOpenApp(app.id)
                });
            }
        });

        // Projects
        projects.forEach(project => {
            if (project.name.toLowerCase().includes(lowerQuery)) {
                const app = apps.find(a => a.id === project.appId);
                newResults.push({
                    id: `project-${project.id}`,
                    type: 'project',
                    name: project.name,
                    description: `Project in ${app?.name || 'Unknown App'}`,
                    icon: app?.icon || <i className="fi fi-rr-briefcase"></i>,
                    action: () => onOpenProject(project.appId, project.id)
                });
            }
        });

        // Files
        files.forEach(file => {
            if (file.name.toLowerCase().includes(lowerQuery)) {
                newResults.push({
                    id: `file-${file.id}`,
                    type: 'file',
                    name: file.name,
                    description: 'File',
                    icon: getFileIcon(file.type),
                    action: () => onOpenApp('file-viewer', { fileId: file.id })
                });
            }
        });
        
        // Folders
        folders.forEach(folder => {
            if (folder.name.toLowerCase().includes(lowerQuery)) {
                 newResults.push({
                    id: `folder-${folder.id}`,
                    type: 'folder',
                    name: folder.name,
                    description: 'Folder',
                    icon: getFileIcon('folder'),
                    action: () => onOpenApp('file-explorer', { folderId: folder.id })
                });
            }
        });

        // Web Search
        newResults.push({
            id: 'web-search',
            type: 'web',
            name: `Search web for "${query}"`,
            description: 'Web Search',
            icon: <i className="fi fi-rr-globe"></i>,
            action: () => {
                const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                // This is a bit of a hack. Ideally, the browser app would take a URL prop.
                // For now, let's just open the browser. The user can copy-paste.
                // A better implementation would be to pass the query to the browser app.
                onOpenApp('browser');
                onClose();
            }
        });

        setResults(newResults);
        setSelectedIndex(0);

    }, [query, apps, projects, files, folders, onOpenApp, onOpenProject, onClose]);
    
    useEffect(() => {
        // Scroll selected item into view
        const selectedElement = resultsRef.current?.children[selectedIndex] as HTMLElement;
        if (selectedElement) {
            selectedElement.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-24 animate-fade-in" onClick={onClose}>
            <div 
                className="w-full max-w-2xl bg-dock-bg backdrop-blur-xl rounded-2xl shadow-lg border border-border-color flex flex-col overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 p-2 border-b border-border-color focus-within:ring-2 focus-within:ring-brand-blue rounded-t-2xl">
                    <i className="fi fi-rr-search text-brand-blue text-xl px-2"></i>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search apps, files, projects, and more..."
                        className="w-full bg-transparent py-1 focus:outline-none text-lg"
                    />
                </div>
                
                <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto">
                    {results.length > 0 ? (
                        <div className="p-2 space-y-1">
                            {results.map((item, index) => {
                                const isSelected = index === selectedIndex;
                                return (
                                    <button 
                                        key={item.id}
                                        onClick={item.action}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`w-full flex items-center justify-between gap-4 p-3 text-left rounded-lg transition-colors ${isSelected ? 'bg-brand-blue/50' : 'hover:bg-white/10'}`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-6 h-6 text-xl flex items-center justify-center flex-shrink-0">{item.icon}</div>
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{item.name}</p>
                                                {item.description && <p className="text-xs text-white/60 truncate">{item.description}</p>}
                                            </div>
                                        </div>
                                        <span className="text-xs text-white/50 flex-shrink-0">{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                         query && <p className="p-6 text-center text-sm text-white/50">No results found for "{query}".</p>
                    )}
                </div>
            </div>
        </div>
    );
};