import React, { useState, useMemo, useRef, useEffect } from 'react';

type Subtask = { id: number; text: string; completed: boolean };
type Attachment = { id: number; name: string; url: string; type: string };
type Collaborator = { id: string; name: string; avatarUrl: string };

type Task = {
  id: number;
  text: string;
  completed: boolean;
  subtasks: Subtask[];
  dueDate: string | null;
  reminder: string | null;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  files: Attachment[];
  notes: string;
  collaborators: Collaborator[];
};

const initialTasks: Task[] = [
    { 
        id: 1, text: 'Design new social media campaign visuals', completed: false,
        subtasks: [{ id: 1, text: 'Create moodboard', completed: true }, { id: 2, text: 'Draft 3 concepts', completed: false }],
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reminder: '1 day before', repeat: 'none', files: [], notes: 'Focus on a vibrant and energetic theme for the upcoming summer collection.',
        collaborators: [{id: 'jane', name: 'Jane Doe', avatarUrl: 'https://i.pravatar.cc/100?u=jane'}]
    },
    { 
        id: 2, text: 'Write blog post about AI in video production', completed: true,
        subtasks: [], dueDate: null, reminder: null, repeat: 'none', files: [], notes: '', collaborators: []
    },
    { 
        id: 3, text: 'Schedule next week\'s content for Instagram', completed: false,
        subtasks: [], dueDate: null, reminder: null, repeat: 'weekly', files: [], notes: 'Remember to use the new hashtag strategy discussed in the meeting.', collaborators: []
    },
];

type Filter = 'all' | 'active' | 'completed';

export const ToDo: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>(() => {
        try {
            const savedTasks = localStorage.getItem('ai-studio-tasks');
            if (savedTasks) {
                return JSON.parse(savedTasks);
            }
        } catch (error) {
            console.error("Failed to parse tasks from localStorage", error);
        }
        return initialTasks;
    });

    const [newTaskText, setNewTaskText] = useState('');
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(tasks.length > 0 ? tasks[0].id : null);
    const [filter, setFilter] = useState<Filter>('all');
    const [newSubtaskText, setNewSubtaskText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        try {
            localStorage.setItem('ai-studio-tasks', JSON.stringify(tasks));
        } catch (error) {
            console.error("Failed to save tasks to localStorage", error);
        }
    }, [tasks]);

    const selectedTask = useMemo(() => tasks.find(t => t.id === selectedTaskId), [tasks, selectedTaskId]);

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskText.trim() === '') return;
        const newTask: Task = {
            id: Date.now(), text: newTaskText, completed: false, subtasks: [],
            dueDate: null, reminder: null, repeat: 'none', files: [], notes: '', collaborators: []
        };
        setTasks([newTask, ...tasks]);
        setNewTaskText('');
    };
    
    const updateTask = (id: number, updates: Partial<Task>) => {
        setTasks(tasks.map(task => task.id === id ? { ...task, ...updates } : task));
    };

    const handleDeleteTask = (id: number) => {
        setTasks(tasks.filter(task => task.id !== id));
        if (selectedTaskId === id) {
            setSelectedTaskId(null);
        }
    };

    const handleClearCompleted = () => {
        setTasks(tasks.filter(task => !task.completed));
        if (selectedTask && selectedTask.completed) {
            setSelectedTaskId(null);
        }
    };

    const filteredTasks = useMemo(() => {
        switch (filter) {
            case 'active': return tasks.filter(task => !task.completed);
            case 'completed': return tasks.filter(task => !task.completed);
            default: return tasks;
        }
    }, [tasks, filter]);

    const activeTasksCount = useMemo(() => tasks.filter(task => !task.completed).length, [tasks]);

    const renderTaskDetails = () => {
        if (!selectedTask) {
            return <div className="flex items-center justify-center h-full text-white/50 p-6 text-center">Select a task to see its details.</div>;
        }

        const handleAddSubtask = () => {
            if (newSubtaskText.trim() === '') return;
            const newSubtask: Subtask = { id: Date.now(), text: newSubtaskText, completed: false };
            updateTask(selectedTask.id, { subtasks: [...selectedTask.subtasks, newSubtask] });
            setNewSubtaskText('');
        };
        
        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) {
                const file = e.target.files[0];
                const newAttachment: Attachment = { id: Date.now(), name: file.name, url: URL.createObjectURL(file), type: file.type };
                updateTask(selectedTask.id, { files: [...selectedTask.files, newAttachment] });
            }
        };

        return (
            <div className="h-full overflow-y-auto p-4 space-y-6">
                <div className="flex items-start gap-3">
                    <input type="checkbox" checked={selectedTask.completed} onChange={() => updateTask(selectedTask.id, { completed: !selectedTask.completed })} className="w-5 h-5 mt-1 bg-white/10 border-border-color text-brand-blue rounded focus:ring-brand-blue form-checkbox flex-shrink-0" />
                    <textarea value={selectedTask.text} onChange={(e) => updateTask(selectedTask.id, { text: e.target.value })} className="w-full text-lg font-semibold bg-transparent resize-none focus:outline-none focus:bg-white/5 p-1 rounded" rows={2}/>
                </div>
                <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-white/80">Subtasks</h3>
                    {selectedTask.subtasks.map(st => (
                        <div key={st.id} className="flex items-center gap-2 p-1 rounded hover:bg-white/5">
                            <input type="checkbox" checked={st.completed} onChange={() => updateTask(selectedTask.id, { subtasks: selectedTask.subtasks.map(s => s.id === st.id ? {...s, completed: !s.completed} : s)})} className="w-4 h-4 form-checkbox" />
                            <span className={`flex-grow text-sm ${st.completed ? 'line-through text-white/50' : ''}`}>{st.text}</span>
                        </div>
                    ))}
                    <div className="flex gap-2">
                        <input type="text" value={newSubtaskText} onChange={e => setNewSubtaskText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddSubtask()} placeholder="Add a subtask..." className="w-full px-2 py-1 bg-white/5 border border-border-color rounded-md text-sm"/>
                        <button onClick={handleAddSubtask} className="px-3 bg-white/10 rounded-md text-sm hover:bg-white/20">Add</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-medium text-white/60">Due Date</label>
                        <input type="date" value={selectedTask.dueDate || ''} onChange={e => updateTask(selectedTask.id, { dueDate: e.target.value })} className="w-full mt-1 p-1.5 bg-white/5 border border-border-color rounded-md text-sm"/>
                    </div>
                     <div>
                        <label className="text-xs font-medium text-white/60">Repeat</label>
                        <select value={selectedTask.repeat} onChange={e => updateTask(selectedTask.id, { repeat: e.target.value as Task['repeat'] })} className="w-full mt-1 p-1.5 bg-white/5 border border-border-color rounded-md text-sm">
                            <option value="none">None</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                        </select>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-sm mb-2 text-white/80">Attachments</h3>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 p-2 text-center bg-white/10 text-xs rounded-md hover:bg-white/20"><i className="fi fi-rr-clip"></i> Add File</button>
                </div>
                <div>
                    <h3 className="font-semibold text-sm mb-2 text-white/80">Notes</h3>
                    <textarea value={selectedTask.notes} onChange={e => updateTask(selectedTask.id, { notes: e.target.value })} placeholder="Add notes..." className="w-full h-24 p-2 bg-white/5 border border-border-color rounded-md text-sm resize-none" />
                </div>
                 <div>
                    <h3 className="font-semibold text-sm mb-2 text-white/80">Collaborators</h3>
                    <div className="flex items-center gap-2">
                        {selectedTask.collaborators.map(c => <img key={c.id} src={c.avatarUrl} title={c.name} className="w-8 h-8 rounded-full" />)}
                        <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-lg hover:bg-white/20">+</button>
                    </div>
                </div>
            </div>
        );
    };
    
    const FilterButton: React.FC<{ filterType: Filter, text: string }> = ({ filterType, text }) => (
        <button onClick={() => setFilter(filterType)} className={`px-3 py-1 text-sm rounded-md transition-colors ${filter === filterType ? 'text-brand-blue font-semibold' : 'text-white/60 hover:text-white'}`}>{text}</button>
    );

    return (
        <div className="flex h-full w-full bg-black/10 text-white/90">
            <div className="w-1/3 min-w-[300px] flex flex-col border-r border-border-color">
                <header className="p-4 border-b border-border-color flex-shrink-0">
                    <form onSubmit={handleAddTask}>
                        <input type="text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} placeholder="Add a new task..." className="w-full px-3 py-2 bg-white/5 border border-border-color rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                    </form>
                </header>
                <main className="flex-grow overflow-y-auto">
                    {filteredTasks.length > 0 ? (
                        <ul>
                            {filteredTasks.map(task => (
                                <li key={task.id} onClick={() => setSelectedTaskId(task.id)} className={`flex items-start gap-3 px-4 py-3 border-b border-border-color cursor-pointer ${selectedTaskId === task.id ? 'bg-brand-blue/20' : 'hover:bg-white/5'}`}>
                                    <input type="checkbox" checked={task.completed} onChange={() => updateTask(task.id, { completed: !task.completed })} onClick={e => e.stopPropagation()} className="w-5 h-5 mt-0.5 form-checkbox bg-white/10 border-border-color text-brand-blue rounded focus:ring-brand-blue flex-shrink-0" />
                                    <div className="flex-grow">
                                        <p className={`${task.completed ? 'line-through text-white/50' : ''}`}>{task.text}</p>
                                        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-white/50">
                                            {task.dueDate && <span className="flex items-center gap-1"><i className="fi fi-rr-calendar"></i>{new Date(task.dueDate).toLocaleDateString()}</span>}
                                            {task.subtasks.length > 0 && <span className="flex items-center gap-1"><i className="fi fi-rr-check-circle"></i>{task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}</span>}
                                            {task.files.length > 0 && <span className="flex items-center gap-1"><i className="fi fi-rr-clip"></i>{task.files.length}</span>}
                                        </div>
                                    </div>
                                    <button onClick={e => {e.stopPropagation(); handleDeleteTask(task.id);}} className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-red-500/20 text-white/60 hover:text-red-400"><i className="fi fi-rr-trash"></i></button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center p-4 text-white/50">No tasks here!</p>
                    )}
                </main>
                 <footer className="p-2 border-t border-border-color flex items-center justify-between text-sm text-white/60 flex-shrink-0">
                    <span>{activeTasksCount} {activeTasksCount === 1 ? 'item' : 'items'} left</span>
                    <div className="flex gap-1">
                        <FilterButton filterType="all" text="All" />
                        <FilterButton filterType="active" text="Active" />
                        <FilterButton filterType="completed" text="Completed" />
                    </div>
                    <button onClick={handleClearCompleted} className="px-3 py-1 hover:text-white transition-colors">Clear completed</button>
                </footer>
            </div>
            <div className="flex-1 bg-black/20">
                {renderTaskDetails()}
            </div>
        </div>
    );
};