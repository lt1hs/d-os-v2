import React, { useState } from 'react';
import { generateSpeech } from '../../services/geminiService';
import { CreativeAppProps } from '../../types';
import { ProjectSelectionScreen } from '../ProjectSelectionScreen';


type Mode = 'tts' | 'sts' | 'audio-gen';

const voices = [ "Kore", "Puck", "Charon", "Zephyr", "Fenrir" ];

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-full">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
    </div>
);

const getInitialProjectData = () => ({
    mode: 'tts',
    script: 'Hello, welcome to AI Studio. I can generate high-quality voiceovers from your text.',
    selectedVoice: voices[0],
    audioDataUrl: null,
});

export const AudioStudio: React.FC<CreativeAppProps> = (props) => {
    const { projects, appId, activeProjectId, onSetActiveProjectId, onUpdateProject, onCreateProject, onDeleteProject, appDefinition } = props;

    const activeProject = projects.find(p => p.id === activeProjectId);
    const projectData = activeProject?.data;
    const updateData = (newData: Partial<any>) => {
        if (!activeProject) return;
        onUpdateProject(activeProject.id, { ...projectData, ...newData });
    };

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!projectData.script) {
            setError('Please enter some text to generate audio.');
            return;
        }

        setIsLoading(true);
        setError(null);
        updateData({ audioDataUrl: null });

        try {
            if (projectData.mode === 'tts') {
                const result = await generateSpeech(projectData.script, projectData.selectedVoice);
                const dataUrl = `data:audio/mp3;base64,${result}`;
                updateData({ audioDataUrl: dataUrl });
                if(activeProject) onUpdateProject(activeProject.id, { ...projectData, audioDataUrl: dataUrl }, 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTEyLDRDOS43OSw0LDgsNS43OSw4LDhWMTZDOCwxOC4yMSw5Ljc5LDIwLDEyLDIwQzE0LjIxLDIwLDE2LDE4LjIxLDE2LDE2VjhDMTYsNS43OSwxNC4yMSw0LDEyLDRaTTE5LDE2QzE5LDE5Ljg3LDE1LjQ0LDIzLDEyLDIzQzguNTYsMjMsNSwxOS44Nyw1LDE2SDdWMTZDNywxOS4zMSw5LjY5LDIyLDEyLDIyQzE0LjMxLDIyLDE3LDE5LjMxLDE3LDE2VjhIMTlWMTZaIi8+PC9zdmc+');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
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

    const renderLeftPanel = () => (
        <div className="bg-white/5 p-3 rounded-lg border border-border-color flex-grow flex flex-col">
            {projectData.mode === 'tts' && (
                <>
                    <h4 className="text-md font-semibold mb-2">Text-to-Speech</h4>
                    <p className="text-xs text-white/60 mb-3">Enter your script below to generate a voiceover.</p>
                    <textarea 
                        value={projectData.script} 
                        onChange={e => updateData({ script: e.target.value })} 
                        placeholder="Type your script here..." 
                        className="w-full h-full p-2 bg-white/10 border border-border-color rounded-md text-sm resize-none"
                    />
                </>
            )}
            {projectData.mode === 'sts' && (
                 <div className="text-center text-white/60">
                     <h4 className="text-md font-semibold mb-2">Speech-to-Speech</h4>
                     <p className="text-xs">This feature is coming soon!</p>
                </div>
            )}
            {projectData.mode === 'audio-gen' && (
                 <div className="text-center text-white/60">
                     <h4 className="text-md font-semibold mb-2">Audio Generation</h4>
                     <p className="text-xs">This feature is coming soon!</p>
                 </div>
            )}
            <button onClick={handleGenerate} disabled={isLoading || projectData.mode !== 'tts'} className="mt-auto w-full flex items-center justify-center gap-2 h-11 px-4 py-2 bg-brand-blue text-white font-semibold rounded-md hover:bg-brand-blue-hover disabled:bg-gray-500/50 disabled:cursor-not-allowed">
                {isLoading ? 'Generating...' : 'Generate Audio'}
            </button>
        </div>
    );

    const renderCenterPanel = () => {
        if (isLoading) return <LoadingSpinner />;
        if (error) return <div className="text-center text-red-400 p-4">{error}</div>;

        if (projectData.audioDataUrl) {
             return (
                <div className="flex flex-col items-center justify-center h-full p-4">
                    <h4 className="text-lg font-semibold mb-4">Generated Voiceover</h4>
                    <audio controls src={projectData.audioDataUrl} className="w-full max-w-sm">
                        Your browser does not support the audio element.
                    </audio>
                </div>
            );
        }
        
        return <p className="text-center text-white/50 p-4">Your generated audio will appear here.</p>;
    };
    
    const renderRightPanel = () => (
        <div className="bg-white/5 p-3 rounded-lg border border-border-color flex-grow overflow-y-auto">
            {projectData.mode === 'tts' && (
                <>
                    <h4 className="text-md font-semibold mb-3">Voice Selection</h4>
                    <div className="space-y-2">
                        {voices.map(voice => (
                            <button
                                key={voice}
                                onClick={() => updateData({ selectedVoice: voice })}
                                className={`w-full p-2 text-left rounded-md text-sm font-medium transition-colors ${projectData.selectedVoice === voice ? 'bg-brand-blue' : 'bg-white/10 hover:bg-brand-blue/50'}`}
                            >
                                {voice}
                            </button>
                        ))}
                    </div>
                </>
            )}
            {(projectData.mode === 'sts' || projectData.mode === 'audio-gen') && (
                <p className="text-sm text-white/50 p-2">Controls for this mode will appear here.</p>
            )}
        </div>
    );

    return (
        <div className="flex h-full w-full gap-4 text-white/90 p-4">
            <button onClick={() => onSetActiveProjectId(appId, null)} className="absolute top-2 left-2 z-10 flex items-center gap-2 text-xs px-3 py-1.5 bg-dock-bg backdrop-blur-md border border-border-color rounded-full hover:bg-white/20 transition-colors font-sans"><i className="fi fi-rr-arrow-left text-xs" /> Back to Projects</button>
            <div className="w-1/4 min-w-[280px] flex flex-col gap-4">
                <h3 className="text-lg font-semibold pt-6">{activeProject.name}</h3>
                <div className="flex bg-white/5 rounded-lg p-1">
                    <button onClick={() => updateData({ mode: 'tts' })} className={`w-1/3 py-1.5 rounded-md text-sm font-semibold transition-colors ${projectData.mode === 'tts' ? 'bg-brand-blue' : 'hover:bg-white/10'}`}>Text-to-Speech</button>
                    <button onClick={() => updateData({ mode: 'sts' })} className={`w-1/3 py-1.5 rounded-md text-sm font-semibold transition-colors ${projectData.mode === 'sts' ? 'bg-brand-blue' : 'hover:bg-white/10'}`}>Speech-to-Speech</button>
                    <button onClick={() => updateData({ mode: 'audio-gen' })} className={`w-1/3 py-1.5 rounded-md text-sm font-semibold transition-colors ${projectData.mode === 'audio-gen' ? 'bg-brand-blue' : 'hover:bg-white/10'}`}>Audio Gen</button>
                </div>
                {renderLeftPanel()}
            </div>
            <div className="w-1/2 flex flex-col bg-black/20 rounded-lg border border-border-color">
                {renderCenterPanel()}
            </div>
            <div className="w-1/4 min-w-[280px] flex flex-col gap-4">
                {renderRightPanel()}
            </div>
        </div>
    );
};