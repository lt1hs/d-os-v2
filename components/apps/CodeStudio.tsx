import React, { useState, useEffect, useMemo } from 'react';
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
            <button onClick={() => onSetActiveProjectId(appId, null)} className="absolute top-12 left-2 text-xs px-2 py-1 bg-black/30 rounded-full z-10 hover:bg-black/50 font-sans">&lt; Back to Projects</button>
            
            {/* Sidebar */}
            <aside className="w-56 flex-shrink-0 bg-[#252526] p-2 border-r border-white/10 flex flex-col">
                <h3 className="text-xs text-white/50 uppercase font-sans tracking-wider px-2 py-1 mb-2">Explorer</h3>
                <div className="flex flex-col gap-1">
                    {Object.keys(files).map(fileName => (
                        <button 
                            key={fileName} 
                            onClick={() => handleFileSelect(fileName)}
                            className={`w-full flex items-center gap-2 px-2 py-1 text-left rounded text-sm transition-colors ${activeFile === fileName ? 'bg-white/10' : 'hover:bg-white/5'}`}
                        >
                            <FileIcon fileName={fileName} />
                            <span>{fileName}</span>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Tabs */}
                <div className="flex-shrink-0 bg-[#2d2d2d] flex border-b border-black/50">
                    <div className="flex items-center gap-2 px-3 py-2 bg-[#1e2738] border-r border-black/50">
                        <FileIcon fileName={activeFile} />
                        <span>{activeFile}</span>
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-grow flex relative bg-[#1e1e1e] overflow-hidden">
                    <div className="h-full overflow-y-auto w-full flex">
                        <div className="text-right text-gray-500 select-none sticky top-0 h-full p-2" style={{ fontFamily: 'monospace' }}>
                            {Array.from({ length: lineCount }, (_, i) => i + 1).map(n => (
                                <div key={n}>{n}</div>
                            ))}
                        </div>
                        <textarea
                            value={files[activeFile].content}
                            onChange={(e) => handleCodeChange(e.target.value)}
                            spellCheck="false"
                            className="flex-grow bg-transparent text-[#d4d4d4] p-2 resize-none border-none outline-none overflow-visible"
                            style={{ fontFamily: 'monospace', lineHeight: '1.5rem', tabSize: 4 }}
                            wrap="off"
                        />
                    </div>
                </div>
                
                 {/* Status Bar */}
                <div className="flex-shrink-0 h-6 bg-[#007acc] text-white flex items-center justify-between px-3 text-xs font-sans">
                    <div>Ready</div>
                    <div className="flex items-center gap-3">
                        <span>Ln {files[activeFile].content.substr(0, 100).split('\n').length}, Col 1</span>
                        <span>UTF-8</span>
                        <span>{'{ }'}</span>
                    </div>
                </div>
            </main>
        </div>
    );
};