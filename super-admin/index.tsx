
import React, { useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { Company } from '../admin-common/types.ts';

// Mock Data
const mockCompanies: Company[] = [
    { id: 'c1', name: 'Innovate Inc.', status: 'Active', plan: 'Enterprise', userCount: 25, domain: 'innovate.com', joinedDate: '2023-01-15' },
    { id: 'c2', name: 'Creative Solutions', status: 'Active', plan: 'Pro', userCount: 10, domain: 'creativesolutions.dev', joinedDate: '2023-03-22' },
    { id: 'c3', name: 'Data Corp', status: 'Suspended', plan: 'Basic', userCount: 5, domain: 'datacorp.io', joinedDate: '2023-05-10' },
    { id: 'c4', name: 'NextGen Media', status: 'Trial', plan: 'Pro', userCount: 8, domain: 'nextgen.media', joinedDate: '2023-06-01' },
];

type Category = 'dashboard' | 'companies' | 'billing' | 'settings';

const NavButton: React.FC<{ category: Category; icon: React.ReactNode; label: string; isActive: boolean; onClick: (category: Category) => void; }> = 
({ category, icon, label, isActive, onClick }) => (
    <button onClick={() => onClick(category)} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors text-sm font-medium ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>
        {icon}
        <span>{label}</span>
    </button>
);

const StatCard: React.FC<{ value: string; label: string; icon: React.ReactNode }> = ({ value, label, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-3xl font-bold text-slate-800">{value}</p>
                <p className="text-sm text-slate-500 mt-1">{label}</p>
            </div>
            <div className="w-10 h-10 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-lg text-xl">{icon}</div>
        </div>
    </div>
);

const SuperAdminPanel: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<Category>('dashboard');
    const [companies, setCompanies] = useState<Company[]>(mockCompanies);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCompanies = useMemo(() => 
        companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [companies, searchTerm]
    );

    const renderContent = () => {
        switch (activeCategory) {
            case 'companies':
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">Companies</h2>
                            <div className="flex items-center gap-4">
                                <input type="text" placeholder="Search companies..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-md text-sm w-64"/>
                                <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700">Add Company</button>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm text-left text-slate-600">
                                <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                    <tr>
                                        <th className="p-4">Company</th>
                                        <th className="p-4">Plan</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Users</th>
                                        <th className="p-4">Joined Date</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCompanies.map(company => (
                                        <tr key={company.id} className="border-t border-slate-200">
                                            <td className="p-4 font-semibold text-slate-800">{company.name}</td>
                                            <td className="p-4">{company.plan}</td>
                                            <td className="p-4"><span className={`px-2 py-0.5 text-xs rounded-full ${company.status === 'Active' ? 'bg-green-100 text-green-700' : company.status === 'Trial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{company.status}</span></td>
                                            <td className="p-4">{company.userCount}</td>
                                            <td className="p-4">{company.joinedDate}</td>
                                            <td className="p-4 text-right"><button className="p-1 rounded-full hover:bg-slate-200"><i className="fi fi-rr-menu-dots-vertical"></i></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'dashboard':
            default:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard value={companies.length.toString()} label="Total Companies" icon={<i className="fi fi-rr-building" />} />
                            <StatCard value={companies.filter(c => c.status === 'Active').length.toString()} label="Active Subscriptions" icon={<i className="fi fi-rr-check-circle" />} />
                            <StatCard value="$12,450" label="MRR" icon={<i className="fi fi-rr-stats" />} />
                            <StatCard value="2" label="Pending Trials" icon={<i className="fi fi-rr-user-clock" />} />
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-screen w-screen bg-slate-100">
            <nav className="w-64 flex-shrink-0 bg-white p-4 border-r border-slate-200 flex flex-col">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-lg text-xl"><i className="fi fi-rr-shield-interrogation"/></div>
                    <h1 className="text-lg font-bold text-slate-800">Super Admin</h1>
                </div>
                <div className="flex flex-col gap-1">
                    <NavButton category="dashboard" icon={<i className="fi fi-rr-dashboard w-5 h-5" />} label="Dashboard" isActive={activeCategory === 'dashboard'} onClick={setActiveCategory} />
                    <NavButton category="companies" icon={<i className="fi fi-rr-building w-5 h-5" />} label="Companies" isActive={activeCategory === 'companies'} onClick={setActiveCategory} />
                    <NavButton category="billing" icon={<i className="fi fi-rr-credit-card w-5 h-5" />} label="Billing" isActive={activeCategory === 'billing'} onClick={setActiveCategory} />
                    <NavButton category="settings" icon={<i className="fi fi-rr-settings-sliders w-5 h-5" />} label="Settings" isActive={activeCategory === 'settings'} onClick={setActiveCategory} />
                </div>
                <div className="mt-auto">
                     <button className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-sm font-medium text-slate-500 hover:bg-slate-200">
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
root.render(<React.StrictMode><SuperAdminPanel /></React.StrictMode>);
