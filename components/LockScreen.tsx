import React, { useState, useEffect } from 'react';
import { UserProfileState } from '../types';
import { LockScreenAsciiBackground } from './LockScreenAsciiBackground';

interface LockScreenProps {
    onLogin: () => void;
    userProfile: UserProfileState;
    userPassword?: string;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onLogin, userProfile, userPassword }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === (userPassword || 'password')) {
            onLogin();
        } else {
            setError(true);
            setPassword('');
            setTimeout(() => setError(false), 500); // Reset error state for animation
        }
    };

    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    const formattedDate = time.toLocaleDateString(undefined, dateOptions);
    const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center relative bg-slate-900">
            <LockScreenAsciiBackground />
            <div className="absolute top-16 text-center text-white/90 z-10">
                <h1 className="text-8xl font-thin tracking-tighter">{formattedTime}</h1>
                <p className="text-xl font-medium mt-2">{formattedDate}</p>
            </div>
            
            <div className="w-full max-w-sm bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg p-8 animate-subtle-float z-10">
                <div className="text-center mb-6">
                    <img 
                        src={userProfile.avatar} 
                        alt="User Avatar" 
                        className="w-24 h-24 rounded-full mx-auto border-4 border-white/20 animate-pulse-glow"
                    />
                    <h2 className="text-2xl font-semibold mt-4 text-white">{userProfile.name}</h2>
                    <p className="text-sm text-white/60">Enter password to unlock</p>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="relative flex items-center">
                        <i className="fi fi-rr-lock absolute left-4 top-1/2 -translate-y-1/2 text-white/40"></i>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            autoFocus
                            className={`w-full pl-12 pr-12 py-3 bg-black/20 text-white rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-brand-blue transition-all ${error ? 'border-red-500 animate-shake' : 'border-white/20'}`}
                        />
                         <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-brand-blue rounded-full flex items-center justify-center text-white hover:bg-brand-blue-hover transition-colors">
                            <i className="fi fi-rr-arrow-right"></i>
                        </button>
                    </div>
                </form>
                {error && <p className="text-red-400 text-sm mt-3 text-center">Incorrect password. Hint: password</p>}
            </div>
        </div>
    );
};