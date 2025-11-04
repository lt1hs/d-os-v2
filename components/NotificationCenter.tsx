
import React, { useEffect, useRef } from 'react';
import { Notification } from '../types';

interface NotificationCenterProps {
    notifications: Notification[];
    onClose: () => void;
    onMarkAsRead: (id: number) => void;
    onClearAll: () => void;
    onMarkAllAsRead: () => void;
}

const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onClose, onMarkAsRead, onClearAll, onMarkAllAsRead }) => {
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                const topBar = document.querySelector('.fixed.top-0');
                 if (topBar && topBar.contains(event.target as Node)) {
                    return;
                }
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);
    
    useEffect(() => {
        onMarkAllAsRead();
    }, [onMarkAllAsRead]);

    return (
        <div
            ref={panelRef}
            className="absolute top-12 right-4 w-80 max-w-sm bg-dock-bg backdrop-blur-xl rounded-lg shadow-lg border border-border-color z-50 flex flex-col animate-fade-in"
            style={{ maxHeight: 'calc(100vh - 5rem)' }}
        >
            <header className="flex-shrink-0 flex items-center justify-between p-3 border-b border-border-color">
                <h3 className="font-semibold">Notifications</h3>
                <button onClick={onClearAll} className="text-xs text-blue-400 hover:underline">Clear All</button>
            </header>
            <main className="flex-grow overflow-y-auto">
                {notifications.length === 0 ? (
                    <p className="p-6 text-center text-sm text-white/50">No new notifications.</p>
                ) : (
                    <div className="divide-y divide-border-color">
                        {notifications.map(n => (
                            <div key={n.id} className={`p-3 transition-colors ${n.read ? 'opacity-60' : 'bg-brand-blue/10'}`}>
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold text-sm">{n.title}</p>
                                    <span className="text-xs text-white/50 flex-shrink-0 ml-2">{timeAgo(n.timestamp)}</span>
                                </div>
                                <p className="text-sm text-white/70 mt-1">{n.message}</p>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
