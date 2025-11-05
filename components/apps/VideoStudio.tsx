import React, { useState, useCallback, useEffect } from 'react';
import { generateVideo } from '../../services/geminiService';
import { CreativeAppProps } from '../../types';
import { ProjectSelectionScreen } from '../ProjectSelectionScreen';


type Scene = {
    id: string;
    prompt: string;
    duration: number; // in seconds
    generatedUrl: string | null;
    isLoading: boolean;
    error: string | null;
};

type CreationMode = 'text' | 'script' | 'article';
type RightPanelTab = 'settings' | 'templates';

const motionTemplates = [
    { name: 'Corporate Presentation', scenes: [{ prompt: 'Modern office with diverse team collaborating.' }, { prompt: 'Animated chart showing positive growth.' }, { prompt: 'Handshake closing a successful deal.' }] },
    { name: 'Social Media Ad', scenes: [{ prompt: 'Dynamic shot of a product in use.' }, { prompt: 'Happy customer testimonials.' }, { prompt: 'Logo reveal with a call to action.' }] },
    { name: 'Travel Vlog', scenes: [{ prompt: 'Breathtaking aerial shot of a tropical island.' }, { prompt: 'Exploring a bustling local market.' }, { prompt: 'Relaxing on a white sand beach at sunset.' }] },
    { name: 'Product Demo', scenes: [{ prompt: 'Close-up of the product\'s main feature.' }, { prompt: 'Demonstration of how the product solves a problem.' }, { prompt: 'Final shot of the product with branding.' }] },
];

const voices = ['Adam', 'Bella', 'Charlie', 'Diana', 'Ethan', 'Fiona', ...Array.from({length: 94}, (_, i) => `Voice ${i + 1}`)];
const emotions = ['Neutral', 'Happy', 'Sad', 'Angry', 'Excited', 'Serious'];


const getInitialProjectData = () => ({
    scenes: [
        { id: `scene-${Date.now()}`, prompt: 'A neon hologram of a cat driving a futuristic car.', duration: 5, generatedUrl: null, isLoading: false, error: null },
    ],
    activeSceneId: `scene-${Date.now()}`,
    creationMode: 'text',
    rightPanelTab: 'settings',
    script: '',
    voice: 'Adam',
    emotion: 'Neutral',
    autoSubtitles: true,
    autoTranslate: false,
});


export const VideoStudio: React.FC<CreativeAppProps> = (props) => {
    const { projects, appId, activeProjectId, onSetActiveProjectId, onUpdateProject, onCreateProject, onDeleteProject, appDefinition } = props;
    
    const activeProject = projects.find(p => p.id === activeProjectId);
    const projectData = activeProject?.data;
    const updateData = (newData: Partial<any>) => {
        if (!activeProject) return;
        onUpdateProject(activeProject.id, { ...projectData, ...newData });
    };

    const [isKeyRequired, setIsKeyRequired] = useState<boolean>(false);
    const [globalError, setGlobalError] = useState<string | null>(null);

     useEffect(() => {
        const checkApiKey = async () => {
            if (window.aistudio && await !window.aistudio.hasSelectedApiKey()) {
                setIsKeyRequired(true);
            }
        };
        checkApiKey();
    }, []);

    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            setIsKeyRequired(false);
            setGlobalError(null);
        }
    };

    const updateScene = (id: string, updates: Partial<Omit<Scene, 'id'>>) => {
        const newScenes = projectData.scenes.map((s: Scene) => s.id === id ? { ...s, ...updates } : s);
        updateData({ scenes: newScenes });
    };

    const handleGenerateScene = useCallback(async (sceneId: string) => {
        const scene = projectData.scenes.find((s: Scene) => s.id === sceneId);
        if (!scene || !scene.prompt) {
            updateScene(sceneId, { error: 'Please enter a prompt for this scene.' });
            return;
        }

        if (window.aistudio && await !window.aistudio.hasSelectedApiKey()) {
            setGlobalError('An API key is required for video generation. Please select a key.');
            setIsKeyRequired(true);
            return;
        }

        updateScene(sceneId, { isLoading: true, error: null, generatedUrl: null });
        setGlobalError(null);

        try {
            const downloadLink = await generateVideo(scene.prompt, '16:9', '720p', (progress) => { /* Can show progress per scene later */ });
            const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
             if (!response.ok) throw new Error(`Failed to download video: ${response.statusText}`);
            const videoBlob = await response.blob();
            const videoUrl = URL.createObjectURL(videoBlob);
            updateScene(sceneId, { generatedUrl: videoUrl });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            updateScene(sceneId, { error: errorMessage });
            if (errorMessage.includes('API key not valid') || errorMessage.includes('entity was not found')) {
                setIsKeyRequired(true);
            }
        } finally {
            updateScene(sceneId, { isLoading: false });
        }
    }, [projectData]);

    const addScene = () => {
        const newScene: Scene = { id: `scene-${Date.now()}`, prompt: '', duration: 5, generatedUrl: null, isLoading: false, error: null };
        updateData({ scenes: [...projectData.scenes, newScene], activeSceneId: newScene.id });
    };
    
    const deleteScene = (id: string) => {
        const newScenes = projectData.scenes.filter((s: Scene) => s.id !== id);
        let newActiveId = projectData.activeSceneId;
        if (newActiveId === id) {
            newActiveId = newScenes.length > 0 ? newScenes[0].id : null;
        }
        updateData({ scenes: newScenes, activeSceneId: newActiveId });
    };

    const parseScript = () => {
        const scenePrompts = projectData.script.split('\n').filter((line: string) => line.trim() !== '');
        if(scenePrompts.length === 0) return;
        const newScenes = scenePrompts.map((prompt: string) => ({ id: `scene-${Date.now()}-${Math.random()}`, prompt, duration: 5, generatedUrl: null, isLoading: false, error: null }));
        updateData({ scenes: newScenes, activeSceneId: newScenes[0].id });
    };
    
    const loadTemplate = (template: typeof motionTemplates[0]) => {
        const newScenes = template.scenes.map(scene => ({
            id: `scene-${Date.now()}-${Math.random()}`,
            prompt: scene.prompt,
            duration: 5,
            generatedUrl: null,
            isLoading: false,
            error: null,
        }));
        updateData({ scenes: newScenes, activeSceneId: newScenes[0].id });
    };

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
    
    const activeScene = projectData.scenes.find((s: Scene) => s.id === projectData.activeSceneId);

    return (
        <div className="flex h-full w-full gap-4 text-white/90 p-4">
            <button onClick={() => onSetActiveProjectId(appId, null)} className="absolute top-2 left-2 z-10 flex items-center gap-2 text-xs px-3 py-1.5 bg-dock-bg backdrop-blur-md border border-border-color rounded-full hover:bg-white/20 transition-colors font-sans"><i className="fi fi-rr-arrow-left text-xs" /> Back to Projects</button>
            <div className="w-1/4 min-w-[280px] flex flex-col gap-4">
                <h3 className="text-lg font-semibold pt-6">{activeProject.name}</h3>
                <div className="flex bg-white/5 rounded-lg p-1">
                    <button onClick={() => updateData({ creationMode: 'text' })} className={`w-1/3 py-1.5 rounded-md text-sm font-semibold transition-colors ${projectData.creationMode === 'text' ? 'bg-brand-blue' : 'hover:bg-white/10'}`}>Text-to-Video</button>
                    <button onClick={() => updateData({ creationMode: 'script' })} className={`w-1/3 py-1.5 rounded-md text-sm font-semibold transition-colors ${projectData.creationMode === 'script' ? 'bg-brand-blue' : 'hover:bg-white/10'}`}>Script-to-Video</button>
                    <button onClick={() => updateData({ creationMode: 'article' })} className={`w-1/3 py-1.5 rounded-md text-sm font-semibold transition-colors ${projectData.creationMode === 'article' ? 'bg-brand-blue' : 'hover:bg-white/10'}`}>Article-to-Video</button>
                </div>
                {projectData.creationMode === 'script' ? (
                    <div className="flex-grow flex flex-col">
                        <textarea value={projectData.script} onChange={e => updateData({ script: e.target.value })} placeholder="Paste your script here. Each paragraph will become a new scene." className="w-full h-full p-2 bg-white/5 border border-border-color rounded-md text-sm resize-none" />
                        <button onClick={parseScript} className="mt-2 w-full h-10 px-4 py-2 bg-brand-blue text-white font-semibold rounded-md hover:bg-brand-blue-hover">Create Scenes</button>
                    </div>
                ) : (
                    <div className="bg-white/5 p-3 rounded-lg border border-border-color flex-grow">
                        <p className="text-sm text-white/70">
                            {projectData.creationMode === 'text' && "Enter a prompt below to generate a single video scene."}
                            {projectData.creationMode === 'article' && "Paste an article URL to automatically generate a video storyboard (Coming Soon)."}
                        </p>
                    </div>
                )}
            </div>
            <div className="w-1/2 flex flex-col bg-black/20 rounded-lg border border-border-color">
                <div className="flex-grow flex items-center justify-center p-4 relative" style={{ background: 'repeating-conic-gradient(#374151 0% 25%, #4b5563 0% 50%) 50% / 20px 20px' }}>
                    {activeScene?.isLoading && <div className="text-center p-4"><div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p>Generating Scene...</p></div>}
                    {activeScene?.error && <div className="text-center text-red-400 p-4 max-w-sm bg-red-900/40 rounded-lg border border-red-500/50"><p className="font-bold">Generation Failed</p><p className="text-sm mt-1">{activeScene.error}</p></div>}
                    {globalError && <div className="text-center text-red-400 p-4 max-w-sm bg-red-900/40 rounded-lg border border-red-500/50"><p className="font-bold">Error</p><p className="text-sm mt-1">{globalError}</p>{isKeyRequired && <button onClick={handleSelectKey} className="mt-4 px-4 py-2 bg-yellow-500 text-black font-semibold rounded-md hover:bg-yellow-600">Select API Key</button>}</div>}
                    {activeScene?.generatedUrl && !activeScene.isLoading && <video src={activeScene.generatedUrl} controls autoPlay loop className="max-w-full max-h-full object-contain" />}
                    {!activeScene && !globalError && <div className="text-center text-white/50">Add a scene to get started.</div>}
                    {activeScene && !activeScene.generatedUrl && !activeScene.isLoading && !activeScene.error && !globalError && <div className="text-center text-white/50 p-4"><p>Your generated scene will appear here.</p><p className="text-xs mt-2 text-yellow-400/80">Note: Generated videos are not saved between sessions.</p></div>}
                </div>
                <div className="flex-shrink-0 h-48 bg-black/30 border-t border-border-color p-2 flex flex-col">
                    <h4 className="text-sm font-semibold mb-2 px-1">Storyboard</h4>
                    <div className="flex-grow overflow-x-auto flex items-center gap-2">
                        {projectData.scenes.map((scene: Scene, index: number) => (
                            <div key={scene.id} onClick={() => updateData({ activeSceneId: scene.id })} className={`w-32 h-28 flex-shrink-0 rounded-lg p-1.5 flex flex-col justify-between cursor-pointer transition-all ${projectData.activeSceneId === scene.id ? 'ring-2 ring-brand-blue bg-brand-blue/20' : 'bg-white/5 hover:bg-white/10'}`}>
                                <p className="text-xs line-clamp-3">{scene.prompt || "Empty Scene"}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-mono">{index + 1}</span>
                                    <button onClick={(e) => {e.stopPropagation(); deleteScene(scene.id)}} className="w-5 h-5 rounded-full hover:bg-red-500/50 flex items-center justify-center text-xs"><i className="fi fi-rr-trash"></i></button>
                                </div>
                            </div>
                        ))}
                        <button onClick={addScene} className="w-20 h-28 flex-shrink-0 rounded-lg bg-white/10 hover:bg-white/20 flex flex-col items-center justify-center text-white/70">
                            <i className="fi fi-rr-add text-2xl"></i>
                            <span className="text-xs mt-1">Add Scene</span>
                        </button>
                    </div>
                </div>
            </div>
            <div className="w-1/4 min-w-[280px] flex flex-col gap-4">
                 <div className="flex bg-white/5 rounded-lg p-1">
                    <button onClick={() => updateData({ rightPanelTab: 'settings' })} className={`w-1/2 py-1.5 rounded-md text-sm font-semibold transition-colors ${projectData.rightPanelTab === 'settings' ? 'bg-brand-blue' : 'hover:bg-white/10'}`}>Settings</button>
                    <button onClick={() => updateData({ rightPanelTab: 'templates' })} className={`w-1/2 py-1.5 rounded-md text-sm font-semibold transition-colors ${projectData.rightPanelTab === 'templates' ? 'bg-brand-blue' : 'hover:bg-white/10'}`}>Templates</button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2">
                    {activeScene && projectData.rightPanelTab === 'settings' && (
                        <div className="bg-white/5 p-3 rounded-lg border border-border-color space-y-4 animate-fade-in">
                            <h4 className="text-md font-semibold">Scene Editor</h4>
                            <div>
                                <label className="text-xs font-medium text-white/70">Prompt</label>
                                <textarea value={activeScene.prompt} onChange={e => updateScene(projectData.activeSceneId, { prompt: e.target.value })} className="w-full mt-1 p-2 bg-white/5 border border-border-color rounded-md text-sm h-24 resize-none" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-white/70">Duration (seconds)</label>
                                <input type="number" value={activeScene.duration} min="1" max="15" onChange={e => updateScene(projectData.activeSceneId, { duration: parseInt(e.target.value)})} className="w-full mt-1 p-2 bg-white/5 border border-border-color rounded-md text-sm" />
                            </div>
                             <button onClick={() => handleGenerateScene(projectData.activeSceneId)} disabled={activeScene.isLoading} className="w-full h-10 bg-brand-blue text-white font-semibold rounded-md hover:bg-brand-blue-hover disabled:bg-gray-500/50">
                                {activeScene.isLoading ? 'Generating...' : 'Generate Scene'}
                             </button>
                             <hr className="border-border-color my-4"/>
                            <h4 className="text-md font-semibold pt-2">Voice & Subtitles</h4>
                             <div>
                                <label className="text-xs font-medium text-white/70">Voiceover</label>
                                <select value={projectData.voice} onChange={e => updateData({ voice: e.target.value })} className="w-full mt-1 p-2 bg-white/5 border border-border-color rounded-md text-sm"><option className="bg-gray-800" value="">None</option>{voices.map(v => <option key={v} value={v} className="bg-gray-800">{v}</option>)}</select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-white/70">Emotion</label>
                                <select value={projectData.emotion} onChange={e => updateData({ emotion: e.target.value })} className="w-full mt-1 p-2 bg-white/5 border border-border-color rounded-md text-sm">{emotions.map(e => <option key={e} value={e} className="bg-gray-800">{e}</option>)}</select>
                            </div>
                            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={projectData.autoSubtitles} onChange={e => updateData({ autoSubtitles: e.target.checked })} className="form-checkbox bg-white/10 border-border-color text-brand-blue" /> Auto-sync subtitles</label>
                            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={projectData.autoTranslate} onChange={e => updateData({ autoTranslate: e.target.checked })} className="form-checkbox bg-white/10 border-border-color text-brand-blue" /> Translate to English</label>
                        </div>
                    )}
                    {projectData.rightPanelTab === 'templates' && (
                        <div className="bg-white/5 p-3 rounded-lg border border-border-color space-y-2 animate-fade-in">
                            <h4 className="text-md font-semibold">Motion Templates</h4>
                            {motionTemplates.map(template => (
                                <button key={template.name} onClick={() => loadTemplate(template)} className="w-full p-2 text-left bg-white/5 hover:bg-white/10 rounded-md">
                                    <p className="font-semibold text-sm">{template.name}</p>
                                    <p className="text-xs text-white/60 line-clamp-1">{template.scenes.map(s => s.prompt).join(' ')}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};