
import React, { useState, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { TenantUser } from '../admin-common/types.ts';

// Mock Data
const mockUsers: TenantUser[] = [
    { id: 'u1', name: 'Admin User', email: 'admin@company.com', role: 'Admin', status: 'Active', avatar: 'https://i.pravatar.cc/100?u=admin' },
    { id: 'u2', name: 'Jane Doe', email: 'jane.d@company.com', role: 'Editor', status: 'Active', avatar: 'https://i.pravatar.cc/100?u=jane' },
    { id: 'u3', name: 'John Smith', email: 'john.s@company.com', role: 'Viewer', status: 'Invited', avatar: 'https://i.pravatar.cc/100?u=john' },
    { id: 'u4', name: 'Peter Jones', email: 'peter.j@company.com', role: 'Editor', status: 'Deactivated', avatar: 'https://i.pravatar.cc/100?u=peter' },
];

type Category = 'dashboard' | 'users' | 'branding' | 'billing';

const NavButton: React.FC<{ category: Category; icon: React.ReactNode; label: string; isActive: boolean; onClick: (category: Category) => void; }> = 
({ category, icon, label, isActive, onClick }) => (
    <button onClick={() => onClick(category)} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors text-sm font-medium ${isActive ? 'bg-[var(--accent-color)] text-white' : 'text-slate-300 hover:bg-white/10'}`}>
        {icon}
        <span>{label}</span>
    </button>
);

const StatCard: React.FC<{ value: string; label: string; icon: React.ReactNode }> = ({ value, label, icon }) => (
    <div className="bg-slate-800/50 p-4 rounded-lg flex items-center gap-4 border border-slate-700">
        <div className="w-10 h-10 flex items-center justify-center bg-blue-500/20 text-blue-400 rounded-lg text-xl">{icon}</div>
        <div>
            <p className="text-2xl font-bold text-slate-100">{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
        </div>
    </div>
);

const CompanyAdminPanel: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<Category>('dashboard');
    const [branding, setBranding] = useState({ name: 'Innovate Inc.', logo: '', color: '#3b82f6' });
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [users, setUsers] = useState<TenantUser[]>(mockUsers);
    
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setBranding(b => ({ ...b, logo: reader.result as string }));
            reader.readAsDataURL(file);
        }
    };

    const renderContent = () => {
        switch (activeCategory) {
            case 'users':
                return (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">User Management</h2>
                            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700">Invite User</button>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/5 text-xs uppercase text-slate-400">
                                    <tr>
                                        <th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id} className="border-t border-slate-700">
                                            <td className="p-3 flex items-center gap-3"><img src={user.avatar} className="w-8 h-8 rounded-full" /><div><p className="font-semibold">{user.name}</p><p className="text-xs text-slate-400">{user.email}</p></div></td>
                                            <td className="p-3">{user.role}</td>
                                            <td className="p-3"><span className={`px-2 py-0.5 text-xs rounded-full ${user.status === 'Active' ? 'bg-green-500/20 text-green-400' : user.status === 'Invited' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>{user.status}</span></td>
                                            <td className="p-3 text-right"><button className="p-1 rounded-full hover:bg-white/10"><i className="fi fi-rr-menu-dots-vertical"></i></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'branding':
                return (
                    <div className="animate-fade-in max-w-lg">
                        <h2 className="text-2xl font-bold mb-6">White-Label Branding</h2>
                        <div className="space-y-6 bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                            <div>
                                <label className="text-sm font-medium text-slate-300">Company Name</label>
                                <input type="text" value={branding.name} onChange={e => setBranding(b => ({ ...b, name: e.target.value }))} className="w-full mt-1 p-2 bg-slate-700/50 border border-slate-600 rounded-md text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300">Company Logo</label>
                                <div className="mt-1 flex items-center gap-4">
                                    <div className="w-16 h-16 bg-black/20 rounded-md flex items-center justify-center border border-slate-600">
                                        {branding.logo ? <img src={branding.logo} className="max-w-full max-h-full" /> : <i className="fi fi-rr-picture text-2xl text-slate-500" />}
                                    </div>
                                    <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                                    <button onClick={() => logoInputRef.current?.click()} className="px-3 py-1.5 border border-slate-600 text-xs rounded-md hover:bg-white/10">Upload Logo</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300">Primary Color</label>
                                <div className="flex items-center gap-3 mt-1">
                                    <input type="color" value={branding.color} onChange={e => setBranding(b => ({ ...b, color: e.target.value }))} className="w-12 h-10 p-1 bg-slate-700/50 border border-slate-600 rounded-md"/>
                                    <span className="font-mono text-sm text-slate-400">{branding.color}</span>
                                </div>
                            </div>
                            <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700">Save Branding</button>
                        </div>
                    </div>
                );
            case 'billing':
                return(
                    <div className="animate-fade-in max-w-lg">
                        <h2 className="text-2xl font-bold mb-6">Billing & Subscription</h2>
                        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-slate-400">Current Plan</p>
                                    <p className="text-xl font-bold text-white">Enterprise</p>
                                </div>
                                <span className="px-3 py-1 text-sm rounded-full bg-green-500/20 text-green-400">Active</span>
                            </div>
                            <p className="text-sm text-slate-400 mt-4">Your plan renews on July 31, 2024.</p>
                            <div className="flex gap-4 mt-6">
                                <button className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700">Upgrade Plan</button>
                                <button className="flex-1 px-4 py-2 bg-white/10 text-white text-sm font-semibold rounded-md hover:bg-white/20">Manage Billing</button>
                            </div>
                        </div>
                    </div>
                );
            case 'dashboard':
            default:
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Company Dashboard</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard value={users.length.toString()} label="Total Users" icon={<i className="fi fi-rr-users" />} />
                            <StatCard value={users.filter(u=>u.status === 'Active').length.toString()} label="Active Users" icon={<i className="fi fi-rr-user-check" />} />
                            <StatCard value="128" label="Projects Created" icon={<i className="fi fi-rr-briefcase" />} />
                            <StatCard value="7.8 GB" label="Storage Used" icon={<i className="fi fi-rr-database" />} />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-screen w-screen">
            <nav className="w-64 flex-shrink-0 bg-slate-900/70 p-4 border-r border-slate-700 flex flex-col">
                <div className="flex items-center gap-2 mb-8">
                    {branding.logo ? <img src={branding.logo} className="w-8 h-8 rounded-md" /> : <div className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg text-xl"><i className="fi fi-rr-building"/></div> }
                    <h1 className="text-lg font-bold text-slate-100">{branding.name}</h1>
                </div>
                <div className="flex flex-col gap-1">
                    <NavButton category="dashboard" icon={<i className="fi fi-rr-dashboard w-5 h-5" />} label="Dashboard" isActive={activeCategory === 'dashboard'} onClick={setActiveCategory} />
                    <NavButton category="users" icon={<i className="fi fi-rr-users w-5 h-5" />} label="Users" isActive={activeCategory === 'users'} onClick={setActiveCategory} />
                    <NavButton category="branding" icon={<i className="fi fi-rr-palette w-5 h-5" />} label="Branding" isActive={activeCategory === 'branding'} onClick={setActiveCategory} />
                    <NavButton category="billing" icon={<i className="fi fi-rr-credit-card w-5 h-5" />} label="Billing" isActive={activeCategory === 'billing'} onClick={setActiveCategory} />
                </div>
                 <div className="mt-auto">
                     <button className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-sm font-medium text-slate-300 hover:bg-white/10">
                        <i className="fi fi-rr-sign-out-alt w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </nav>
            <main className="flex-1 p-8 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");
const root = ReactDOM.createRoot(rootElement);
root.render(<React.StrictMode><CompanyAdminPanel /></React.StrictMode>);
