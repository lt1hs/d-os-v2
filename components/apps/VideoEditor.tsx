import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { findStockFootage, generateSpeech } from '../../services/geminiService';
import { CreativeAppProps } from '../../types';
import { ProjectSelectionScreen } from '../ProjectSelectionScreen';


// Types
type MediaType = { id: string; type: 'video' | 'image' | 'audio'; url: string; description: string; duration?: number; };
type ClipType = { id: string; mediaId: string; trackId: string; start: number; duration: number; };
type TrackType = { id: string; type: 'video' | 'audio' | 'text'; clips: ClipType[]; };
type DraggingState = { clipId: string; startOffset: number; type: 'move' } | { clipId: string; type: 'resize-right'; originalDuration: number; originalStart: number; } | { clipId: string; type: 'resize-left'; originalStart: number; originalEnd: number; };

const PIXELS_PER_SECOND = 50;
const RESIZE_HANDLE_WIDTH = 8;

const getInitialProjectData = () => ({
    media: [],
    timeline: [
        { id: 'track-v1', type: 'video', clips: [] },
        { id: 'track-a1', type: 'audio', clips: [] },
    ],
    playheadPosition: 0,
});

export const VideoEditor: React.FC<CreativeAppProps> = (props) => {
    const { projects, appId, activeProjectId, onSetActiveProjectId, onUpdateProject, onCreateProject, onDeleteProject, appDefinition } = props;

    const activeProject = projects.find(p => p.id === activeProjectId);
    const projectData = activeProject?.data;
    const updateData = (newData: Partial<any>) => {
        if (!activeProject) return;
        onUpdateProject(activeProject.id, { ...projectData, ...newData });
    };

    // UI State
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [draggingState, setDraggingState] = useState<DraggingState | null>(null);
    
    // Refs
    const timelineContainerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    // FIX: Initialize useRef with null and update the types to allow null.
    // This resolves the TypeScript error "Expected 1 arguments, but got 0"
    // by ensuring the correct useRef overload is used for both refs.
    const animationFrameRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // AI Tools State
    const [stockFootagePrompt, setStockFootagePrompt] = useState('');
    const [voiceoverScript, setVoiceoverScript] = useState('Welcome to the future of video editing.');
    const [isAILoading, setIsAILoading] = useState<Record<string, boolean>>({});

    // Derived State
    const totalDuration = useMemo(() => {
        if (!projectData) return 30;
        const allClips = projectData.timeline.flatMap((t: TrackType) => t.clips);
        if (allClips.length === 0) return 30;
        return Math.max(...allClips.map((c: ClipType) => c.start + c.duration), 30);
    }, [projectData]);

    const timelineWidth = totalDuration * PIXELS_PER_SECOND;
    const selectedClip = projectData?.timeline.flatMap((t: TrackType) => t.clips).find((c: ClipType) => c.id === selectedClipId);

    // Media Handling
    const handleImportMedia = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
        
        Array.from(files).forEach((file: File) => {
            const url = URL.createObjectURL(file);
            const mediaType = file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image';
            
            const newMedia: MediaType = { id: `media-${Date.now()}-${Math.random()}`, type: mediaType, url, description: file.name };

            const mediaElement = document.createElement(mediaType === 'image' ? 'img' : mediaType);
            mediaElement.src = url;
            const onLoaded = () => {
                newMedia.duration = (mediaElement as HTMLVideoElement).duration || (mediaType === 'image' ? 5 : 0);
                updateData({ media: [...projectData.media, newMedia] });
            };

            if(mediaType === 'image') mediaElement.onload = onLoaded;
            else (mediaElement as HTMLVideoElement).onloadedmetadata = onLoaded;
        });
    };
    
    const handleAILoading = (key: string, value: boolean) => setIsAILoading(prev => ({ ...prev, [key]: value }));

    const handleFindStockFootage = async () => {
        if (!stockFootagePrompt) return;
        handleAILoading('stock', true);
        try {
            const results = await findStockFootage(stockFootagePrompt);
            const newMediaItems: MediaType[] = [];
            await Promise.all(results.map(r => new Promise(resolve => {
                const video = document.createElement('video');
                video.src = r.url;
                video.onloadedmetadata = () => {
                     newMediaItems.push({...r, duration: video.duration});
                     resolve(true);
                };
            })));
            updateData({ media: [...projectData.media, ...newMediaItems] });
        } catch (error) { console.error("Failed to find stock footage:", error); }
        finally { handleAILoading('stock', false); }
    };

    const handleGenerateVoiceover = async () => {
        if (!voiceoverScript) return;
        handleAILoading('voiceover', true);
        try {
            const audioB64 = await generateSpeech(voiceoverScript, 'Zephyr');
            const url = `data:audio/mp3;base64,${audioB64}`;
            const audio = new Audio(url);
            audio.onloadedmetadata = () => {
                const newAudio: MediaType = {
                    id: `vo-${Date.now()}`, type: 'audio', url,
                    description: `AI Voiceover: "${voiceoverScript.substring(0, 20)}..."`,
                    duration: audio.duration
                };
                updateData({ media: [...projectData.media, newAudio] });
            };
        } catch (error) { console.error("Failed to generate voiceover:", error); }
        finally { handleAILoading('voiceover', false); }
    };

    const handleDropOnTrack = (e: React.DragEvent, trackId: string) => {
        e.preventDefault();
        const mediaId = e.dataTransfer.getData('mediaId');
        const mediaItem = projectData.media.find((m: MediaType) => m.id === mediaId);
        const track = projectData.timeline.find((t: TrackType) => t.id === trackId);
        
        if (!mediaItem || !track || (mediaItem.type !== track.type && !(mediaItem.type === 'image' && track.type === 'video'))) return;
        
        const timelineRect = timelineContainerRef.current!.getBoundingClientRect();
        const dropX = e.clientX - timelineRect.left;
        const start = dropX / PIXELS_PER_SECOND;

        const newClip: ClipType = {
            id: `clip-${Date.now()}`, mediaId, trackId, start,
            duration: mediaItem.type === 'image' ? 5 : (mediaItem.duration || 10)
        };

        const newTimeline = projectData.timeline.map((t: TrackType) => t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t);
        updateData({ timeline: newTimeline });
    };
    
    const togglePlay = () => setIsPlaying(p => !p);

    useEffect(() => {
        if (isPlaying) {
            lastTimeRef.current = performance.now();
            const animate = (time: number) => {
                const deltaTime = (time - (lastTimeRef.current || time)) / 1000;
                const newPos = projectData.playheadPosition + deltaTime;
                if (newPos >= totalDuration) {
                    setIsPlaying(false);
                    updateData({ playheadPosition: 0 });
                } else {
                    updateData({ playheadPosition: newPos });
                }
                lastTimeRef.current = time;
                animationFrameRef.current = requestAnimationFrame(animate);
            };
            animationFrameRef.current = requestAnimationFrame(animate);
        } else {
            if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
        return () => { if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current) };
    }, [isPlaying, totalDuration, projectData]);

    const activeVideoClip = useMemo(() => {
        if (!projectData) return null;
        const videoTrack = projectData.timeline.find((t: TrackType) => t.type === 'video');
        return videoTrack?.clips.find((c: ClipType) => projectData.playheadPosition >= c.start && projectData.playheadPosition < c.start + c.duration);
    }, [projectData]);
    
    useEffect(() => {
        if (videoRef.current && activeVideoClip) {
            const mediaItem = projectData.media.find((m: MediaType) => m.id === activeVideoClip.mediaId);
            if (mediaItem && mediaItem.url) {
                if (videoRef.current.src !== mediaItem.url) {
                    videoRef.current.src = mediaItem.url;
                }
                const clipTime = projectData.playheadPosition - activeVideoClip.start;
                videoRef.current.currentTime = clipTime;
                isPlaying ? videoRef.current.play().catch(console.error) : videoRef.current.pause();
            }
        } else if (videoRef.current) {
            videoRef.current.pause();
            if (videoRef.current.getAttribute('src')) {
                videoRef.current.removeAttribute('src');
                videoRef.current.load();
            }
        }
    }, [activeVideoClip, projectData, isPlaying]);

    const handleClipMouseDown = (e: React.MouseEvent, clip: ClipType) => {
        e.stopPropagation();
        setSelectedClipId(clip.id);
        const timelineRect = timelineContainerRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - timelineRect.left;
        
        const clipStartPos = clip.start * PIXELS_PER_SECOND;
        const clipEndPos = (clip.start + clip.duration) * PIXELS_PER_SECOND;

        if (mouseX > clipEndPos - RESIZE_HANDLE_WIDTH) {
            setDraggingState({ clipId: clip.id, type: 'resize-right', originalDuration: clip.duration, originalStart: clip.start });
        } else if (mouseX < clipStartPos + RESIZE_HANDLE_WIDTH) {
            setDraggingState({ clipId: clip.id, type: 'resize-left', originalStart: clip.start, originalEnd: clip.start + clip.duration });
        } else {
            setDraggingState({ clipId: clip.id, startOffset: mouseX - clipStartPos, type: 'move' });
        }
    };
    
    const handleTimelineMouseMove = useCallback((e: MouseEvent) => {
        if (!draggingState || !timelineContainerRef.current) return;
        const timelineRect = timelineContainerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - timelineRect.left;
        
        const newTimeline = projectData.timeline.map((track: TrackType) => ({
            ...track,
            clips: track.clips.map((clip: ClipType) => {
                if (clip.id !== draggingState.clipId) return clip;
                
                if (draggingState.type === 'move') {
                    const newStart = Math.max(0, (mouseX - draggingState.startOffset) / PIXELS_PER_SECOND);
                    return { ...clip, start: newStart };
                } else if (draggingState.type === 'resize-right') {
                    const newDuration = Math.max(1, (mouseX - (draggingState.originalStart * PIXELS_PER_SECOND)) / PIXELS_PER_SECOND);
                    return { ...clip, duration: newDuration };
                } else { // resize-left
                    const newStart = Math.max(0, Math.min(draggingState.originalEnd - 1, mouseX / PIXELS_PER_SECOND));
                    const newDuration = draggingState.originalEnd - newStart;
                    return { ...clip, start: newStart, duration: newDuration };
                }
            })
        }));
        updateData({ timeline: newTimeline });
    }, [draggingState, projectData]);

    const handleMouseUp = useCallback(() => setDraggingState(null), []);
    
    useEffect(() => {
        if (draggingState) {
            window.addEventListener('mousemove', handleTimelineMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleTimelineMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingState, handleTimelineMouseMove, handleMouseUp]);
    
    const updateSelectedClip = (props: Partial<ClipType>) => {
        if (!selectedClipId) return;
        const newTimeline = projectData.timeline.map((track: TrackType) => ({
            ...track,
            clips: track.clips.map((clip: ClipType) => clip.id === selectedClipId ? {...clip, ...props} : clip)
        }));
        updateData({ timeline: newTimeline });
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
        <div className="flex flex-col h-full w-full bg-black/10 text-white/90 p-4 gap-4">
             <button onClick={() => onSetActiveProjectId(appId, null)} className="absolute top-2 left-2 z-10 flex items-center gap-2 text-xs px-3 py-1.5 bg-dock-bg backdrop-blur-md border border-border-color rounded-full hover:bg-white/20 transition-colors font-sans"><i className="fi fi-rr-arrow-left text-xs" /> Back to Projects</button>
            <div className="flex-grow flex gap-4" style={{ minHeight: 0 }}>
                <div className="w-1/4 min-w-[280px] flex flex-col bg-white/5 p-3 rounded-lg border border-border-color">
                    <h3 className="text-md font-semibold mb-3">Media Bin</h3>
                    <input type="file" ref={fileInputRef} onChange={handleImportMedia} multiple accept="video/*,image/*,audio/*" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="w-full p-2 mb-3 text-center bg-white/10 text-xs rounded-md hover:bg-white/20">Import Media</button>
                    <div className="flex-grow overflow-y-auto space-y-2 pr-1">
                        {projectData.media.map((m: MediaType) => (
                            <div key={m.id} draggable onDragStart={(e) => e.dataTransfer.setData('mediaId', m.id)} className="p-2 bg-white/5 rounded flex items-center gap-2 cursor-grab hover:bg-white/10">
                                <div className="w-10 h-10 bg-black rounded flex items-center justify-center text-xl flex-shrink-0">
                                    {!m.url && <i className="fi fi-rr-file-excel text-red-400" title="Media offline"/>}
                                    {m.url && m.type === 'video' && <i className="fi fi-rr-film" />}
                                    {m.url && m.type === 'image' && <i className="fi fi-rr-picture" />}
                                    {m.url && m.type === 'audio' && <i className="fi fi-rr-waveform-path" />}
                                </div>
                                <p className={`text-xs flex-grow truncate ${!m.url ? 'text-red-400' : ''}`}>{m.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-1/2 flex flex-col bg-black/20 rounded-lg border border-border-color items-center justify-center">
                    <div className="w-full aspect-video bg-black flex items-center justify-center relative">
                        <video ref={videoRef} className="max-w-full max-h-full" muted />
                        {!activeVideoClip && <div className="text-white/50 absolute text-center p-4">
                            <p>Video Preview</p>
                             <p className="text-xs mt-2 text-yellow-400/80">Note: Media files are not saved between sessions and must be re-imported.</p>
                        </div>}
                    </div>
                </div>

                <div className="w-1/4 min-w-[280px] flex flex-col bg-white/5 p-3 rounded-lg border border-border-color overflow-y-auto">
                    {selectedClip ? (
                        <div className="animate-fade-in space-y-3">
                            <h3 className="text-md font-semibold">Inspector</h3>
                            <div>
                                <label className="text-xs">Start Time (s)</label>
                                <input type="number" value={selectedClip.start.toFixed(2)} onChange={e => updateSelectedClip({start: parseFloat(e.target.value)})} className="w-full p-1 bg-white/10 rounded mt-1"/>
                            </div>
                            <div>
                                <label className="text-xs">Duration (s)</label>
                                <input type="number" value={selectedClip.duration.toFixed(2)} onChange={e => updateSelectedClip({duration: parseFloat(e.target.value)})} className="w-full p-1 bg-white/10 rounded mt-1"/>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-md font-semibold mb-3">AI Tools</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-white/70">AI Stock Footage Finder</label>
                                    <div className="flex gap-2 mt-1">
                                        <input type="text" value={stockFootagePrompt} onChange={e => setStockFootagePrompt(e.target.value)} placeholder="e.g., city skyline" className="w-full p-2 bg-white/5 border border-border-color rounded-md text-sm"/>
                                        <button onClick={handleFindStockFootage} disabled={isAILoading.stock} className="px-3 bg-brand-blue rounded-md text-sm hover:bg-brand-blue-hover disabled:bg-gray-500">{isAILoading.stock ? '...' : <i className="fi fi-rr-search"/>}</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-white/70">AI Voiceover Generator</label>
                                    <textarea value={voiceoverScript} onChange={e => setVoiceoverScript(e.target.value)} className="w-full mt-1 p-2 bg-white/5 border border-border-color rounded-md text-sm h-16 resize-none" />
                                    <button onClick={handleGenerateVoiceover} disabled={isAILoading.voiceover} className="w-full mt-1 p-2 bg-brand-blue rounded-md text-sm hover:bg-brand-blue-hover disabled:bg-gray-500">{isAILoading.voiceover ? 'Generating...' : 'Generate Voiceover'}</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="h-48 flex-shrink-0 flex flex-col bg-white/5 p-2 rounded-lg border border-border-color">
                <div className="flex items-center gap-4 p-1">
                    <button onClick={togglePlay} className="text-xl">
                        {isPlaying ? <i className="fi fi-rr-pause"/> : <i className="fi fi-rr-play"/>}
                    </button>
                    <div className="text-xs font-mono">{projectData.playheadPosition.toFixed(2)}s / {totalDuration.toFixed(2)}s</div>
                </div>
                <div className="flex-grow overflow-x-auto" ref={timelineContainerRef}>
                     <div className="relative h-full" style={{ width: `${timelineWidth}px` }}>
                         <div className="absolute top-0 h-full w-0.5 bg-red-500 z-20 pointer-events-none" style={{ left: `${projectData.playheadPosition * PIXELS_PER_SECOND}px` }} />
                        {projectData.timeline.map((track: TrackType) => (
                             <div 
                                key={track.id} 
                                className="h-10 bg-black/20 rounded-sm relative mt-1"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDropOnTrack(e, track.id)}
                            >
                                {track.clips.map((clip: ClipType) => {
                                    const clipMedia = projectData.media.find((m: MediaType) => m.id === clip.mediaId);
                                    return (
                                        <div
                                            key={clip.id}
                                            onClick={() => setSelectedClipId(clip.id)}
                                            onMouseDown={(e) => handleClipMouseDown(e, clip)}
                                            className={`h-full absolute rounded transition-colors duration-100 flex items-center ${selectedClipId === clip.id ? 'ring-2 ring-white z-10' : ''}`}
                                            style={{
                                                left: `${clip.start * PIXELS_PER_SECOND}px`,
                                                width: `${clip.duration * PIXELS_PER_SECOND}px`,
                                                backgroundColor: track.type === 'video' ? '#8b5cf6' : track.type === 'audio' ? '#22c55e' : '#f97316',
                                            }}
                                        >
                                            <div className="w-2 h-full absolute left-0 top-0 cursor-ew-resize" />
                                            <span className="text-xs text-white/80 p-1 truncate block pointer-events-none">{clipMedia?.description}</span>
                                            <div className="w-2 h-full absolute right-0 top-0 cursor-ew-resize" />
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
};