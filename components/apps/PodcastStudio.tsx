import React, { useState } from 'react';
import { generatePodcastScript, generateMultiSpeakerSpeech } from '../../services/geminiService';
import { CreativeAppProps } from '../../types';
import { ProjectSelectionScreen } from '../ProjectSelectionScreen';


const voices = [ "Kore", "Puck", "Charon", "Zephyr", "Fenrir" ];

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

    const addSpeaker = () => {
        const speakers = projectData.speakers;
        const newId = speakers.length > 0 ? Math.max(...speakers.map((s: Speaker) => s.id)) + 1 : 1;
        updateData({ speakers: [...speakers, { id: newId, name: `Speaker ${speakers.length + 1}`, voice: voices[0] }]});
    };
    
    const removeSpeaker = (id: number) => {
        if (projectData.speakers.length > 2) {
            updateData({ speakers: projectData.speakers.filter((s: Speaker) => s.id !== id) });
        }
    };

    const updateSpeaker = (id: number, field: 'name' | 'voice', value: string) => {
        updateData({ speakers: projectData.speakers.map((s: Speaker) => s.id === id ? { ...s, [field]: value } : s)});
    };

    const handleGenerateScript = async () => {
        if (!projectData.topic || projectData.speakers.length < 2) {
            setError('Please provide a topic and at least two speakers.');
            return;
        }
        setIsLoadingScript(true);
        setError(null);
        updateData({ script: '', audioDataUrl: null });
        try {
            const speakerNames = projectData.speakers.map((s: Speaker) => s.name);
            const generatedScript = await generatePodcastScript(projectData.topic, speakerNames);
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
            <div className="w-1/4 min-w-[280px] flex flex-col gap-4 overflow-y-auto pr-2">
                <h3 className="text-lg font-semibold pt-6">{activeProject.name}</h3>
                <div className="bg-white/5 p-3 rounded-lg border border-border-color flex-grow flex flex-col gap-4">
                    <div>
                        <label className="text-xs font-medium text-white/70">Podcast Topic</label>
                        <textarea 
                            value={projectData.topic} 
                            onChange={e => updateData({ topic: e.target.value })} 
                            placeholder="What should the podcast be about?" 
                            className="w-full mt-1 p-2 bg-white/10 border border-border-color rounded-md text-sm h-24 resize-none"
                        />
                    </div>
                    <div>
                        <h4 className="text-md font-semibold mb-2">Speakers</h4>
                        <div className="space-y-3">
                            {projectData.speakers.map((speaker: Speaker) => (
                                <div key={speaker.id} className="p-2 bg-white/10 rounded-md">
                                    <div className="flex items-center gap-2 mb-2">
                                        <input 
                                            type="text" 
                                            value={speaker.name}
                                            onChange={e => updateSpeaker(speaker.id, 'name', e.target.value)}
                                            className="w-full bg-transparent font-semibold focus:outline-none"
                                        />
                                        {projectData.speakers.length > 2 && (
                                            <button onClick={() => removeSpeaker(speaker.id)} className="w-6 h-6 rounded-full hover:bg-red-500/50 flex items-center justify-center text-xs"><i className="fi fi-rr-trash"></i></button>
                                        )}
                                    </div>
                                    <select 
                                        value={speaker.voice} 
                                        onChange={e => updateSpeaker(speaker.id, 'voice', e.target.value)}
                                        className="w-full p-2 bg-white/5 border border-border-color rounded-md text-sm"
                                    >
                                        {voices.map(v => <option key={v} value={v} className="bg-gray-800">{v}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                        <button onClick={addSpeaker} className="w-full mt-3 p-2 text-center bg-white/10 text-xs rounded-md hover:bg-white/20">Add Speaker</button>
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
