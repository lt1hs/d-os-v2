import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateImage, generateFromImageAndText } from '../../services/geminiService';
import { CreativeAppProps } from '../../types';
import { ProjectSelectionScreen } from '../ProjectSelectionScreen';


const aspectRatios = ["16:9", "1:1", "9:16", "4:3", "3:4"];
const stylePresets = ["None", "Photorealistic", "Anime", "Fantasy", "Cyberpunk", "Vintage", "Minimalist"];
const fonts = ["Inter", "Arial", "Georgia", "Courier New", "Verdana"];

const loadingMessages = [
    "Warming up the AI's creativity circuits...",
    "Mixing digital paints and pixels...",
    "Consulting with the muse of algorithms...",
    "Translating your words into a visual masterpiece...",
    "Generating awesomeness, please wait..."
];

const Select: React.FC<{ label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: string[] }> = ({ label, value, onChange, options }) => (
    <div>
        <label className="text-sm font-medium text-white/70">{label}</label>
        <div className="relative mt-1">
            <select value={value} onChange={onChange} className="w-full p-2 appearance-none bg-white/5 border border-border-color rounded-md text-sm focus:ring-2 focus:ring-brand-blue focus:border-brand-blue">
                {options.map(o => <option key={o} value={o} className="bg-gray-800">{o}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
        </div>
    </div>
);

const getInitialProjectData = () => ({
    mode: 'create',
    prompt: 'A photorealistic image of a futuristic city skyline at dusk, with flying cars and neon lights.',
    negativePrompt: '',
    stylePreset: 'Photorealistic',
    aspectRatio: '16:9',
    uploadedImage: null,
    generatedImage: null,
    rightPanelTab: 'remix',
    remixAspectRatio: 'original',
    brandLogo: { src: null, position: 'bottom-right' },
    brandColor: '#3b82f6',
    brandColorOpacity: 0,
    brandText: { content: 'AI Studio', font: 'Inter', color: '#ffffff', position: 'bottom' },
});


export const ImageStudio: React.FC<CreativeAppProps> = (props) => {
    const { projects, appId, activeProjectId, onSetActiveProjectId, onUpdateProject, onCreateProject, onDeleteProject, appDefinition } = props;
    
    const activeProject = projects.find(p => p.id === activeProjectId);
    const projectData = activeProject?.data;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imagePreviewRef = useRef<HTMLImageElement>(null);
    
    const updateData = (newData: Partial<any>) => {
        if (!activeProject) return;
        onUpdateProject(activeProject.id, { ...projectData, ...newData });
    };

    const fileToBase64 = (file: File): Promise<{base64: string; dataUrl: string}> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
             const dataUrl = reader.result as string;
             const base64 = dataUrl.split(',')[1];
             resolve({base64, dataUrl});
        }
        reader.onerror = error => reject(error);
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            try {
                const { base64, dataUrl } = await fileToBase64(file);
                updateData({
                    uploadedImage: { name: file.name, type: file.type, dataUrl, base64 },
                    generatedImage: null
                });
                setError(null);
            } catch (err) { setError("Failed to load image file."); }
        } else { setError("Please select a valid image file."); }
    };
    
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateData({ brandLogo: {...projectData.brandLogo, src: reader.result as string} });
            }
            reader.readAsDataURL(file);
        }
    };

    const buildFullPrompt = (basePrompt: string) => {
        let fullPrompt = basePrompt;
        if (projectData.stylePreset !== 'None') fullPrompt = `${projectData.stylePreset} style, ${basePrompt}`;
        if (projectData.negativePrompt) fullPrompt += `, except for: ${projectData.negativePrompt}`;
        return fullPrompt;
    };

    const handleGenerate = useCallback(async () => {
        if (!projectData.prompt) { setError('Please enter a prompt.'); return; }
        if (projectData.mode === 'edit' && !projectData.uploadedImage) { setError('Please upload an image to edit.'); return; }

        setIsLoading(true);
        setError(null);
        updateData({ generatedImage: null });

        const messageInterval = setInterval(() => setLoadingMessage(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]), 2500);
        setLoadingMessage(loadingMessages[0]);

        try {
            const fullPrompt = buildFullPrompt(projectData.prompt);
            let imageB64;
            if (projectData.mode === 'create') {
                imageB64 = await generateImage(fullPrompt, projectData.aspectRatio);
            } else if (projectData.mode === 'edit' && projectData.uploadedImage) {
                imageB64 = await generateFromImageAndText(fullPrompt, projectData.uploadedImage.base64, projectData.uploadedImage.type);
            } else { throw new Error("Invalid state for generation."); }
            
            const generatedImageUrl = `data:image/jpeg;base64,${imageB64}`;
            onUpdateProject(activeProject!.id, { ...projectData, generatedImage: generatedImageUrl }, generatedImageUrl);

        } catch (err) {
            if (err instanceof Error) setError(err.message);
            else setError('An unknown error occurred.');
        } finally {
            setIsLoading(false);
            clearInterval(messageInterval);
        }
    }, [projectData, activeProject, onUpdateProject]);

    const handleUpscale = useCallback(async () => {
        if (!projectData.prompt) { setError('Cannot upscale without the original prompt.'); return; }
        setIsLoading(true);
        setError(null);
        updateData({ generatedImage: null });
        const messageInterval = setInterval(() => setLoadingMessage("Upscaling with more detail..."), 2500);
        setLoadingMessage("Enhancing image quality...");
        try {
            const upscalePrompt = `4k, ultra realistic, high detail, masterpiece, ${buildFullPrompt(projectData.prompt)}`;
            const imageB64 = await generateImage(upscalePrompt, projectData.aspectRatio);
            const generatedImageUrl = `data:image/jpeg;base64,${imageB64}`;
            onUpdateProject(activeProject!.id, { ...projectData, generatedImage: generatedImageUrl }, generatedImageUrl);
        } catch (err) {
            if (err instanceof Error) setError(err.message);
            else setError('An unknown error occurred during upscaling.');
        } finally {
            setIsLoading(false);
            clearInterval(messageInterval);
        }
    }, [projectData, activeProject, onUpdateProject]);

    const downloadImage = async () => {
        const canvas = canvasRef.current;
        const image = imagePreviewRef.current;
        if (!canvas || !image || !projectData.generatedImage) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const getAspectRatioFromString = (ar: string): number => {
            if (ar === 'original' || !image.naturalWidth) return image.naturalWidth / image.naturalHeight;
            const [w, h] = ar.split(':').map(Number);
            return w / h;
        };
        
        const originalWidth = image.naturalWidth;
        const originalHeight = image.naturalHeight;
        const targetAspectRatio = getAspectRatioFromString(projectData.remixAspectRatio);

        let sx = 0, sy = 0, sWidth = originalWidth, sHeight = originalHeight;
        const originalAspectRatio = originalWidth / originalHeight;

        if (targetAspectRatio > originalAspectRatio) {
            sHeight = originalWidth / targetAspectRatio;
            sy = (originalHeight - sHeight) / 2;
        } else {
            sWidth = originalHeight * targetAspectRatio;
            sx = (originalWidth - sWidth) / 2;
        }

        canvas.width = sWidth;
        canvas.height = sHeight;
        
        ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

        if (projectData.brandColorOpacity > 0) {
            ctx.fillStyle = projectData.brandColor;
            ctx.globalAlpha = projectData.brandColorOpacity;
            ctx.fillRect(0, 0, sWidth, sHeight);
            ctx.globalAlpha = 1.0;
        }

        if (projectData.brandLogo.src) {
            await new Promise((resolve) => {
                const logoImg = new Image();
                logoImg.onload = () => {
                    const logoWidth = sWidth / 8;
                    const logoHeight = logoImg.height * (logoWidth / logoImg.width);
                    const padding = sWidth * 0.02;
                    let dx = padding, dy = padding;
                    if (projectData.brandLogo.position.includes('right')) dx = sWidth - logoWidth - padding;
                    if (projectData.brandLogo.position.includes('bottom')) dy = sHeight - logoHeight - padding;
                    ctx.drawImage(logoImg, dx, dy, logoWidth, logoHeight);
                    resolve(true);
                };
                logoImg.src = projectData.brandLogo.src;
            });
        }

        if (projectData.brandText.content) {
            const fontSize = Math.max(16, sWidth / 30);
            ctx.font = `bold ${fontSize}px ${projectData.brandText.font}`;
            ctx.fillStyle = projectData.brandText.color;
            ctx.textAlign = 'center';
            const padding = sHeight * 0.05;
            let y = padding;
            if (projectData.brandText.position === 'bottom') {
                y = sHeight - padding;
                ctx.textBaseline = 'bottom';
            } else {
                ctx.textBaseline = 'top';
            }
            ctx.fillText(projectData.brandText.content, sWidth / 2, y);
        }
        
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.download = `ai-studio-remix-${Date.now()}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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

    const logoPositionClasses = {
        'top-left': 'top-2 left-2', 'top-right': 'top-2 right-2',
        'bottom-left': 'bottom-2 left-2', 'bottom-right': 'bottom-2 right-2'
    };
    
    const textPositionClasses = {
        'top': 'top-4 left-1/2 -translate-x-1/2',
        'bottom': 'bottom-4 left-1/2 -translate-x-1/2'
    };

    return (
        <div className="flex h-full w-full gap-4 text-white/90 p-4">
            <button onClick={() => onSetActiveProjectId(appId, null)} className="absolute top-12 left-2 text-xs px-2 py-1 bg-black/30 rounded-full z-10 hover:bg-black/50">&lt; Back to Projects</button>
            <canvas ref={canvasRef} className="hidden"></canvas>
            <div className="w-1/4 min-w-[280px] flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
                <h3 className="text-lg font-semibold pt-6">{activeProject.name}</h3>
                <div className="flex bg-white/5 rounded-lg p-1">
                    <button onClick={() => updateData({ mode: 'create' })} className={`w-1/2 py-1.5 rounded-md text-sm font-semibold transition-colors ${projectData.mode === 'create' ? 'bg-brand-blue' : 'hover:bg-white/10'}`}>Create</button>
                    <button onClick={() => updateData({ mode: 'edit' })} className={`w-1/2 py-1.5 rounded-md text-sm font-semibold transition-colors ${projectData.mode === 'edit' ? 'bg-brand-blue' : 'hover:bg-white/10'}`}>Edit</button>
                </div>
                {projectData.mode === 'edit' && (
                    <div>
                        <label className="text-sm font-medium text-white/70">Source Image</label>
                        <div onClick={() => fileInputRef.current?.click()} className="mt-1 w-full h-32 border-2 border-dashed border-border-color rounded-lg flex items-center justify-center text-center text-white/50 cursor-pointer hover:border-brand-blue hover:bg-white/5 transition-colors">
                            {projectData.uploadedImage ? <img src={projectData.uploadedImage.dataUrl} className="max-h-full max-w-full object-contain rounded-md p-1" /> : "Click to upload image"}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    </div>
                )}
                <div>
                    <label htmlFor="prompt" className="text-sm font-medium text-white/70">Prompt</label>
                    <textarea id="prompt" value={projectData.prompt} onChange={(e) => updateData({ prompt: e.target.value })} placeholder="Describe the image..." className="w-full mt-1 p-2 bg-white/5 border border-border-color rounded-md text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                </div>
                <div>
                    <label htmlFor="negative-prompt" className="text-sm font-medium text-white/70">Negative Prompt</label>
                    <textarea id="negative-prompt" value={projectData.negativePrompt} onChange={(e) => updateData({ negativePrompt: e.target.value })} placeholder="e.g., blurry, text, watermark" className="w-full mt-1 p-2 bg-white/5 border border-border-color rounded-md text-sm h-16 resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                </div>
                <Select label="Style Preset" value={projectData.stylePreset} onChange={(e) => updateData({ stylePreset: e.target.value })} options={stylePresets} />
                <Select label="Aspect Ratio" value={projectData.aspectRatio} onChange={(e) => updateData({ aspectRatio: e.target.value })} options={aspectRatios} />
                <div className="mt-auto pt-2">
                    <button onClick={handleGenerate} disabled={isLoading} className="w-full flex items-center justify-center gap-2 h-11 px-4 py-2 bg-brand-blue text-white font-semibold rounded-md hover:bg-brand-blue-hover disabled:bg-gray-500/50 disabled:cursor-not-allowed transition-colors">
                        <i className="fi fi-rr-magic-wand"></i>
                        {isLoading ? 'Generating...' : 'Generate'}
                    </button>
                </div>
            </div>

            <div className="w-1/2 flex flex-col bg-black/20 rounded-lg overflow-hidden border border-border-color">
                <div className="flex-grow flex items-center justify-center p-4 relative" style={{ background: 'repeating-conic-gradient(#374151 0% 25%, #4b5563 0% 50%) 50% / 20px 20px' }}>
                    {isLoading && <div className="text-center p-4 bg-window-bg/80 rounded-lg backdrop-blur-sm"><div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div><p className="text-white font-medium">{loadingMessage}</p></div>}
                    {error && <div className="text-center text-red-400 p-4 max-w-sm bg-red-900/40 rounded-lg border border-red-500/50"><p className="font-bold text-lg">Generation Failed</p><p className="text-sm mt-1">{error}</p></div>}
                    {!isLoading && !error && (
                        <div className="w-full h-full flex items-center justify-center">
                            {projectData.generatedImage ? (
                                <div className="relative max-w-full max-h-full shadow-lg" style={{ aspectRatio: projectData.remixAspectRatio === 'original' ? 'auto' : projectData.remixAspectRatio.replace(':', ' / ') }}>
                                    <img ref={imagePreviewRef} src={projectData.generatedImage} alt="Generated by AI" className="w-full h-full object-cover" crossOrigin="anonymous"/>
                                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: projectData.brandColor, opacity: projectData.brandColorOpacity }} />
                                    {projectData.brandLogo.src && <img src={projectData.brandLogo.src} className={`absolute w-1/6 max-w-[100px] pointer-events-none p-2 ${logoPositionClasses[projectData.brandLogo.position]}`} />}
                                    {projectData.brandText.content && <p className={`absolute text-center w-full px-4 pointer-events-none font-bold text-shadow ${textPositionClasses[projectData.brandText.position]}`} style={{ color: projectData.brandText.color, fontFamily: projectData.brandText.font, fontSize: 'clamp(12px, 4vw, 48px)', textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>{projectData.brandText.content}</p>}
                                </div>
                            ) : (
                                <div className="text-center text-white/50 p-4"><p>Your generated image will appear here.</p></div>
                            )}
                        </div>
                    )}
                </div>
                {projectData.generatedImage && !isLoading && (
                    <div className="flex-shrink-0 p-2 bg-black/30 border-t border-border-color flex justify-end gap-2">
                        <button onClick={handleUpscale} className="px-3 py-1.5 bg-white/10 text-white/80 text-sm font-medium rounded-md hover:bg-white/20 transition-colors">Upscale</button>
                        <button onClick={downloadImage} className="px-3 py-1.5 bg-white/10 text-white/80 text-sm font-medium rounded-md hover:bg-white/20 transition-colors">Download</button>
                    </div>
                )}
            </div>

            <div className="w-1/4 min-w-[280px] flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
                 <div className="flex bg-white/5 rounded-lg p-1">
                    <button onClick={() => updateData({ rightPanelTab: 'remix' })} className={`w-1/2 py-1.5 rounded-md text-sm font-semibold transition-colors ${projectData.rightPanelTab === 'remix' ? 'bg-brand-blue' : 'hover:bg-white/10'}`}>Remix</button>
                    <button onClick={() => updateData({ rightPanelTab: 'brand' })} className={`w-1/2 py-1.5 rounded-md text-sm font-semibold transition-colors ${projectData.rightPanelTab === 'brand' ? 'bg-brand-blue' : 'hover:bg-white/10'}`}>Brand Kit</button>
                </div>

                {projectData.rightPanelTab === 'remix' && (
                    <div className="bg-white/5 p-3 rounded-lg border border-border-color animate-fade-in">
                        <h4 className="text-md font-semibold mb-2">Visual Remix 2.0</h4>
                        <p className="text-xs text-white/60 mb-3">One-click adaptation for any platform.</p>
                        <div className="grid grid-cols-2 gap-2">
                            {['original', '1:1', '9:16', '16:9'].map(ar => (
                                <button key={ar} onClick={() => updateData({ remixAspectRatio: ar })} className={`py-1.5 rounded text-xs font-semibold transition-colors ${projectData.remixAspectRatio === ar ? 'bg-brand-blue' : 'bg-white/10 hover:bg-white/20'}`}>{ar}</button>
                            ))}
                        </div>
                    </div>
                )}

                {projectData.rightPanelTab === 'brand' && (
                    <div className="bg-white/5 p-3 rounded-lg border border-border-color animate-fade-in">
                        <h4 className="text-md font-semibold mb-2">Brand Kit AI</h4>
                        <div className="space-y-2 mb-4">
                            <label className="text-sm font-medium text-white/70">Logo Overlay</label>
                            <button onClick={() => logoInputRef.current?.click()} className="w-full p-2 text-center bg-white/10 text-xs rounded-md hover:bg-white/20">Upload Logo</button>
                            <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/png, image/svg+xml" className="hidden"/>
                            <div className="grid grid-cols-2 gap-2">
                                {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => (
                                    <button key={pos} onClick={() => updateData({ brandLogo: { ...projectData.brandLogo, position: pos }})} className={`py-1 rounded text-xs transition-colors ${projectData.brandLogo.position === pos ? 'bg-brand-blue' : 'bg-white/10 hover:bg-white/20'}`}>{pos.replace('-', ' ')}</button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2 mb-4">
                            <label className="text-sm font-medium text-white/70">Text Overlay</label>
                            <input type="text" value={projectData.brandText.content} onChange={e => updateData({ brandText: {...projectData.brandText, content: e.target.value}})} className="w-full p-2 bg-white/5 border border-border-color rounded-md text-sm" placeholder="Your Text Here" />
                            <div className="flex gap-2">
                                <Select label="" value={projectData.brandText.font} onChange={e => updateData({ brandText: {...projectData.brandText, font: e.target.value}})} options={fonts} />
                                <input type="color" value={projectData.brandText.color} onChange={e => updateData({ brandText: {...projectData.brandText, color: e.target.value}})} className="w-10 h-10 p-1 bg-white/5 rounded-md"/>
                            </div>
                             <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => updateData({ brandText: {...projectData.brandText, position: 'top'}})} className={`py-1 rounded text-xs transition-colors ${projectData.brandText.position === 'top' ? 'bg-brand-blue' : 'bg-white/10 hover:bg-white/20'}`}>Top</button>
                                <button onClick={() => updateData({ brandText: {...projectData.brandText, position: 'bottom'}})} className={`py-1 rounded text-xs transition-colors ${projectData.brandText.position === 'bottom' ? 'bg-brand-blue' : 'bg-white/10 hover:bg-white/20'}`}>Bottom</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm font-medium text-white/70">Color Overlay</label>
                             <div className="flex items-center gap-2">
                                <input type="color" value={projectData.brandColor} onChange={e => updateData({ brandColor: e.target.value })} className="w-10 h-10 p-1 bg-white/5 rounded-md"/>
                                <input type="range" min="0" max="1" step="0.05" value={projectData.brandColorOpacity} onChange={e => updateData({ brandColorOpacity: parseFloat(e.target.value) })} className="w-full"/>
                             </div>
                        </div>
                         <button disabled className="w-full p-2 text-center bg-white/5 text-xs rounded-md mt-4 opacity-50 cursor-not-allowed">AI Logo Variants (Soon)</button>
                    </div>
                )}
            </div>
        </div>
    );
};
