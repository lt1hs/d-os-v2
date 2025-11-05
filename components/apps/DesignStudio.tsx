import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateDesignTemplate } from '../../services/geminiService';
import { CreativeAppProps } from '../../types';
import { ProjectSelectionScreen } from '../ProjectSelectionScreen';

type DesignElement = {
    id: string;
    type: 'shape' | 'text';
    x: number;
    y: number;
    width: number;
    height: number;
    content?: string;
    backgroundColor?: string;
    color?: string;
    fontSize?: number;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right';
    borderRadius?: number;
};

const getInitialProjectData = () => ({
    prompt: 'An instagram post for a coffee shop announcing a new "Cosmic Brew" latte.',
    elements: [],
    selectedElementId: null,
});

export const DesignStudio: React.FC<CreativeAppProps> = (props) => {
    const { projects, appId, activeProjectId, onSetActiveProjectId, onUpdateProject, onCreateProject, onDeleteProject, appDefinition } = props;
    
    const activeProject = projects.find(p => p.id === activeProjectId);
    const projectData = activeProject?.data;
    const updateData = (newData: Partial<any>) => {
        if (!activeProject) return;
        onUpdateProject(activeProject.id, { ...projectData, ...newData });
    };

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [draggingElement, setDraggingElement] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    const handleGenerate = async () => {
        if (!projectData.prompt) {
            setError('Please enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        updateData({ elements: [], selectedElementId: null });
        try {
            const generatedElements = await generateDesignTemplate(projectData.prompt);
            const elementsWithIds = generatedElements.map((el: any) => ({ ...el, id: `el-${Math.random()}` }));
            updateData({ elements: elementsWithIds });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const updateElement = (id: string, newProps: Partial<DesignElement>) => {
        const newElements = projectData.elements.map((el: DesignElement) => el.id === id ? { ...el, ...newProps } : el);
        updateData({ elements: newElements });
    };
    
    const onMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
        updateData({ selectedElementId: id });
        const element = projectData.elements.find((el: DesignElement) => el.id === id);
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (element && canvasRect) {
            const mouseX = e.clientX - canvasRect.left;
            const mouseY = e.clientY - canvasRect.top;
            setDraggingElement({
                id,
                offsetX: mouseX - element.x,
                offsetY: mouseY - element.y,
            });
        }
        e.stopPropagation();
    };

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!draggingElement || !canvasRef.current) return;
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const newX = e.clientX - canvasRect.left - draggingElement.offsetX;
        const newY = e.clientY - canvasRect.top - draggingElement.offsetY;
        updateElement(draggingElement.id, { x: newX, y: newY });
    }, [draggingElement, projectData]);

    const onMouseUp = useCallback(() => {
        setDraggingElement(null);
    }, []);

    useEffect(() => {
        if (draggingElement) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp, { once: true });
        }
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [draggingElement, onMouseMove, onMouseUp]);

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

    const selectedElement = projectData.elements.find((el: DesignElement) => el.id === projectData.selectedElementId);

    const renderElement = (el: DesignElement) => {
        const isSelected = el.id === projectData.selectedElementId;
        const style: React.CSSProperties = {
            position: 'absolute',
            left: `${el.x}px`,
            top: `${el.y}px`,
            width: `${el.width}px`,
            height: `${el.height}px`,
            backgroundColor: el.backgroundColor,
            color: el.color,
            fontSize: `${el.fontSize}px`,
            fontWeight: el.fontWeight,
            textAlign: el.textAlign,
            borderRadius: `${el.borderRadius}px`,
            boxShadow: isSelected ? `0 0 0 2px var(--accent-color)` : 'none',
            cursor: draggingElement ? 'grabbing' : 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            overflow: 'hidden'
        };

        return (
            <div key={el.id} style={style} onMouseDown={e => onMouseDown(e, el.id)}>
                {el.type === 'text' && el.content}
            </div>
        );
    };

    return (
        <div className="flex h-full w-full gap-4 text-white/90 p-4">
            <button onClick={() => onSetActiveProjectId(appId, null)} className="absolute top-2 left-2 z-10 flex items-center gap-2 text-xs px-3 py-1.5 bg-dock-bg backdrop-blur-md border border-border-color rounded-full hover:bg-white/20 transition-colors font-sans"><i className="fi fi-rr-arrow-left text-xs" /> Back to Projects</button>
            <div className="w-1/4 min-w-[280px] flex flex-col gap-4">
                <h3 className="text-lg font-semibold pt-6">{activeProject.name}</h3>
                <div className="bg-white/5 p-3 rounded-lg border border-border-color flex-grow flex flex-col">
                    <h4 className="text-md font-semibold mb-2">Template Generator</h4>
                    <p className="text-xs text-white/60 mb-3">Describe the design you need, and AI will build an editable template for you.</p>
                    <textarea value={projectData.prompt} onChange={e => updateData({ prompt: e.target.value })} placeholder="e.g., A flyer for a summer concert" className="w-full h-32 p-2 bg-white/5 border border-border-color rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                    <button onClick={handleGenerate} disabled={isLoading} className="mt-auto w-full flex items-center justify-center gap-2 h-11 px-4 py-2 bg-brand-blue text-white font-semibold rounded-md hover:bg-brand-blue-hover disabled:bg-gray-500/50">
                        {isLoading ? 'Generating...' : 'Generate Design'}
                    </button>
                </div>
            </div>

            <div className="w-1/2 flex flex-col bg-black/20 rounded-lg border border-border-color">
                <div className="flex-grow flex items-center justify-center p-4">
                    <div 
                        ref={canvasRef}
                        className="aspect-square bg-canvas-bg w-full max-w-[1080px] relative shadow-lg"
                        style={{ background: 'repeating-conic-gradient(#374151 0% 25%, #4b5563 0% 50%) 50% / 20px 20px' }}
                        onClick={() => updateData({ selectedElementId: null })}
                    >
                        {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-black/50"><div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div></div>}
                        {error && <div className="absolute inset-0 flex items-center justify-center text-center p-4 text-red-400">{error}</div>}
                        {!isLoading && !error && projectData.elements.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-white/50">Your design will appear here.</div>}
                        {projectData.elements.map(renderElement)}
                    </div>
                </div>
            </div>

            <div className="w-1/4 min-w-[280px] flex flex-col gap-4">
                <div className="bg-white/5 p-3 rounded-lg border border-border-color flex-grow overflow-y-auto">
                    <h4 className="text-md font-semibold mb-4">Inspector</h4>
                    {selectedElement ? (
                        <div className="space-y-4 animate-fade-in">
                            <p className="text-sm text-white/70 capitalize">Type: {selectedElement.type}</p>
                            {selectedElement.type === 'text' && (
                                <>
                                    <div>
                                        <label className="text-xs text-white/60">Content</label>
                                        <textarea value={selectedElement.content} onChange={e => updateElement(projectData.selectedElementId, { content: e.target.value })} className="w-full mt-1 p-2 bg-white/10 border border-border-color rounded-md text-sm h-20 resize-none"/>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1">
                                            <label className="text-xs text-white/60">Font Size</label>
                                            <input type="number" value={selectedElement.fontSize} onChange={e => updateElement(projectData.selectedElementId, { fontSize: parseInt(e.target.value)})} className="w-full mt-1 p-2 bg-white/10 border border-border-color rounded-md text-sm"/>
                                        </div>
                                        <div>
                                            <label className="text-xs text-white/60">Color</label>
                                            <input type="color" value={selectedElement.color} onChange={e => updateElement(projectData.selectedElementId, { color: e.target.value })} className="w-12 h-10 mt-1 p-1 bg-white/10 border border-border-color rounded-md"/>
                                        </div>
                                    </div>
                                </>
                            )}
                             {selectedElement.type === 'shape' && (
                                <>
                                    <div>
                                        <label className="text-xs text-white/60">Background Color</label>
                                        <input type="color" value={selectedElement.backgroundColor} onChange={e => updateElement(projectData.selectedElementId, { backgroundColor: e.target.value })} className="w-full h-10 mt-1 p-1 bg-white/10 border border-border-color rounded-md"/>
                                    </div>
                                     <div>
                                        <label className="text-xs text-white/60">Border Radius</label>
                                        <input type="number" value={selectedElement.borderRadius} onChange={e => updateElement(projectData.selectedElementId, { borderRadius: parseInt(e.target.value)})} className="w-full mt-1 p-2 bg-white/10 border border-border-color rounded-md text-sm"/>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-white/50">Select an element to edit its properties.</p>
                    )}
                </div>
                 <div className="bg-white/5 p-3 rounded-lg border border-border-color">
                    <h4 className="text-md font-semibold mb-2">AI Assist</h4>
                    <div className="space-y-2">
                        <button disabled className="w-full p-2 text-center bg-white/10 text-xs rounded-md opacity-50 cursor-not-allowed">Suggest Colors</button>
                        <button disabled className="w-full p-2 text-center bg-white/10 text-xs rounded-md opacity-50 cursor-not-allowed">Improve Typography</button>
                    </div>
                </div>
            </div>
        </div>
    );
};