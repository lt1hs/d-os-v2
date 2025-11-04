import React, { useState } from 'react';
import { Project, AppDefinition } from '../types';

interface ProjectSelectionScreenProps {
    projects: Project[];
    onCreate: (name: string) => void;
    onOpen: (projectId: string) => void;
    onDelete: (projectId: string) => void;
    appDefinition: AppDefinition;
}

const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};


export const ProjectSelectionScreen: React.FC<ProjectSelectionScreenProps> = ({ projects, onCreate, onOpen, onDelete, appDefinition }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    const handleCreate = () => {
        if (newProjectName.trim()) {
            onCreate(newProjectName.trim());
            setIsCreating(false);
            setNewProjectName('');
        }
    };
    
    const handleDelete = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        onDelete(projectId);
        setShowDeleteConfirm(null);
    };

    const openCreateModal = () => {
        setNewProjectName(`Untitled ${appDefinition.name} Project`);
        setIsCreating(true);
    };

    return (
        <div className="w-full h-full flex flex-col p-8 bg-black/20 relative">
            <header className="flex-shrink-0 mb-8">
                <div className="flex items-center gap-3">
                    <div className="text-3xl text-brand-blue">{appDefinition.icon}</div>
                    <h1 className="text-3xl font-bold">{appDefinition.name}</h1>
                </div>
                <p className="text-white/60 mt-1">Select a project to continue or create a new one.</p>
            </header>
            <main className="flex-grow overflow-y-auto pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {/* Create New Project Card */}
                    <button
                        onClick={openCreateModal}
                        className="aspect-video bg-white/5 rounded-lg border-2 border-dashed border-border-color flex flex-col items-center justify-center text-white/60 hover:border-brand-blue hover:text-white transition-colors"
                    >
                        <i className="fi fi-rr-add text-4xl"></i>
                        <span className="mt-2 font-semibold">New Project</span>
                    </button>

                    {/* Existing Project Cards */}
                    {projects.sort((a,b) => b.lastModified - a.lastModified).map(project => (
                        <div
                            key={project.id}
                            onClick={() => onOpen(project.id)}
                            className="aspect-video bg-white/5 rounded-lg border border-border-color flex flex-col justify-between p-4 cursor-pointer hover:border-brand-blue transition-colors relative group"
                        >
                            <div className="flex-grow flex items-center justify-center">
                                {project.thumbnail ? (
                                    <img src={project.thumbnail} className="max-w-full max-h-full object-contain" alt={project.name} />
                                ) : (
                                     <div className="text-4xl opacity-30">{appDefinition.icon}</div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold truncate">{project.name}</h3>
                                <p className="text-xs text-white/50">Modified {timeAgo(project.lastModified)}</p>
                            </div>
                            
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(project.id); }}
                                className="absolute top-2 right-2 w-7 h-7 bg-gray-800/80 rounded-full flex items-center justify-center text-white/70 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-opacity"
                            >
                                <i className="fi fi-rr-trash"></i>
                            </button>
                            
                             {showDeleteConfirm === project.id && (
                                <div onClick={e => e.stopPropagation()} className="absolute inset-0 bg-gray-900/90 rounded-lg flex flex-col items-center justify-center p-2 text-center animate-fade-in">
                                    <p className="text-sm font-semibold">Delete project?</p>
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={(e) => handleDelete(e, project.id)} className="px-3 py-1 bg-red-600 text-xs rounded">Delete</button>
                                        <button onClick={() => setShowDeleteConfirm(null)} className="px-3 py-1 bg-white/20 text-xs rounded">Cancel</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </main>
            {isCreating && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center animate-fade-in" onClick={() => setIsCreating(false)}>
                    <div className="bg-window-bg p-6 rounded-lg shadow-lg border border-border-color w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold mb-4">Create New Project</h2>
                        <label htmlFor="projectName" className="text-sm text-white/70">Project Name</label>
                        <input
                            id="projectName"
                            type="text"
                            value={newProjectName}
                            onChange={e => setNewProjectName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            className="w-full mt-1 p-2 bg-white/5 border border-border-color rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 bg-white/10 text-sm rounded-md hover:bg-white/20"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                className="px-4 py-2 bg-brand-blue text-sm rounded-md hover:bg-brand-blue-hover"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};