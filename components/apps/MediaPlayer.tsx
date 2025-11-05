import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CloudFile, CloudFolder, MediaState } from '../../types';

interface MediaPlayerProps {
  files: CloudFile[];
  folders: CloudFolder[];
  mediaState: MediaState;
  onPlayTrack: (track: CloudFile, playlist: CloudFile[]) => void;
  onTogglePlay: () => void;
  onPlayNext: () => void;
  onPlayPrev: () => void;
}

const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const MediaPlayer: React.FC<MediaPlayerProps> = (props) => {
    const { files, folders, mediaState, onPlayTrack, onTogglePlay, onPlayNext, onPlayPrev } = props;
    const { isPlaying, currentTrack } = mediaState;

    const [currentFolderId, setCurrentFolderId] = useState('root');
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    
    const playerRef = useRef<HTMLVideoElement>(null);

    const mediaFiles = files.filter(f => f.type === 'video' || f.type === 'audio');
    const foldersInCurrentDir = folders.filter(f => f.parentId === currentFolderId);
    const filesInCurrentDir = mediaFiles.filter(f => f.parentId === currentFolderId);

    useEffect(() => {
        const player = playerRef.current;
        if (!player) return;

        if (isPlaying) {
            player.play().catch(e => console.error("Playback error:", e));
        } else {
            player.pause();
        }
    }, [isPlaying]);

    useEffect(() => {
        const player = playerRef.current;
        if (player && currentTrack && player.src !== currentTrack.url) {
            player.src = currentTrack.url!;
            if (isPlaying) {
                player.play().catch(e => console.error("Playback error on src change:", e));
            }
        }
    }, [currentTrack, isPlaying]);
    
    const handlePlayTrack = (track: CloudFile) => {
        onPlayTrack(track, filesInCurrentDir);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        if (playerRef.current) playerRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        if (playerRef.current) playerRef.current.volume = newVolume;
        setVolume(newVolume);
    };

    return (
        <div className="flex h-full w-full bg-black/10 text-white/90 rounded-b-lg">
            <aside className="w-1/3 min-w-[250px] bg-black/20 p-2 border-r border-border-color flex flex-col">
                <h3 className="text-md font-semibold p-2">Media Library</h3>
                <div className="flex-grow overflow-y-auto">
                    {currentFolderId !== 'root' && (
                        <button onClick={() => setCurrentFolderId('root')} className="flex items-center gap-2 w-full p-2 rounded hover:bg-white/10 text-sm">
                            <i className="fi fi-rr-arrow-left"></i> Back to Root
                        </button>
                    )}
                    {foldersInCurrentDir.map(folder => (
                        <button key={folder.id} onClick={() => setCurrentFolderId(folder.id)} className="flex items-center gap-2 w-full p-2 rounded hover:bg-white/10 text-sm">
                            <i className="fi fi-rr-folder text-amber-400"></i>
                            <span className="truncate">{folder.name}</span>
                        </button>
                    ))}
                    {filesInCurrentDir.map(file => (
                        <button key={file.id} onClick={() => handlePlayTrack(file)} className={`flex items-center gap-2 w-full p-2 rounded text-left text-sm ${currentTrack?.id === file.id ? 'bg-brand-blue/50' : 'hover:bg-white/10'}`}>
                            {file.type === 'video' ? <i className="fi fi-rr-film text-red-400"></i> : <i className="fi fi-rr-music-alt text-cyan-400"></i>}
                            <span className="truncate">{file.name}</span>
                        </button>
                    ))}
                </div>
            </aside>
            <main className="flex-1 flex flex-col items-center justify-between bg-black/30">
                 <div className="flex-grow w-full flex items-center justify-center p-4 relative">
                    <video
                        ref={playerRef}
                        className={`max-w-full max-h-full ${currentTrack?.type === 'video' ? 'block' : 'hidden'}`}
                        onTimeUpdate={() => setCurrentTime(playerRef.current?.currentTime || 0)}
                        onLoadedMetadata={() => setDuration(playerRef.current?.duration || 0)}
                        onEnded={onPlayNext}
                    />
                    {(!currentTrack || currentTrack.type === 'audio') && (
                        <div className="text-center text-white/50">
                            {currentTrack ? (
                                <>
                                    <i className="fi fi-rr-music text-9xl"></i>
                                    <p className="mt-4 font-semibold text-lg max-w-md truncate">{currentTrack.name}</p>
                                </>
                            ) : (
                                <>
                                    <i className="fi fi-rr-play-circle text-8xl"></i>
                                    <p className="mt-4">Select a file to play</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
                <div className="w-full max-w-2xl p-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono">{formatTime(currentTime)}</span>
                        <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer range-sm"/>
                        <span className="text-xs font-mono">{formatTime(duration)}</span>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-3">
                        <button onClick={onPlayPrev} disabled={mediaState.playlist.length < 2} className="text-2xl disabled:opacity-50"><i className="fi fi-rr-backward"></i></button>
                        <button onClick={onTogglePlay} disabled={!currentTrack} className="w-14 h-14 bg-brand-blue rounded-full flex items-center justify-center text-3xl disabled:bg-gray-500">
                            {isPlaying ? <i className="fi fi-sr-pause"></i> : <i className="fi fi-sr-play"></i>}
                        </button>
                        <button onClick={onPlayNext} disabled={mediaState.playlist.length < 2} className="text-2xl disabled:opacity-50"><i className="fi fi-rr-forward"></i></button>
                        <div className="flex items-center gap-2">
                           <i className="fi fi-rr-volume"></i>
                           <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer range-sm"/>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};