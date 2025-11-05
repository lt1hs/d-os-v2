import React, { useState, useRef } from 'react';
import { generatePodcastScript, generateMultiSpeakerSpeech } from '../../services/geminiService';
import { CreativeAppProps } from '../../types';
import { ProjectSelectionScreen } from '../ProjectSelectionScreen';


const voices = [ "Kore", "Puck", "Charon", "Zephyr", "Fenrir" ];
const podcastStyles = ['Educational', 'Interview', 'Deep Dive', 'Storytelling', 'News Report', 'Talk Show', 'Personal Growth'];
const importMethods = [
    { id: 'ai', label: 'AI Topic' },
    { id: 'text', label: 'Your Text' },
    { id: 'file', label: 'File Upload' },
    { id: 'article', label: 'Article URL' },
];

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-full">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
    </div>
);

interface Speaker {
    id: number;
    name: string;
    voice: string;
}

const getInitialProjectData = () => ({
    topic: 'The future of artificial intelligence in creative fields.',
    speakers: [
        { id: 1, name: 'Host', voice: 'Zephyr' },
        { id: 2, name: 'Expert', voice: 'Kore' },
    ],
    script: '',
    audioDataUrl: null,
    // New properties
    importMethod: 'ai',
    podcastStyle: 'Interview',
    podcastDuration: 5, // in minutes
    articleUrl: '',
    sourceText: '', // for text/file/article import
});


export const PodcastStudio: React.FC<CreativeAppProps> = (props) => {
    const { projects, appId, activeProjectId, onSetActiveProjectId, onUpdateProject, onCreateProject, onDeleteProject, appDefinition } = props;

    const activeProject = projects.find(p => p.id === activeProjectId);
    const projectData = activeProject?.data;
    const updateData = (newData: Partial<any>) => {
        if (!activeProject) return;
        onUpdateProject(activeProject.id, { ...projectData, ...newData });
    };
    
    const [isLoadingScript, setIsLoadingScript] = useState(false);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSpeakerCountChange = (count: number) => {
        const currentSpeakers = projectData.speakers;
        const newSpeakers = [...currentSpeakers];
        if (count > currentSpeakers.length) {
            for (let i = currentSpeakers.length; i < count; i++) {
                newSpeakers.push({ id: Date.now() + i, name: `Speaker ${i + 1}`, voice: voices[0] });
            }
        } else {
            newSpeakers.length = count;
        }
        updateData({ speakers: newSpeakers });
    };

    const updateSpeaker = (id: number, field: 'name' | 'voice', value: string) => {
        updateData({ speakers: projectData.speakers.map((s: Speaker) => s.id === id ? { ...s, [field]: value } : s)});
    };
    
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const content = event.target?.result as string;
                updateData({ sourceText: content });
            };
            reader.readAsText(file);
        }
    };
    
    const handleFetchArticle = () => {
        // Mock implementation for demonstration
        alert("Article fetching is a demo feature. In a real application, this would fetch content from the URL to avoid CORS issues.");
        if (!projectData.articleUrl) return;
        const mockContent = `This is a mock summary of the article from ${projectData.articleUrl}. It discusses various key points and provides expert opinions on the matter, ready to be turned into a podcast script.`;
        updateData({ sourceText: mockContent });
    };

    const handleGenerateScript = async () => {
        let sourceContent = '';
        switch(projectData.importMethod) {
            case 'ai': sourceContent = projectData.topic; break;
            case 'text':
            case 'file':
            case 'article': sourceContent = projectData.sourceText; break;
        }

        if (!sourceContent || projectData.speakers.length < 1) {
            setError('Please provide a content source and at least one speaker.');
            return;
        }
        setIsLoadingScript(true);
        setError(null);
        updateData({ script: '', audioDataUrl: null });
        try {
            const speakerNames = projectData.speakers.map((s: Speaker) => s.name);
            const generatedScript = await generatePodcastScript(sourceContent, speakerNames, projectData.podcastStyle, projectData.podcastDuration);
            updateData({ script: generatedScript });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred while generating the script.');
        } finally {
            setIsLoadingScript(false);
        }
    };

    const handleGenerateAudio = async () => {
        if (!projectData.script) {
            setError('Please generate or write a script first.');
            return;
        }
        setIsLoadingAudio(true);
        setError(null);
        updateData({ audioDataUrl: null });
        try {
            const speakerConfigs = projectData.speakers.map((s: Speaker) => ({ speaker: s.name, voiceName: s.voice }));
            const audioB64 = await generateMultiSpeakerSpeech(projectData.script, speakerConfigs);
            const dataUrl = `data:audio/mp3;base64,${audioB64}`;
            updateData({ audioDataUrl: dataUrl });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred while generating audio.');
        } finally {
            setIsLoadingAudio(false);
        }
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


    return (
        <div className="flex h-full w-full gap-4 text-white/90 p-4">
            <button onClick={() => onSetActiveProjectId(appId, null)} className="absolute top-12 left-2 text-xs px-2 py-1 bg-black/30 rounded-full z-10 hover:bg-black/50">&lt; Back to Projects</button>
            <div className="w-1/3 min-w-[320px] flex flex-col gap-4 overflow-y-auto pr-2">
                <h3 className="text-lg font-semibold pt-6">{activeProject.name}</h3>
                <div className="bg-white/5 p-3 rounded-lg border border-border-color flex-grow flex flex-col gap-4">
                    <div>
                        <h4 className="text-md font-semibold mb-2">1. Content Source</h4>
                        <div className="flex bg-black/20 rounded-lg p-1 mb-2">
                             {importMethods.map(method => (
                                <button key={method.id} onClick={() => updateData({ importMethod: method.id })} className={`flex-1 py-1 rounded-md text-xs font-semibold transition-colors ${projectData.importMethod === method.id ? 'bg-brand-blue' : 'hover:bg-white/10'}`}>
                                    {method.label}
                                </button>
                            ))}
                        </div>
                        {projectData.importMethod === 'ai' && <textarea value={projectData.topic} onChange={e => updateData({ topic: e.target.value })} placeholder="What should the podcast be about?" className="w-full mt-1 p-2 bg-white/10 border border-border-color rounded-md text-sm h-24 resize-none"/>}
                        {projectData.importMethod === 'text' && <textarea value={projectData.sourceText} onChange={e => updateData({ sourceText: e.target.value })} placeholder="Paste your script or text here." className="w-full mt-1 p-2 bg-white/10 border border-border-color rounded-md text-sm h-24 resize-none"/>}
                        {projectData.importMethod === 'file' && <><input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt" className="hidden" /><button onClick={() => fileInputRef.current?.click()} className="w-full p-2 text-center bg-white/10 text-sm rounded-md hover:bg-white/20">Upload .txt File</button></>}
                        {projectData.importMethod === 'article' && <div className="flex gap-2"><input type="url" value={projectData.articleUrl} onChange={e => updateData({ articleUrl: e.target.value })} placeholder="https://example.com/article" className="w-full p-2 bg-white/10 border border-border-color rounded-md text-sm"/><button onClick={handleFetchArticle} className="px-3 bg-white/10 text-sm rounded-md hover:bg-white/20">Fetch</button></div>}
                    </div>

                    <div>
                        <h4 className="text-md font-semibold mb-2">2. Podcast Settings</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-white/70">Podcast Style</label>
                                <select value={projectData.podcastStyle} onChange={e => updateData({ podcastStyle: e.target.value })} className="w-full mt-1 p-2 bg-white/10 border border-border-color rounded-md text-sm">
                                    {podcastStyles.map(style => <option key={style} value={style} className="bg-gray-800">{style}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-white/70">Duration: {projectData.podcastDuration} min</label>
                                <input type="range" min="1" max="15" value={projectData.podcastDuration} onChange={e => updateData({ podcastDuration: parseInt(e.target.value) })} className="w-full mt-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"/>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="text-md font-semibold mb-2">3. Speakers</h4>
                        <div className="mb-2">
                             <label className="text-xs font-medium text-white/70">Number of Speakers</label>
                             <select value={projectData.speakers.length} onChange={e => handleSpeakerCountChange(parseInt(e.target.value))} className="w-full mt-1 p-2 bg-white/10 border border-border-color rounded-md text-sm">
                                {[1, 2, 3, 4, 5, 6].map(num => <option key={num} value={num} className="bg-gray-800">{num}</option>)}
                             </select>
                        </div>
                        <div className="space-y-2">
                             {projectData.speakers.map((speaker: Speaker) => (
                                <div key={speaker.id} className="p-2 bg-white/10 rounded-md">
                                    <input type="text" value={speaker.name} onChange={e => updateSpeaker(speaker.id, 'name', e.target.value)} className="w-full bg-transparent font-semibold focus:outline-none mb-1"/>
                                    <select value={speaker.voice} onChange={e => updateSpeaker(speaker.id, 'voice', e.target.value)} className="w-full p-1 bg-white/5 border border-border-color rounded-md text-xs">
                                        {voices.map(v => <option key={v} value={v} className="bg-gray-800">{v}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto">
                        <button onClick={handleGenerateScript} disabled={isLoadingScript} className="w-full flex items-center justify-center gap-2 h-11 px-4 py-2 bg-brand-blue text-white font-semibold rounded-md hover:bg-brand-blue-hover disabled:bg-gray-500/50">
                            {isLoadingScript ? 'Generating...' : 'Generate Script'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-1/2 flex flex-col bg-black/20 rounded-lg border border-border-color">
                <div className="p-2 border-b border-border-color flex justify-between items-center">
                    <h4 className="text-md font-semibold">Podcast Script</h4>
                    <button onClick={handleGenerateAudio} disabled={isLoadingAudio || !projectData.script} className="px-3 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-500/50">
                        {isLoadingAudio ? 'Generating...' : 'Generate Podcast Audio'}
                    </button>
                </div>
                {isLoadingScript ? (
                    <div className="flex-grow flex items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <textarea 
                        value={projectData.script} 
                        onChange={e => updateData({ script: e.target.value })} 
                        placeholder="Your generated script will appear here. You can also write or paste your own script. Use the format 'SPEAKER_NAME: Dialogue...'"
                        className="w-full h-full p-4 bg-transparent text-sm resize-none focus:outline-none leading-relaxed"
                    />
                )}
            </div>
            
            <div className="w-1/4 min-w-[280px] flex flex-col gap-4">
                <div className="bg-white/5 p-3 rounded-lg border border-border-color flex-grow flex items-center justify-center">
                    {isLoadingAudio && <LoadingSpinner />}
                    {error && <div className="text-center text-red-400 p-4">{error}</div>}
                    {!isLoadingAudio && !error && projectData.audioDataUrl && (
                        <div className="w-full text-center">
                            <h4 className="text-lg font-semibold mb-4">Final Podcast</h4>
                            <audio controls src={projectData.audioDataUrl} className="w-full">
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    )}
                    {!isLoadingAudio && !error && !projectData.audioDataUrl && (
                        <p className="text-center text-white/50 p-4">Your generated podcast audio will appear here.</p>
                    )}
                </div>
            </div>
        </div>
    );
};