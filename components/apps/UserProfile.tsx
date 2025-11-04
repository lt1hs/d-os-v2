

import React, { useState, useRef, useEffect } from 'react';
import { UserProfileState } from '../../types';

const StatCard: React.FC<{ value: string; label: string }> = ({ value, label }) => (
    <div className="bg-white/5 p-4 rounded-lg text-center">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-white/60">{label}</p>
    </div>
);

const ToggleSwitch: React.FC<{ label: string; enabled: boolean; onToggle: () => void }> = ({ label, enabled, onToggle }) => (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
        <span className="text-sm font-medium">{label}</span>
        <button
            role="switch"
            aria-checked={enabled}
            onClick={onToggle}
            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-brand-blue' : 'bg-gray-600'}`}
        >
            <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
    </div>
);

interface UserProfileProps {
    userProfile: UserProfileState;
    setUserProfile: React.Dispatch<React.SetStateAction<UserProfileState>>;
    setUserPassword: React.Dispatch<React.SetStateAction<string>>;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userProfile, setUserProfile, setUserPassword }) => {
    // Mock state for preferences
    const [notifications, setNotifications] = React.useState({ email: true, inApp: true });
    
    const [isEditing, setIsEditing] = useState(false);
    const [tempProfile, setTempProfile] = useState(userProfile);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Password change state
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        setTempProfile(userProfile);
    }, [userProfile]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setTempProfile(p => ({ ...p, avatar: event.target.result as string }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        setUserProfile(tempProfile);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTempProfile(userProfile);
        setIsEditing(false);
    };

    const handlePasswordChangeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        // Mock validation
        if (passwordData.current !== 'password') {
            setPasswordError('Incorrect current password.');
            return;
        }
        if (passwordData.new.length < 8) {
            setPasswordError('New password must be at least 8 characters long.');
            return;
        }
        if (passwordData.new !== passwordData.confirm) {
            setPasswordError('New passwords do not match.');
            return;
        }
        
        setUserPassword(passwordData.new); // Update password in App state
        setPasswordSuccess('Password changed successfully for this session!');
        setPasswordData({ current: '', new: '', confirm: '' });
        setTimeout(() => {
            setShowPasswordChange(false);
            setPasswordSuccess('');
        }, 2000);
    };

    return (
        <div className="h-full w-full bg-black/10 text-white/90 overflow-y-auto p-6">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="relative mb-4">
                        <img src={tempProfile.avatar} alt="User Avatar" className="w-24 h-24 rounded-full border-4 border-border-color" />
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                        {isEditing && (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 w-8 h-8 bg-brand-blue rounded-full flex items-center justify-center text-white hover:bg-brand-blue-hover"
                                aria-label="Change profile picture"
                            >
                                <i className="fi fi-rr-pencil"></i>
                            </button>
                        )}
                    </div>
                    {isEditing ? (
                        <input
                            type="text"
                            value={tempProfile.name}
                            onChange={(e) => setTempProfile(p => ({ ...p, name: e.target.value }))}
                            className="text-2xl font-bold bg-white/10 rounded-md text-center p-1 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-brand-blue"
                            autoFocus
                        />
                    ) : (
                        <h2 className="text-2xl font-bold">{userProfile.name}</h2>
                    )}
                    <p className="text-md text-white/70">Creative Director</p>
                    
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="mt-4 px-3 py-1 bg-white/10 text-xs font-semibold rounded-full hover:bg-white/20 transition-colors">Edit Profile</button>
                    ) : (
                         <div className="flex gap-2 mt-4">
                            <button onClick={handleSave} className="px-4 py-1 bg-brand-blue text-sm rounded-md hover:bg-brand-blue-hover">Save</button>
                            <button onClick={handleCancel} className="px-4 py-1 bg-white/10 text-sm rounded-md hover:bg-white/20">Cancel</button>
                        </div>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <StatCard value="128" label="Projects Created" />
                    <StatCard value="432" label="Tasks Completed" />
                </div>
                
                 {/* Storage */}
                <div className="mb-8">
                    <div className="flex justify-between items-center text-sm mb-2">
                        <h3 className="font-semibold">Storage Used</h3>
                        <span className="text-white/70">7.8 GB / 15 GB</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2.5">
                        <div className="bg-brand-blue h-2.5 rounded-full" style={{ width: '52%' }}></div>
                    </div>
                </div>

                {/* Settings */}
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Preferences</h3>
                        <div className="space-y-2">
                            <ToggleSwitch label="Email Notifications" enabled={notifications.email} onToggle={() => setNotifications(p => ({...p, email: !p.email}))} />
                            <ToggleSwitch label="In-App Notifications" enabled={notifications.inApp} onToggle={() => setNotifications(p => ({...p, inApp: !p.inApp}))} />
                        </div>
                    </div>
                    <div>
                         <h3 className="text-lg font-semibold mb-3">Account</h3>
                         <div className="space-y-2">
                             <button onClick={() => setShowPasswordChange(p => !p)} className="w-full text-left p-3 bg-white/5 rounded-lg text-sm font-medium hover:bg-white/10">Change Password</button>
                             {showPasswordChange && (
                                <form onSubmit={handlePasswordChangeSubmit} className="p-4 bg-white/5 rounded-lg space-y-3 animate-fade-in">
                                    <div>
                                        <label className="text-xs font-medium text-white/70">Current Password</label>
                                        <input type="password" value={passwordData.current} onChange={e => setPasswordData(p => ({...p, current: e.target.value}))} className="w-full mt-1 p-2 bg-white/10 border border-border-color rounded-md text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-white/70">New Password</label>
                                        <input type="password" value={passwordData.new} onChange={e => setPasswordData(p => ({...p, new: e.target.value}))} className="w-full mt-1 p-2 bg-white/10 border border-border-color rounded-md text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-white/70">Confirm New Password</label>
                                        <input type="password" value={passwordData.confirm} onChange={e => setPasswordData(p => ({...p, confirm: e.target.value}))} className="w-full mt-1 p-2 bg-white/10 border border-border-color rounded-md text-sm" />
                                    </div>
                                    {passwordError && <p className="text-xs text-red-400">{passwordError}</p>}
                                    {passwordSuccess && <p className="text-xs text-green-400">{passwordSuccess}</p>}
                                    <div className="flex gap-2 pt-2">
                                        <button type="submit" className="px-4 py-1.5 bg-brand-blue text-sm rounded-md hover:bg-brand-blue-hover">Save Changes</button>
                                        <button type="button" onClick={() => setShowPasswordChange(false)} className="px-4 py-1.5 bg-white/10 text-sm rounded-md hover:bg-white/20">Cancel</button>
                                    </div>
                                </form>
                             )}
                             <button className="w-full text-left p-3 bg-white/5 rounded-lg text-sm font-medium hover:bg-white/10">Customize Theme</button>
                             <button className="w-full text-left p-3 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20">Log Out</button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};