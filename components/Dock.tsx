

import React, { useState, useRef, useMemo } from 'react';
import { AppDefinition, ContextMenuItem } from '../types';
import { DockIcon } from './DockIcon';
import { AIStudioLogo, CloudFolder } from '../constants';

interface DockProps {
    apps: AppDefinition[];
    systemTools: AppDefinition[];
    onAppClick: (id: string) => void;
    openApps: string[];
    activeApp: string;
    minimizedApps: Set<string>;
    onStartClick: () => void;
    animatingIcon: string | null;
    dockSettings: {
        visibleApps: Record<string, boolean>;
        showSystemTools: boolean;
    };
    dockOrder: string[];
    pinnedFolders: CloudFolder[];
    onPinnedFolderClick: (folderId: string) => void;
    onCloseApp: (id: string) => void;
    onMinimizeApp: (id: string) => void;
    onTogglePin: (folderId: string) => void;
    setContextMenu: (menu: { x: number; y: number; items: ContextMenuItem[] } | null) => void;
}

const MAX_SCALE = 1.2;
const SPREAD = 80; // The spread of the magnification effect in pixels

export const Dock: React.FC<DockProps> = (props) => {
    const { 
        apps, systemTools, onAppClick, openApps, activeApp, minimizedApps, 
        onStartClick, animatingIcon, dockSettings, pinnedFolders, 
        onPinnedFolderClick, onCloseApp, onMinimizeApp, 
        onTogglePin, setContextMenu, dockOrder
    } = props;
    
    const dockRef = useRef<HTMLDivElement>(null);
    const [mouseX, setMouseX] = useState<number | null>(null);

    const visibleApps = useMemo(() => {
        const visibleAppIds = new Set(apps.filter(app => dockSettings.visibleApps[app.id]).map(app => app.id));
        const orderedVisibleAppIds = dockOrder.filter(id => visibleAppIds.has(id));
        return orderedVisibleAppIds.map(id => apps.find(app => app.id === id)).filter(Boolean) as AppDefinition[];
    }, [apps, dockSettings, dockOrder]);

    const visibleSystemTools = useMemo(() => systemTools.filter(tool => dockSettings.visibleApps[tool.id]), [systemTools, dockSettings]);

    const dockItems = useMemo(() => [
        ...visibleApps,
        ...(pinnedFolders.length > 0 ? [{ id: 'divider-1', isDivider: true }] : []),
        ...pinnedFolders.map(f => ({ ...f, isFolder: true, icon: <i className="fi fi-rr-folder" /> })),
        ...(dockSettings.showSystemTools && visibleSystemTools.length > 0 ? [{ id: 'divider-2', isDivider: true }] : []),
        ...(dockSettings.showSystemTools ? visibleSystemTools : []),
    ], [visibleApps, pinnedFolders, visibleSystemTools, dockSettings.showSystemTools]);
    
    const handleContextMenu = (e: React.MouseEvent, item: AppDefinition & { isFolder?: boolean }) => {
        e.preventDefault();
        e.stopPropagation();

        const items: ContextMenuItem[] = [];
        const isOpen = openApps.includes(item.id);
        const isMinimized = minimizedApps.has(item.id);
        const isActive = activeApp === item.id;

        if (item.isFolder) {
            items.push({ label: 'Open', action: () => onPinnedFolderClick(item.id), icon: <i className="fi fi-rr-folder-open" /> });
            items.push({ label: 'Unpin from Dock', action: () => onTogglePin(item.id), icon: <i className="fi fi-rr-thumbtack" /> });
        } else {
            if (!isOpen) {
                items.push({ label: 'Open', action: () => onAppClick(item.id), icon: <i className="fi fi-rr-play" /> });
            } else {
                if (isMinimized) {
                    items.push({ label: 'Show', action: () => onAppClick(item.id), icon: <i className="fi fi-rr-eye" /> });
                } else if (!isActive) {
                    items.push({ label: 'Bring to Front', action: () => onAppClick(item.id), icon: <i className="fi fi-rr-bring-front" /> });
                    items.push({ label: 'Minimize', action: () => onMinimizeApp(item.id), icon: <i className="fi fi-rr-compress-alt" /> });
                } else { // Is active and not minimized
                    items.push({ label: 'Minimize', action: () => onMinimizeApp(item.id), icon: <i className="fi fi-rr-compress-alt" /> });
                }
                items.push({ label: 'Close', action: () => onCloseApp(item.id), icon: <i className="fi fi-rr-cross-circle" /> });
            }
        }

        if (items.length > 0 && dockRef.current) {
            const dockRect = dockRef.current.getBoundingClientRect();
            
            // Estimate menu height to position it correctly above the dock
            const itemHeight = 30; // Approx height of a menu item in pixels
            const menuPadding = 8;
            const estimatedMenuHeight = (items.length * itemHeight) + menuPadding;
            
            const margin = 8;
            const yPos = dockRect.top - estimatedMenuHeight - margin;

            setContextMenu({ x: e.clientX, y: yPos, items });
        }
    };


    const handleMouseMove = (e: React.MouseEvent) => {
        if (dockRef.current) {
            const rect = dockRef.current.getBoundingClientRect();
            setMouseX(e.clientX - rect.left);
        }
    };

    const handleMouseLeave = () => {
        setMouseX(null);
    };

    const getIconScale = (index: number) => {
        if (mouseX === null) return 1;
        const iconSlotWidth = 48 + 4; // w-12 (48px) + space-x-1 (4px)
        const iconCenter = index * iconSlotWidth + (48 / 2);
        const distance = Math.abs(mouseX - iconCenter);
        const scale = 1 + (MAX_SCALE - 1) * Math.max(0, 1 - distance / SPREAD);
        return scale;
    };

    return (
        <footer 
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
            onContextMenu={(e) => e.stopPropagation()}
        >
            <div
                ref={dockRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="flex items-center h-14 p-1 bg-dock-bg backdrop-blur-xl rounded-3xl shadow-dock border border-border-color space-x-1"
            >
                {/* Start Button */}
                <DockIcon
                    app={{ id: 'start-menu', name: 'Start Menu', icon: <AIStudioLogo /> }}
                    onClick={onStartClick}
                    onContextMenu={(e) => e.preventDefault()}
                    scale={getIconScale(0)}
                    isAnimating={animatingIcon === 'start-menu'}
                />

                <div className="w-px h-8 bg-white/20 self-center mx-1" />

                {/* Main Icons */}
                {dockItems.map((item, index) => {
                    const itemIndex = index + 1; // Offset by 1 for start button
                    if ('isDivider' in item) {
                        return <div key={item.id} className="w-px h-8 bg-white/20 self-center mx-1" />;
                    }
                    
                    const app = item as AppDefinition & { isFolder?: boolean };

                    return (
                        <DockIcon
                            key={app.id}
                            app={app}
                            onClick={() => app.isFolder ? onPinnedFolderClick(app.id) : onAppClick(app.id)}
                            onContextMenu={(e) => handleContextMenu(e, app)}
                            isOpen={openApps.includes(app.id)}
                            isActive={activeApp === app.id}
                            isMinimized={minimizedApps.has(app.id)}
                            isAnimating={animatingIcon === app.id}
                            scale={getIconScale(itemIndex)}
                        />
                    );
                })}
            </div>
        </footer>
    );
};