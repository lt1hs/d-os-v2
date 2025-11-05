import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration, Blob as GenAIBlob, Chat, GenerateContentResponse } from "@google/genai";
import { Agent, AgentType, VoiceAgentConfig, WebChatAgentConfig } from '../../types';

// --- Start of Voice Agent Editor and its helpers ---
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): GenAIBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
}

const controlLightFunctionDeclaration: FunctionDeclaration = {
  name: 'controlLight',
  parameters: {
    type: Type.OBJECT,
    description: 'Set the brightness and color temperature of a room light.',
    properties: {
      brightness: { type: Type.NUMBER, description: 'Light level from 0 to 100.' },
      colorTemperature: { type: Type.STRING, description: 'Color temperature: "daylight", "cool", or "warm".' },
    },
    required: ['brightness', 'colorTemperature'],
  },
};

const voices = ["Zephyr", "Puck", "Charon", "Kore", "Fenrir"];
type SessionState = 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
type TranscriptItem = { id: number; speaker: 'user' | 'model'; text: string; isFinal: boolean };
type ToolCallItem = { id: number, name: string, args: any };

const VoiceAgentEditor: React.FC<{ agent: Agent, onUpdate: (id: string, newConfig: Partial<VoiceAgentConfig>) => void, onBack: () => void }> = ({ agent, onUpdate, onBack }) => {
    const config = agent.config as VoiceAgentConfig;
    const updateConfig = (newConfig: Partial<VoiceAgentConfig>) => onUpdate(agent.id, newConfig);

    const [sessionState, setSessionState] = useState<SessionState>('IDLE');
    const [error, setError] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
    const [toolCalls, setToolCalls] = useState<ToolCallItem[]>([]);

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const playingSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef<number>(0);
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');

    const cleanup = useCallback(() => {
        scriptProcessorRef.current?.disconnect();
        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();
        playingSourcesRef.current.forEach(source => source.stop());
        
        scriptProcessorRef.current = null;
        mediaStreamRef.current = null;
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
        sessionPromiseRef.current = null;
        playingSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }, []);

    const handleToggleSession = async () => {
        if (sessionState === 'CONNECTED' || sessionState === 'CONNECTING') {
            try {
                const session = await sessionPromiseRef.current;
                session?.close();
            } catch (e) { console.error("Error closing session:", e); }
            finally {
                cleanup();
                setSessionState('DISCONNECTED');
            }
            return;
        }

        setSessionState('CONNECTING');
        setError(null);
        setTranscript([]);
        setToolCalls([]);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voice } } },
                    systemInstruction: config.systemInstruction,
                    tools: config.toolsEnabled ? [{ functionDeclarations: [controlLightFunctionDeclaration] }] : undefined,
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        setSessionState('CONNECTED');
                        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        const source = inputAudioContextRef.current.createMediaStreamSource(stream);
                        const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;
                        scriptProcessor.onaudioprocess = (event) => {
                            const inputData = event.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContextRef.current.destination);
                        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            const ctx = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(ctx.destination);
                            source.addEventListener('ended', () => playingSourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            playingSourcesRef.current.add(source);
                        }

                        if (message.serverContent?.interrupted) {
                            playingSourcesRef.current.forEach(source => source.stop());
                            playingSourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                        
                        const { inputTranscription, outputTranscription, turnComplete } = message.serverContent || {};
                        setTranscript(prev => {
                            let newTranscript = [...prev];
                            if (inputTranscription) {
                                currentInputTranscriptionRef.current += inputTranscription.text;
                                const existing = newTranscript.find(t => t.speaker === 'user' && !t.isFinal);
                                if (existing) existing.text = currentInputTranscriptionRef.current;
                                else newTranscript.push({id: Date.now(), speaker: 'user', text: currentInputTranscriptionRef.current, isFinal: false });
                            }
                            if (outputTranscription) {
                                currentOutputTranscriptionRef.current += outputTranscription.text;
                                const existing = newTranscript.find(t => t.speaker === 'model' && !t.isFinal);
                                if (existing) existing.text = currentOutputTranscriptionRef.current;
                                else newTranscript.push({id: Date.now(), speaker: 'model', text: currentOutputTranscriptionRef.current, isFinal: false });
                            }
                            if (turnComplete) {
                                newTranscript = newTranscript.map(t => ({...t, isFinal: true}));
                                currentInputTranscriptionRef.current = '';
                                currentOutputTranscriptionRef.current = '';
                            }
                            return newTranscript;
                        });
                        
                        if (message.toolCall?.functionCalls) {
                            const validFunctionCalls = message.toolCall.functionCalls.filter(
                                (fc): fc is typeof fc & { name: string } => !!fc.name
                            );
                            
                            if (validFunctionCalls.length > 0) {
                                const newCalls = validFunctionCalls.map(fc => ({ 
                                    id: Date.now() + Math.random(),
                                    name: fc.name, 
                                    args: fc.args || {} 
                                }));
                                setToolCalls(prev => [...prev, ...newCalls]);
                                // FIX: Correctly structure the functionResponses as an array of objects.
                                sessionPromiseRef.current?.then((session) => {
                                    const responses = validFunctionCalls.map(fc => ({
                                        id: fc.id,
                                        name: fc.name,
                                        response: { result: "ok, light adjusted." }
                                    }));
                                    session.sendToolResponse({ functionResponses: responses });
                                });
                            }
                        }
                    },
                    onerror: (e) => {
                        console.error('Session error:', e);
                        setError("An error occurred with the connection.");
                        setSessionState('ERROR');
                        cleanup();
                    },
                    onclose: () => {
                        setSessionState('DISCONNECTED');
                        cleanup();
                    },
                }
            });
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to start session.");
            setSessionState('ERROR');
            cleanup();
        }
    };
    
    useEffect(() => {
        return () => {
             sessionPromiseRef.current?.then(s => s?.close());
             cleanup();
        }
    }, [cleanup]);

    const orbStateClasses = { 'IDLE': 'bg-slate-500', 'CONNECTING': 'bg-yellow-500 animate-pulse', 'CONNECTED': 'bg-green-500 animate-pulse', 'DISCONNECTED': 'bg-slate-500', 'ERROR': 'bg-red-500' };
    const orbShadowColors = { 'IDLE': '#64748b', 'CONNECTING': '#eab308', 'CONNECTED': '#22c55e', 'DISCONNECTED': '#64748b', 'ERROR': '#ef4444' };

    return (
        <div className="flex h-full w-full gap-4 text-white/90 p-4">
             <button onClick={onBack} className="absolute top-2 left-2 z-10 flex items-center gap-2 text-xs px-3 py-1.5 bg-dock-bg backdrop-blur-md border border-border-color rounded-full hover:bg-white/20 transition-colors font-sans"><i className="fi fi-rr-arrow-left text-xs" /> Back to Dashboard</button>
            <div className="w-1/3 min-w-[320px] flex flex-col gap-4 overflow-y-auto pr-2">
                <h3 className="text-lg font-semibold pt-6">{agent.name}</h3>
                <div className="bg-white/5 p-3 rounded-lg border border-border-color space-y-4">
                     <div>
                        <label className="text-sm font-medium text-white/70">Agent Persona</label>
                        <textarea value={config.systemInstruction} onChange={e => updateConfig({ systemInstruction: e.target.value })} disabled={sessionState === 'CONNECTED'} placeholder="Describe your agent's personality..." className="w-full mt-1 p-2 bg-white/5 border border-border-color rounded-md text-sm h-32 resize-none disabled:opacity-50"/>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-white/70">Agent Voice</label>
                        <select value={config.voice} onChange={e => updateConfig({ voice: e.target.value })} disabled={sessionState === 'CONNECTED'} className="w-full mt-1 p-2 bg-white/5 border border-border-color rounded-md text-sm disabled:opacity-50">
                            {voices.map(v => <option key={v} value={v} className="bg-gray-800">{v}</option>)}
                        </select>
                    </div>
                     <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                         <div>
                            <p className="text-sm font-medium">Enable Function Calling</p>
                            <p className="text-xs text-white/60">Allow agent to use tools.</p>
                         </div>
                        <input type="checkbox" checked={config.toolsEnabled} onChange={e => updateConfig({ toolsEnabled: e.target.checked })} disabled={sessionState === 'CONNECTED'} className="form-checkbox w-5 h-5 bg-white/10 border-border-color text-brand-blue disabled:opacity-50"/>
                    </div>
                </div>
            </div>
            <div className="w-2/3 flex flex-col gap-4">
                <div className="h-1/3 bg-black/20 rounded-lg border border-border-color flex flex-col items-center justify-center gap-4">
                    <div className={`w-24 h-24 rounded-full transition-all duration-500 shadow-[0_0_20px_var(--tw-shadow-color)] ${orbStateClasses[sessionState]}`} style={{'--tw-shadow-color': orbShadowColors[sessionState]} as React.CSSProperties}></div>
                    <p className="font-semibold">{sessionState}</p>
                    <button onClick={handleToggleSession} className={`px-6 py-2 font-semibold rounded-full text-white transition-colors ${sessionState === 'CONNECTED' || sessionState === 'CONNECTING' ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-blue hover:bg-brand-blue-hover'}`}>
                        {sessionState === 'CONNECTED' || sessionState === 'CONNECTING' ? 'End Session' : 'Start Session'}
                    </button>
                    {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
                </div>
                 <div className="h-2/3 flex flex-col bg-black/20 rounded-lg border border-border-color">
                    <h4 className="text-md font-semibold p-2 border-b border-border-color flex-shrink-0">Live Transcript & Logs</h4>
                    <div className="flex-grow p-4 overflow-y-auto space-y-3">
                         {transcript.map(item => (
                             <div key={item.id} className={`flex ${item.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                                 <p className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${item.speaker === 'user' ? 'bg-brand-blue' : 'bg-white/10'}`}>{item.text}</p>
                             </div>
                         ))}
                          {toolCalls.map(item => (
                             <div key={item.id} className="p-3 bg-yellow-500/10 border-l-4 border-yellow-500 rounded-r-md font-mono text-xs">
                                 <p className="font-bold text-yellow-400">Tool Call: {item.name}</p>
                                 <pre className="mt-1 text-yellow-300/80 whitespace-pre-wrap">{JSON.stringify(item.args, null, 2)}</pre>
                             </div>
                         ))}
                    </div>
                 </div>
            </div>
        </div>
    );
};

// --- Start of Web Chat Editor and its helpers ---
const WebChatPreview: React.FC<{ config: WebChatAgentConfig }> = ({ config }) => {
    const [messages, setMessages] = useState<{ author: 'user' | 'model', text: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        chatRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: { systemInstruction: config.systemInstruction }
        });
        setMessages([{ author: 'model', text: config.welcomeMessage }]);
    }, [config]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        const userMessage = { author: 'user' as const, text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response: GenerateContentResponse = await chatRef.current!.sendMessage({ message: input });
            const modelMessage = { author: 'model' as const, text: response.text };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { author: 'model', text: 'Sorry, I encountered an error.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-80 h-[500px] bg-slate-800 rounded-2xl shadow-lg flex flex-col border border-border-color overflow-hidden">
            <header className="h-16 flex-shrink-0 flex items-center p-4 gap-3" style={{ backgroundColor: config.themeColor }}>
                <img src={config.avatarUrl} className="w-10 h-10 rounded-full object-cover" />
                <div>
                    <p className="font-bold">Chat Agent</p>
                    <p className="text-xs opacity-80">Online</p>
                </div>
            </header>
            <main className="flex-grow p-4 overflow-y-auto flex flex-col gap-3">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex items-end gap-2 ${msg.author === 'user' ? 'justify-end' : ''}`}>
                        {msg.author === 'model' && <img src={config.avatarUrl} className="w-6 h-6 rounded-full flex-shrink-0"/>}
                        <p className={`max-w-[80%] p-2.5 rounded-2xl text-sm ${msg.author === 'user' ? 'bg-blue-600 rounded-br-none' : 'bg-slate-700 rounded-bl-none'}`}>{msg.text}</p>
                    </div>
                ))}
                {isLoading && <div className="flex items-end gap-2"><img src={config.avatarUrl} className="w-6 h-6 rounded-full"/><div className="p-2.5 bg-slate-700 rounded-2xl rounded-bl-none"><div className="w-2 h-2 bg-white rounded-full animate-pulse-dot"></div></div></div>}
                <div ref={messagesEndRef} />
            </main>
            <footer className="p-2 border-t border-border-color">
                <div className="flex items-center gap-2">
                    <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Type a message..." className="w-full bg-slate-700 px-3 py-2 rounded-full text-sm focus:outline-none"/>
                    <button onClick={handleSend} className="w-9 h-9 flex items-center justify-center bg-blue-600 rounded-full text-white flex-shrink-0" style={{ backgroundColor: config.themeColor }}><i className="fi fi-rr-paper-plane-top"></i></button>
                </div>
            </footer>
        </div>
    );
};

const WebChatEditor: React.FC<{ agent: Agent, onUpdate: (id: string, newConfig: Partial<WebChatAgentConfig>) => void, onBack: () => void }> = ({ agent, onUpdate, onBack }) => {
    const config = agent.config as WebChatAgentConfig;
    const updateConfig = (newConfig: Partial<WebChatAgentConfig>) => onUpdate(agent.id, newConfig);

    return (
        <div className="flex h-full w-full gap-4 text-white/90 p-4">
            <button onClick={onBack} className="absolute top-2 left-2 z-10 flex items-center gap-2 text-xs px-3 py-1.5 bg-dock-bg backdrop-blur-md border border-border-color rounded-full hover:bg-white/20 transition-colors font-sans"><i className="fi fi-rr-arrow-left text-xs" /> Back to Dashboard</button>
            <div className="w-1/3 min-w-[320px] flex flex-col gap-4 overflow-y-auto pr-2">
                <h3 className="text-lg font-semibold pt-6">{agent.name}</h3>
                <div className="bg-white/5 p-3 rounded-lg border border-border-color space-y-4">
                    <div>
                        <label className="text-sm font-medium text-white/70">Agent Persona</label>
                        <textarea value={config.systemInstruction} onChange={e => updateConfig({ systemInstruction: e.target.value })} placeholder="Describe your agent's personality..." className="w-full mt-1 p-2 bg-white/5 border border-border-color rounded-md text-sm h-24 resize-none"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-white/70">Welcome Message</label>
                        <input type="text" value={config.welcomeMessage} onChange={e => updateConfig({ welcomeMessage: e.target.value })} className="w-full mt-1 p-2 bg-white/5 border border-border-color rounded-md text-sm"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-white/70">Avatar URL</label>
                        <input type="text" value={config.avatarUrl} onChange={e => updateConfig({ avatarUrl: e.target.value })} className="w-full mt-1 p-2 bg-white/5 border border-border-color rounded-md text-sm"/>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-white/70">Theme Color</label>
                        <input type="color" value={config.themeColor} onChange={e => updateConfig({ themeColor: e.target.value })} className="w-10 h-10 p-1 bg-white/5 border border-border-color rounded-md"/>
                    </div>
                </div>
            </div>
            <div className="w-2/3 flex flex-col items-center justify-center gap-4">
                <h3 className="text-xl font-semibold">Live Preview</h3>
                <WebChatPreview config={config} />
            </div>
        </div>
    );
};

const SocialAgentEditor: React.FC<{ agent: Agent, onBack: () => void }> = ({ agent, onBack }) => (
    <div className="flex flex-col h-full w-full p-4 items-center justify-center">
        <button onClick={onBack} className="absolute top-2 left-2 z-10 flex items-center gap-2 text-xs px-3 py-1.5 bg-dock-bg backdrop-blur-md border border-border-color rounded-full hover:bg-white/20 transition-colors font-sans"><i className="fi fi-rr-arrow-left text-xs" /> Back to Dashboard</button>
        <div className="text-center text-white/80">
            <div className="w-16 h-16 mb-4 opacity-50"><i className="fi fi-rr-share text-6xl"></i></div>
            <h2 className="text-2xl font-bold mb-2">Social Media Agent: {agent.name}</h2>
            <p className="mt-4 text-sm text-white/60">This feature is under development. Soon you'll be able to connect and automate your social channels!</p>
        </div>
    </div>
);

const CreateAgentModal: React.FC<{ onCreate: (type: AgentType, name: string) => void, onCancel: () => void }> = ({ onCreate, onCancel }) => {
    const [name, setName] = useState('Untitled Agent');
    const [type, setType] = useState<AgentType>('voice');
    
    const agentTypes = [
        { id: 'voice', name: 'Voice Agent', icon: <i className="fi fi-rr-waveform-path text-3xl"/>, desc: 'Real-time voice conversations.' },
        { id: 'webchat', name: 'Web Chat Agent', icon: <i className="fi fi-rr-comment-alt-dots text-3xl"/>, desc: 'Embeddable chat for websites.' },
        { id: 'social', name: 'Social Media Agent', icon: <i className="fi fi-rr-share-alt text-3xl"/>, desc: 'Automate social interactions. (Soon)' },
    ];
    
    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center animate-fade-in" onClick={onCancel}>
            <div className="bg-window-bg p-6 rounded-lg shadow-lg border border-border-color w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-semibold mb-4">Create New Agent</h2>
                <div className="mb-4">
                    <label className="text-sm text-white/70">Agent Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 p-2 bg-white/5 border border-border-color rounded-md text-sm focus:outline-none"/>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {agentTypes.map(t => (
                        <button key={t.id} onClick={() => setType(t.id as AgentType)} className={`p-4 rounded-lg border-2 transition-colors ${type === t.id ? 'border-brand-blue bg-brand-blue/20' : 'border-border-color bg-white/5 hover:border-white/50'}`}>
                            {t.icon}<p className="font-semibold mt-2">{t.name}</p><p className="text-xs text-white/60 mt-1">{t.desc}</p>
                        </button>
                    ))}
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={onCancel} className="px-4 py-2 bg-white/10 text-sm rounded-md hover:bg-white/20">Cancel</button>
                    <button onClick={() => onCreate(type, name)} className="px-4 py-2 bg-brand-blue text-sm rounded-md hover:bg-brand-blue-hover">Create</button>
                </div>
            </div>
        </div>
    );
};

const DeployAgentModal: React.FC<{ agent: Agent, onClose: () => void }> = ({ agent, onClose }) => {
    const [copied, setCopied] = useState(false);

    const embedCode = `<script src="https://aistudio.com/chat-widget.js" data-agent-id="${agent.id}" defer></script>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(embedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const renderContent = () => {
        switch (agent.type) {
            case 'webchat':
                return (
                    <>
                        <h2 className="text-lg font-semibold mb-2">Embed Your Web Chat Agent</h2>
                        {/* FIX: Escape <head> and <body> tags to prevent JSX parsing errors. */}
                        <p className="text-sm text-white/60 mb-4">Copy and paste this snippet into the `&lt;head&gt;` or `&lt;body&gt;` of your website's HTML file.</p>
                        <div className="bg-black/50 p-3 rounded-lg font-mono text-sm relative">
                            <pre className="whitespace-pre-wrap"><code>{embedCode}</code></pre>
                            <button onClick={handleCopy} className="absolute top-2 right-2 px-3 py-1 bg-white/20 text-xs rounded-md hover:bg-white/30">
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </>
                );
            case 'voice':
            case 'social':
                return (
                    <div className="text-center">
                         <h2 className="text-lg font-semibold mb-2">Deployment Coming Soon</h2>
                         <p className="text-sm text-white/60">API endpoints and direct integrations for Voice and Social agents are on our roadmap. Stay tuned!</p>
                    </div>
                )
            default:
                return null;
        }
    };

    return (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="bg-window-bg p-6 rounded-lg shadow-lg border border-border-color w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-xl font-bold">{agent.name}</h3>
                     <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center"><i className="fi fi-rr-cross-small"></i></button>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};


export const AgentStudio: React.FC = () => {
    const [agents, setAgents] = useState<Agent[]>(() => {
        try {
            const saved = localStorage.getItem('ai-studio-agents');
            return saved ? JSON.parse(saved) : [];
        } catch (e) { return []; }
    });
    const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
    const [deployingAgent, setDeployingAgent] = useState<Agent | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        localStorage.setItem('ai-studio-agents', JSON.stringify(agents));
    }, [agents]);
    
    const handleCreateAgent = (type: AgentType, name: string) => {
        let defaultConfig: any;
        switch(type) {
            case 'voice':
                defaultConfig = { systemInstruction: "You are a helpful AI assistant.", voice: voices[0], toolsEnabled: false };
                break;
            case 'webchat':
                defaultConfig = { systemInstruction: "You are a helpful web chat assistant.", themeColor: '#3b82f6', avatarUrl: 'https://i.imgur.com/3f8n1fX.png', welcomeMessage: 'Hello! How can I help you today?', position: 'bottom-right' };
                break;
            case 'social':
                defaultConfig = {};
                break;
        }
        const newAgent: Agent = { id: `agent-${Date.now()}`, name, type, config: defaultConfig };
        setAgents(prev => [...prev, newAgent]);
        setEditingAgentId(newAgent.id);
        setIsCreating(false);
    };

    const handleUpdateAgent = (id: string, newConfig: any) => {
        setAgents(prev => prev.map(a => a.id === id ? { ...a, config: { ...a.config, ...newConfig } } : a));
    };
    
    const handleDeleteAgent = (id: string) => {
        if (window.confirm("Are you sure you want to delete this agent?")) {
            setAgents(prev => prev.filter(a => a.id !== id));
        }
    };
    
    const getAgentIcon = (type: AgentType) => {
        switch(type) {
            case 'voice': return <i className="fi fi-rr-waveform-path text-3xl"/>;
            case 'webchat': return <i className="fi fi-rr-comment-alt-dots text-3xl"/>;
            case 'social': return <i className="fi fi-rr-share-alt text-3xl"/>;
        }
    };

    const editingAgent = agents.find(a => a.id === editingAgentId);

    if (editingAgent) {
        switch(editingAgent.type) {
            case 'voice': return <VoiceAgentEditor agent={editingAgent} onUpdate={handleUpdateAgent} onBack={() => setEditingAgentId(null)} />;
            case 'webchat': return <WebChatEditor agent={editingAgent} onUpdate={handleUpdateAgent} onBack={() => setEditingAgentId(null)} />;
            case 'social': return <SocialAgentEditor agent={editingAgent} onBack={() => setEditingAgentId(null)} />;
        }
    }

    return (
        <div className="w-full h-full flex flex-col p-8 bg-black/20 relative">
            {isCreating && <CreateAgentModal onCreate={handleCreateAgent} onCancel={() => setIsCreating(false)} />}
            {deployingAgent && <DeployAgentModal agent={deployingAgent} onClose={() => setDeployingAgent(null)} />}
            <header className="flex-shrink-0 mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Agent Studio</h1>
                    <p className="text-white/60 mt-1">Create and manage your custom AI agents.</p>
                </div>
                <button onClick={() => setIsCreating(true)} className="px-4 py-2 bg-brand-blue text-white font-semibold rounded-md hover:bg-brand-blue-hover flex items-center gap-2"><i className="fi fi-rr-add"/> Create Agent</button>
            </header>
            <main className="flex-grow overflow-y-auto pr-2">
                {agents.length === 0 ? (
                    <div className="text-center text-white/60 mt-16">
                        <p>No agents created yet.</p>
                        <button onClick={() => setIsCreating(true)} className="mt-4 text-brand-blue hover:underline">Create your first agent</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {agents.map(agent => (
                            <div key={agent.id} className="bg-white/5 p-4 rounded-lg border border-border-color flex flex-col group">
                                <div className="flex items-start justify-between">
                                    <div className="w-12 h-12 bg-brand-blue/20 text-brand-blue flex items-center justify-center rounded-lg">
                                        {getAgentIcon(agent.type)}
                                    </div>
                                    <span className="text-xs font-medium bg-white/10 px-2 py-1 rounded-full capitalize">{agent.type}</span>
                                </div>
                                <h3 className="font-semibold text-lg mt-3 truncate">{agent.name}</h3>
                                <p className="text-xs text-white/60 flex-grow">ID: {agent.id}</p>
                                <div className="flex gap-2 mt-4">
                                    <button onClick={() => setEditingAgentId(agent.id)} className="flex-1 px-3 py-1.5 bg-white/10 text-xs rounded-md hover:bg-white/20">Edit</button>
                                    <button onClick={() => setDeployingAgent(agent)} className="flex-1 px-3 py-1.5 bg-green-500/10 text-green-400 text-xs rounded-md hover:bg-green-500/20">Deploy</button>
                                    <button onClick={() => handleDeleteAgent(agent.id)} className="w-8 h-8 flex items-center justify-center bg-red-500/10 text-red-400 text-sm rounded-md hover:bg-red-500/20"><i className="fi fi-rr-trash"></i></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};