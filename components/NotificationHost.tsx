
import React, { useState, useEffect } from 'react';
import { Notification } from '../types';

interface NotificationHostProps {
    notifications: Notification[];
    onDismiss: (id: number) => void;
}

const TOAST_TIMEOUT = 5000; // 5 seconds

interface Toast extends Notification {
    visible: boolean;
}

export const NotificationHost: React.FC<NotificationHostProps> = ({ notifications, onDismiss }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const unreadNotifications = notifications.filter(n => !n.read);
        
        unreadNotifications.forEach(n => {
            // Add if not already being shown
            if (!toasts.some(t => t.id === n.id)) {
                setToasts(prev => [...prev, { ...n, visible: true }]);

                // Auto-dismiss
                setTimeout(() => {
                    setToasts(currentToasts => currentToasts.map(t => t.id === n.id ? { ...t, visible: false } : t));
                    // Mark as read after animation
                    setTimeout(() => onDismiss(n.id), 300);
                }, TOAST_TIMEOUT);
            }
        });
        
    }, [notifications, onDismiss, toasts]);
    
    const visibleToasts = toasts.filter(t => t.visible);

    return (
        <div className="fixed top-12 right-4 z-50 flex flex-col items-end gap-2">
            {visibleToasts.slice(0, 3).map((toast) => ( // Show max 3 toasts
                <div
                    key={toast.id}
                    className={`w-80 p-3 bg-dock-bg backdrop-blur-xl rounded-lg shadow-lg border border-border-color transition-all duration-300 ease-out ${toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
                >
                    <p className="font-semibold text-sm">{toast.title}</p>
                    <p className="text-sm text-white/70 mt-1">{toast.message}</p>
                </div>
            ))}
        </div>
    );
};
