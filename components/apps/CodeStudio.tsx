import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CreativeAppProps } from '../../types';
import { ProjectSelectionScreen } from '../ProjectSelectionScreen';

const getInitialProjectData = () => ({
    files: {
        'index.html': { 
            content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Studio Project</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Hello, AI Studio!</h1>
    <p>This is your new web project.</p>
    <script src="script.js"></script>
</body>
</html>` 
        },
        'style.css': { 
            content: `body {
    background-color: #282c34;
    color: white;
    font-family: sans-serif;
    text-align: center;
    padding-top: 50px;
}

h1 {
    color: #61dafb;
}` 
        },
        'script.js': { 
            content: `console.log("Hello from your AI Studio script!");

document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('h1');
    header.addEventListener('click', () => {
        alert('You clicked the header!');
    });
});` 
        }
    },
    activeFile: 'index.html',
});


const FileIcon: React.FC<{ fileName: string }> = ({ fileName }) => {
    const extension = fileName.split('.').pop();
    switch (extension) {
        case 'html': return <i className="fi fi-brands-html5 text-orange-500"></i>;
        case 'css': return <i className="fi fi-brands-css3 text-blue-500"></i>;
        case 'js': return <i className="fi fi-brands-js text-yellow-400"></i>;
        default: return <i className="fi fi-rr-file text-gray-400"></i>;
    }
};

export const CodeStudio: React.FC<CreativeAppProps> = (props) => {
    const { projects, appId, activeProjectId, onSetActiveProjectId, onUpdateProject, onCreateProject, onDeleteProject, appDefinition } = props;
    
    const activeProject = projects.find(p => p.id === activeProjectId);
    const projectData = activeProject?.data;

    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, fileName: string } | null>(null);
    const [renamingFile, setRenamingFile] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const updateData = (newData: Partial<any>) => {
        if (!activeProject) return;
        onUpdateProject(activeProject.id, { ...projectData, ...newData });
    };
    
    const handleFileSelect = (fileName: string) => {
        updateData({ activeFile: fileName });
    };

    const handleCodeChange = (newContent: string) => {
        const { files, activeFile } = projectData;
        const updatedFiles = {
            ...files,
            [activeFile]: { ...files[activeFile], content: newContent }
        };
        updateData({ files: updatedFiles });
    };

    const handleNewFile = () => {
        const fileName = prompt("Enter new file name (e.g., component.jsx):");
        if (fileName && !projectData.files[fileName]) {
            const updatedFiles = {
                ...projectData.files,
                [fileName]: { content: `// New file: ${fileName}\n` }
            };
            updateData({ files: updatedFiles, activeFile: fileName });
        } else if (fileName) {
            alert("A file with that name already exists.");
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                if (projectData.files[file.name] && !window.confirm(`A file named "${file.name}" already exists. Overwrite it?`)) {
                    return;
                }
                const updatedFiles = { ...projectData.files, [file.name]: { content } };
                updateData({ files: updatedFiles, activeFile: file.name });
            };
            reader.readAsText(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleRename = (oldName: string, newName: string) => {
        setRenamingFile(null);
        if (!newName || newName === oldName) return;
        if (projectData.files[newName]) {
            alert("A file with that name already exists.");
            return;
        }

        const { [oldName]: value, ...rest } = projectData.files;
        const updatedFiles = { ...rest, [newName]: value };
        const newActiveFile = projectData.activeFile === oldName ? newName : projectData.activeFile;
        updateData({ files: updatedFiles, activeFile: newActiveFile });
    };

    const handleCopyFile = (fileName: string) => {
        const file = projectData.files[fileName];
        if (!file) return;
        
        const parts = fileName.split('.');
        const ext = parts.length > 1 ? parts.pop() : '';
        const base = parts.join('.');
        let newName = `${base}-copy${ext ? '.' + ext : ''}`;
        let i = 2;
        while(projectData.files[newName]) {
            newName = `${base}-copy-${i}${ext ? '.' + ext : ''}`;
            i++;
        }
        
        const updatedFiles = { ...projectData.files, [newName]: { content: file.content } };
        updateData({ files: updatedFiles });
    };

    const handleDeleteFile = (fileName: string) => {
        if (window.confirm(`Are you sure you want to delete ${fileName}? This cannot be undone.`)) {
            const { [fileName]: _, ...rest } = projectData.files;
            
            let newActiveFile = projectData.activeFile;
            if (projectData.activeFile === fileName) {
                newActiveFile = Object.keys(rest)[0] || null;
            }
            updateData({ files: rest, activeFile: newActiveFile });
        }
    };

    const handleContextMenu = (e: React.MouseEvent, fileName: string) => {
        e.preventDefault();
        e.stopPropagation();
        setRenamingFile(null);
        setContextMenu({ x: e.clientX, y: e.clientY, fileName });
    };
    
    const lineCount = useMemo(() => {
        if (!projectData || !projectData.files[projectData.activeFile]) return 1;
        return projectData.files[projectData.activeFile].content.split('\n').length;
    }, [projectData]);

    if (!activeProject) {
        return (
            <ProjectSelectionScreen
                projects={projects.filter(p => p.appId === appId)}
                onCreate={(name) => {
                    const newId = onCreateProject(appId, name, getInitialProjectData());
                    onSetActiveProjectId(appId, newId);
                }}
                onOpen={(projectId) => onSetActiveProjectId(appId, projectId)}
                onDelete={onDeleteProject}
                appDefinition={appDefinition}
            />
        );
    }
    
    const { files, activeFile } = projectData;

    return (
        <div className="flex h-full w-full bg-[#1e2738] font-mono text-sm text-[#d4d4d4] rounded-b-lg">
            <button onClick={() => onSetActiveProjectId(appId, null)} className="absolute top-2 left-2 z-20 flex items-center gap-2 text-xs px-3 py-1.5 bg-dock-bg backdrop-blur-md border border-border-color rounded-full hover:bg-white/20 transition-colors font-sans"><i className="fi fi-rr-arrow-left text-xs" /> Back to Projects</button>
            
            {/* Sidebar */}
            <aside className="w-56 flex-shrink-0 bg-[#252526] p-2 border-r border-white/10 flex flex-col">
                <div className="flex justify-between items-center px-2 py-1 mb-2">
                    <h3 className="text-xs text-white/50 uppercase font-sans tracking-wider">Explorer</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={handleNewFile} title="New File" className="p-1 rounded hover:bg-white/10"><i className="fi fi-rr-file-add"></i></button>
                        <button onClick={handleUploadClick} title="Upload File" className="p-1 rounded hover:bg-white/10"><i className="fi fi-rr-upload"></i></button>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    </div>
                </div>
                <div className="flex flex-col gap-1 flex-grow overflow-y-auto">
                    {Object.keys(files).sort().map(fileName => (
                        renamingFile === fileName ? (
                            <div key={fileName} className="flex items-center gap-2 px-2 py-1 bg-white/10">
                                <FileIcon fileName={fileName} />
                                <input
                                    type="text"
                                    defaultValue={fileName}
                                    autoFocus
                                    onBlur={(e) => handleRename(fileName, e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRename(fileName, (e.target as HTMLInputElement).value);
                                        if (e.key === 'Escape') setRenamingFile(null);
                                    }}
                                    className="w-full bg-white/20 border border-brand-blue rounded text-sm outline-none px-1"
                                />
                            </div>
                        ) : (
                            <button 
                                key={fileName} 
                                onClick={() => handleFileSelect(fileName)}
                                onContextMenu={(e) => handleContextMenu(e, fileName)}
                                className={`w-full flex items-center gap-2 px-2 py-1 text-left rounded text-sm transition-colors ${activeFile === fileName ? 'bg-white/10' : 'hover:bg-white/5'}`}
                            >
                                <FileIcon fileName={fileName} />
                                <span className="truncate">{fileName}</span>
                            </button>
                        )
                    ))}
                </div>
            </aside>

            {contextMenu && (
                <div
                    className="absolute z-50 w-40 bg-[#3c3c3c] rounded-md shadow-lg border border-white/10 py-1 font-sans animate-menu-pop-up"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <ul>
                        <li><button onClick={() => { setRenamingFile(contextMenu.fileName); setContextMenu(null); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-brand-blue flex items-center gap-2"><i className="fi fi-rr-pencil w-4"/>Rename</button></li>
                        <li><button onClick={() => { handleCopyFile(contextMenu.fileName); setContextMenu(null); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-brand-blue flex items-center gap-2"><i className="fi fi-rr-copy w-4"/>Copy</button></li>
                        <li><button onClick={() => { handleDeleteFile(contextMenu.fileName); setContextMenu(null); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-red-500 text-red-400 flex items-center gap-2"><i className="fi fi-rr-trash w-4"/>Delete</button></li>
                    </ul>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                {activeFile ? <>
                    {/* Tabs */}
                    <div className="flex-shrink-0 bg-[#2d2d2d] flex border-b border-black/50">
                        <div className="flex items-center gap-2 px-3 py-2 bg-[#1e1e1e] border-r border-black/50">
                            <FileIcon fileName={activeFile} />
                            <span>{activeFile}</span>
                        </div>
                    </div>
    
                    {/* Editor */}
                    <div className="flex-grow flex relative bg-[#1e1e1e] overflow-hidden">
                        <div className="h-full overflow-y-auto w-full flex">
                            <div className="text-right text-gray-500 select-none sticky top-0 h-fit p-2 pr-4" style={{ fontFamily: 'monospace', lineHeight: '1.5rem' }}>
                                {Array.from({ length: lineCount }, (_, i) => i + 1).map(n => (
                                    <div key={n}>{n}</div>
                                ))}
                            </div>
                            <textarea
                                value={files[activeFile].content}
                                onChange={(e) => handleCodeChange(e.target.value)}
                                spellCheck="false"
                                className="flex-grow bg-transparent text-[#d4d4d4] p-2 resize-none border-none outline-none overflow-visible leading-6"
                                style={{ fontFamily: 'monospace', tabSize: 4 }}
                                wrap="off"
                            />
                        </div>
                    </div>
                    
                     {/* Status Bar */}
                    <div className="flex-shrink-0 h-6 bg-[#007acc] text-white flex items-center justify-between px-3 text-xs font-sans">
                        <div>Ready</div>
                        <div className="flex items-center gap-3">
                            <span>Ln {files[activeFile]?.content?.split('\n').length || 0}, Col 1</span>
                            <span>UTF-8</span>
                            <span>{'{ }'}</span>
                        </div>
                    </div>
                </> : <div className="flex-grow flex items-center justify-center text-white/50 font-sans">Select a file to start editing</div>}
            </main>
        </div>
    );
};