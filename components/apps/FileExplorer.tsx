import React, { useState, useMemo } from 'react';
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

const FileTypeIcon: React.FC<{ type: FileType | 'folder' }> = ({ type }) => {
    switch (type) {
        case 'folder': return <i className="fi fi-rr-folder text-amber-400 text-3xl"></i>;
        case 'image': return <i className="fi fi-rr-picture text-purple-400 text-3xl"></i>;
        case 'video': return <i className="fi fi-rr-film text-red-400 text-3xl"></i>;
        case 'document': return <i className="fi fi-rr-document text-blue-400 text-3xl"></i>;
        default: return <i className="fi fi-rr-file text-gray-400 text-3xl"></i>;
    }
};

// FIX: Added a type guard function to reliably distinguish CloudFile from CloudFolder.
const isCloudFile = (item: CloudFile | CloudFolder): item is CloudFile => {
    return 'size' in item;
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ setContextMenu, pinnedFolders, onTogglePin }) => {
    const [currentFolderId, setCurrentFolderId] = useState('root');
    const [searchQuery, setSearchQuery] = useState('');

    const currentItems = useMemo(() => {
        const foldersInCurrent = mockFolders.filter(f => f.parentId === currentFolderId);
        const filesInCurrent = mockFiles.filter(f => f.parentId === currentFolderId);
        const allItems = [...foldersInCurrent, ...filesInCurrent];
        
        if (!searchQuery) return allItems;

        return allItems.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

    }, [currentFolderId, searchQuery]);

    const getBreadcrumbs = (folderId: string) => {
        const path = [];
        let current = mockFolders.find(f => f.id === folderId);
        while (current) {
            path.unshift(current);
            current = mockFolders.find(f => f.id === current?.parentId);
        }
        return path;
    };
    
    const breadcrumbs = getBreadcrumbs(currentFolderId);

    const handleContextMenu = (e: React.MouseEvent, item: CloudFile | CloudFolder | null) => {
        e.preventDefault();
        e.stopPropagation();
        
        let menuItems: ContextMenuItem[] = [];

        if (item) {
            // FIX: Used the isCloudFile type guard for robust type checking. This also implicitly handles the null case for `item`.
            const isFolder = !isCloudFile(item);
            const isPinned = isFolder && pinnedFolders.includes(item.id);

             menuItems = [
                { label: 'Open', action: () => isFolder ? setCurrentFolderId(item.id) : alert(`Open preview for ${item.name}`), icon: <i className="fi fi-rr-folder-open" /> },
             ];
            if (isFolder) {
                 menuItems.push({ 
                    label: isPinned ? 'Unpin from Dock' : 'Pin to Dock', 
                    action: () => onTogglePin(item.id),
                    icon: <i className="fi fi-rr-thumbtack" />
                });
            }
            menuItems.push({ label: 'Get Info', action: () => alert(`Info for ${item.name}`), icon: <i className="fi fi-rr-info" /> });
            menuItems.push({ label: 'Delete', action: () => alert(`Deleting ${item.name}`), icon: <i className="fi fi-rr-trash" /> });

        } else { // background
            menuItems = [
                { label: 'New Folder', action: () => alert('Creating new folder'), icon: <i className="fi fi-rr-folder-add" /> },
            ];
        }
        setContextMenu({ x: e.clientX, y: e.clientY, items: menuItems });
    };

    return (
        <div className="flex h-full bg-black/10 text-white/90 rounded-b-lg">
            {/* Sidebar */}
            <nav className="w-1/4 min-w-[220px] bg-black/20 p-2 border-r border-border-color flex-shrink-0 flex flex-col">
                <div className="space-y-4">
                    <div>
                        <h3 className="px-2 text-xs font-semibold text-white/50 mb-1">Quick Access</h3>
                        <ul className="space-y-1">
                            <li><button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-white/10"><i className="fi fi-rr-star text-yellow-400"/>Favorites</button></li>
                            <li><button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-white/10"><i className="fi fi-rr-clock text-blue-400"/>Recent Files</button></li>
                        </ul>
                    </div>
                    <div>
                         <h3 className="px-2 text-xs font-semibold text-white/50 mb-1">Cloud Drive</h3>
                         <ul className="space-y-1">
                            {mockFolders.filter(f=>f.parentId === 'root').map(folder => (
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

            {/* Main Content */}
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
                <div className="flex-grow p-4 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {currentItems.map(item => (
                            <div 
                                key={item.id} 
                                onContextMenu={(e) => handleContextMenu(e, item)} 
                                // FIX: Use the isCloudFile type guard for robust type checking.
                                onDoubleClick={() => isCloudFile(item) ? alert(`Previewing ${item.name}`) : setCurrentFolderId(item.id)}
                                className="bg-white/5 p-3 rounded-lg flex flex-col gap-2 cursor-pointer hover:bg-white/10 transition-colors border border-transparent hover:border-border-color"
                            >
                                <div className="flex items-start justify-between">
                                    {/* FIX: Use the isCloudFile type guard to correctly narrow the item type and access type-specific properties, resolving the type error. */}
                                    {isCloudFile(item) ? <FileTypeIcon type={item.type} /> : <FileTypeIcon type="folder" />}
                                    <SyncStatusIcon status={item.syncStatus} />
                                </div>
                                <div className="flex-grow">
                                    <p className="text-sm font-medium break-all line-clamp-2">{item.name}</p>
                                </div>
                                {/* FIX: Use the isCloudFile type guard for safe access to properties that only exist on CloudFile, resolving the type error. */}
                                {isCloudFile(item) ? <p className="text-xs text-white/50">{item.size} &bull; {item.modified}</p> : null}
                            </div>
                        ))}
                    </div>
                    {currentItems.length === 0 && (
                        <div className="flex items-center justify-center h-full text-white/50">This folder is empty.</div>
                    )}
                </div>
            </main>
        </div>
    );
};