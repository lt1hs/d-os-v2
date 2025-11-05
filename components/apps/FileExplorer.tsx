
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ContextMenuItem } from '../../types';
import { mockFolders, mockFiles, CloudFile, CloudFolder, SyncStatus, FileType } from '../../constants';

interface FileExplorerProps {
    setContextMenu: (menu: { x: number; y: number; items: ContextMenuItem[] } | null) => void;
    pinnedFolders: string[];
    onTogglePin: (folderId: string) => void;
}

const SyncStatusIcon: React.FC<{ status: SyncStatus }> = ({ status }) => {
    switch (status) {
        case 'local': return <i className="fi fi-rr-check-circle text-green-400" title="Available locally"></i>;
        case 'cloud': return <i className="fi fi-rr-cloud text-blue-400" title="In the cloud"></i>;
        case 'syncing': return <i className="fi fi-rr-spinner animate-spin" title="Syncing..."></i>;
        default: return null;
    }
};

const FileTypeIcon: React.FC<{ type: FileType | 'folder', sizeClass?: string }> = ({ type, sizeClass = 'text-3xl' }) => {
    const baseClass = "flex items-center justify-center";
    switch (type) {
        case 'folder': return <i className={`fi fi-rr-folder text-amber-400 ${sizeClass} ${baseClass}`}></i>;
        case 'image': return <i className={`fi fi-rr-picture text-purple-400 ${sizeClass} ${baseClass}`}></i>;
        case 'video': return <i className={`fi fi-rr-film text-red-400 ${sizeClass} ${baseClass}`}></i>;
        case 'audio': return <i className={`fi fi-rr-music-alt text-cyan-400 ${sizeClass} ${baseClass}`}></i>;
        case 'document': return <i className={`fi fi-rr-document text-blue-400 ${sizeClass} ${baseClass}`}></i>;
        default: return <i className={`fi fi-rr-file text-gray-400 ${sizeClass} ${baseClass}`}></i>;
    }
};

const isCloudFile = (item: CloudFile | CloudFolder): item is CloudFile => 'size' in item;
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
const formatFileType = (type: FileType) => type.charAt(0).toUpperCase() + type.slice(1);

const RenameInput: React.FC<{ item: { id: string, name: string }, onRename: (id: string, newName: string) => void, className?: string }> = ({ item, onRename, className }) => {
    const [name, setName] = useState(item.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.select();
    }, []);

    const handleSubmit = () => {
        if (name.trim()) {
            onRename(item.id, name.trim());
        } else {
            onRename(item.id, item.name); // revert if empty
        }
    };

    return (
        <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
                if (e.key === 'Escape') onRename(item.id, item.name); // Cancel on Esc
            }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full bg-brand-blue/20 border border-brand-blue rounded text-sm outline-none ${className}`}
        />
    );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ setContextMenu, pinnedFolders, onTogglePin }) => {
    const [folders, setFolders] = useState<CloudFolder[]>(mockFolders);
    const [files, setFiles] = useState<CloudFile[]>(mockFiles);
    const [currentFolderId, setCurrentFolderId] = useState('root');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [previewItem, setPreviewItem] = useState<CloudFile | null>(null);
    const [renamingItem, setRenamingItem] = useState<{ id: string; name: string; } | null>(null);

    const currentItems = useMemo(() => {
        const foldersInCurrent = folders.filter(f => f.parentId === currentFolderId);
        const filesInCurrent = files.filter(f => f.parentId === currentFolderId);
        const allItems = [...foldersInCurrent, ...filesInCurrent];
        if (!searchQuery) return allItems;
        return allItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [currentFolderId, searchQuery, folders, files]);

    const getBreadcrumbs = (folderId: string) => {
        const path = [];
        let current = folders.find(f => f.id === folderId);
        while (current) {
            path.unshift(current);
            current = folders.find(f => f.id === current?.parentId);
        }
        return path;
    };
    const breadcrumbs = getBreadcrumbs(currentFolderId);

    const handleCreateFolder = useCallback(() => {
        const newFolderName = `New Folder ${folders.filter(f => f.parentId === currentFolderId && f.name.startsWith('New Folder')).length + 1}`;
        const newFolder: CloudFolder = { id: `folder-${Date.now()}`, name: newFolderName, parentId: currentFolderId, syncStatus: 'local' };
        setFolders(prev => [...prev, newFolder]);
        setRenamingItem({ id: newFolder.id, name: newFolder.name });
    }, [currentFolderId, folders]);

    const handleDelete = (item: CloudFile | CloudFolder) => {
        if (!confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) return;

        if (isCloudFile(item)) {
            setFiles(prev => prev.filter(f => f.id !== item.id));
        } else {
            const foldersToDelete = new Set<string>([item.id]);
            let changed = true;
            while (changed) {
                changed = false;
                folders.forEach(f => {
                    if (f.parentId && foldersToDelete.has(f.parentId) && !foldersToDelete.has(f.id)) {
                        foldersToDelete.add(f.id);
                        changed = true;
                    }
                });
            }
            const filesToDelete = new Set<string>(files.filter(f => f.parentId && foldersToDelete.has(f.parentId)).map(f => f.id));

            setFolders(prev => prev.filter(f => !foldersToDelete.has(f.id)));
            setFiles(prev => prev.filter(f => !filesToDelete.has(f.id)));
        }
    };
    
    const handleRename = (id: string, newName: string) => {
        const isFile = files.some(f => f.id === id);
        if (isFile) {
            setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
        } else {
            setFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
        }
        setRenamingItem(null);
    };

    const handleDoubleClick = (item: CloudFile | CloudFolder) => {
        if (isCloudFile(item)) {
            if (item.type === 'image' || item.type === 'video') {
                setPreviewItem(item);
            }
        } else {
            setCurrentFolderId(item.id);
        }
    };
    
    const handleContextMenu = (e: React.MouseEvent, item: CloudFile | CloudFolder | null) => {
        e.preventDefault();
        e.stopPropagation();
        setRenamingItem(null);
        let menuItems: ContextMenuItem[] = [];

        if (item) {
            const isFolder = !isCloudFile(item);
            menuItems = [
                { label: 'Open', action: () => handleDoubleClick(item), icon: <i className="fi fi-rr-folder-open" /> },
                { label: 'Rename', action: () => setRenamingItem({ id: item.id, name: item.name }), icon: <i className="fi fi-rr-pencil" /> },
            ];
            if (isFolder) {
                const isPinned = pinnedFolders.includes(item.id);
                menuItems.push({ 
                    label: isPinned ? 'Unpin from Dock' : 'Pin to Dock', 
                    action: () => onTogglePin(item.id),
                    icon: <i className="fi fi-rr-thumbtack" />
                });
            }
            menuItems.push({ label: 'Delete', action: () => handleDelete(item), icon: <i className="fi fi-rr-trash" /> });

        } else { // background
            menuItems = [
                { label: 'New Folder', action: handleCreateFolder, icon: <i className="fi fi-rr-folder-add" /> },
                { label: 'Switch View', action: () => setViewMode(v => v === 'grid' ? 'list' : 'grid'), icon: <i className="fi fi-rr-layout-fluid" /> },
            ];
        }
        setContextMenu({ x: e.clientX, y: e.clientY, items: menuItems });
    };

    const renderGridItem = (item: CloudFile | CloudFolder) => (
        <div 
            key={item.id} 
            onContextMenu={(e) => handleContextMenu(e, item)} 
            onDoubleClick={() => handleDoubleClick(item)}
            className="bg-white/5 p-3 rounded-lg flex flex-col gap-2 cursor-pointer hover:bg-white/10 transition-colors border border-transparent hover:border-border-color"
        >
            <div className="flex items-start justify-between">
                <FileTypeIcon type={isCloudFile(item) ? item.type : 'folder'} />
                <SyncStatusIcon status={item.syncStatus} />
            </div>
            <div className="flex-grow">
                 {renamingItem?.id === item.id ? (
                    <RenameInput item={renamingItem} onRename={handleRename} className="p-1 break-all" />
                 ) : (
                    <p className="text-sm font-medium break-all line-clamp-2">{item.name}</p>
                 )}
            </div>
            {isCloudFile(item) && <p className="text-xs text-white/50">{item.size} &bull; {formatDate(item.modified)}</p>}
        </div>
    );
    
    const renderListItem = (item: CloudFile | CloudFolder) => (
         <div 
            key={item.id} 
            onContextMenu={(e) => handleContextMenu(e, item)} 
            onDoubleClick={() => handleDoubleClick(item)}
            className="flex items-center p-2 rounded-md hover:bg-white/10 transition-colors border border-transparent cursor-pointer"
        >
            <div className="w-2/5 flex items-center gap-3">
                 <FileTypeIcon type={isCloudFile(item) ? item.type : 'folder'} sizeClass="text-xl" />
                 {renamingItem?.id === item.id ? (
                    <RenameInput item={renamingItem} onRename={handleRename} className="py-0 px-1" />
                 ) : (
                    <span className="text-sm font-medium truncate">{item.name}</span>
                 )}
            </div>
            <div className="w-1/5 text-sm text-white/70">{isCloudFile(item) ? formatDate(item.modified) : '--'}</div>
            <div className="w-1/5 text-sm text-white/70">{isCloudFile(item) ? formatFileType(item.type) : 'Folder'}</div>
            <div className="w-1/5 text-sm text-white/70 text-right">{isCloudFile(item) ? item.size : '--'}</div>
        </div>
    );

    return (
        <div className="flex h-full bg-black/10 text-white/90 rounded-b-lg">
            <nav className="w-1/4 min-w-[220px] bg-black/20 p-2 border-r border-border-color flex-shrink-0 flex flex-col">
                <div className="space-y-4">
                     <div>
                        <h3 className="px-2 text-xs font-semibold text-white/50 mb-1">Cloud Drive</h3>
                         <ul className="space-y-1">
                            {folders.filter(f => f.parentId === 'root').map(folder => (
                                <li key={folder.id}>
                                     <button onClick={() => setCurrentFolderId(folder.id)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-white/10 ${currentFolderId === folder.id ? 'bg-brand-blue/50' : ''}`}>
                                        <i className="fi fi-rr-folder"/>
                                        <span className="truncate">{folder.name}</span>
                                     </button>
                                </li>
                            ))}
                         </ul>
                    </div>
                </div>
            </nav>

            <main className="flex-grow flex flex-col" onContextMenu={(e) => handleContextMenu(e, null)}>
                <header className="flex-shrink-0 p-3 border-b border-border-color flex items-center justify-between gap-4">
                    <div className="flex items-center text-sm">
                        {breadcrumbs.map((b, index) => (
                             <React.Fragment key={b.id}>
                                <button onClick={() => setCurrentFolderId(b.id)} className="hover:underline px-1 rounded-md hover:bg-white/10">{b.name}</button>
                                {index < breadcrumbs.length - 1 && <span className="mx-1 text-white/50">/</span>}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="relative w-1/3 min-w-[200px]">
                        <i className="fi fi-rr-search absolute left-3 top-1/2 -translate-y-1/2 text-white/50"></i>
                        <input type="search" placeholder="Search files..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 bg-white/5 border border-border-color rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"/>
                    </div>
                </header>
                <div className="p-3 flex-shrink-0 border-b border-border-color flex items-center gap-2">
                    <button onClick={handleCreateFolder} className="px-3 py-1.5 bg-white/10 text-sm rounded-md hover:bg-white/20 flex items-center gap-2"><i className="fi fi-rr-folder-add"></i> New Folder</button>
                    <div className="flex items-center bg-white/10 rounded-md p-0.5 ml-auto">
                        <button onClick={() => setViewMode('grid')} className={`p-1 rounded ${viewMode === 'grid' ? 'bg-brand-blue' : ''}`}><i className="fi fi-rr-grid"></i></button>
                        <button onClick={() => setViewMode('list')} className={`p-1 rounded ${viewMode === 'list' ? 'bg-brand-blue' : ''}`}><i className="fi fi-rr-list"></i></button>
                    </div>
                </div>

                <div className="flex-grow p-4 overflow-y-auto">
                    {viewMode === 'list' && (
                        <div className="flex flex-col">
                            <div className="flex items-center p-2 text-xs font-semibold text-white/60 border-b border-border-color">
                                <div className="w-2/5">Name</div><div className="w-1/5">Date Modified</div><div className="w-1/5">Type</div><div className="w-1/5 text-right">Size</div>
                            </div>
                            {currentItems.map(renderListItem)}
                        </div>
                    )}
                    {viewMode === 'grid' && <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">{currentItems.map(renderGridItem)}</div> }
                    {currentItems.length === 0 && <div className="flex items-center justify-center h-full text-white/50">This folder is empty.</div>}
                </div>
            </main>
            
            {previewItem && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in" onClick={() => setPreviewItem(null)}>
                    <div className="max-w-4xl max-h-[80vh] bg-canvas-bg rounded-lg shadow-lg relative p-4" onClick={e => e.stopPropagation()}>
                        {previewItem.type === 'image' && <img src={previewItem.url} alt={previewItem.name} className="max-w-full max-h-full object-contain"/>}
                        {previewItem.type === 'video' && <video src={previewItem.url} controls autoPlay className="max-w-full max-h-full"/>}
                        <button onClick={() => setPreviewItem(null)} className="absolute -top-3 -right-3 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"><i className="fi fi-rr-cross-small"></i></button>
                    </div>
                </div>
            )}
        </div>
    );
};