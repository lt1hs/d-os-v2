
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { NodeDefinition, WorkflowNode, WorkflowEdge } from '../../types';
import * as geminiService from '../../services/geminiService';

// 1. Node Definitions
const NODE_DEFINITIONS: NodeDefinition[] = [
    { type: 'textInput', name: 'Text Input', description: 'Provides a raw text string.', inputs: [], outputs: [{ id: 'text', name: 'Text', type: 'string' }], hasSettings: true },
    { type: 'imageStudio', name: 'Image Studio', description: 'Generates an image from a prompt.', inputs: [{ id: 'prompt', name: 'Prompt', type: 'string' }], outputs: [{ id: 'imageBase64', name: 'Image (Base64)', type: 'string' }], hasSettings: true },
    { type: 'videoStudio', name: 'Video Studio', description: 'Generates a video from a prompt.', inputs: [{ id: 'prompt', name: 'Prompt', type: 'string' }], outputs: [{ id: 'videoUrl', name: 'Video URL', type: 'string' }], hasSettings: true },
    { type: 'audioStudio', name: 'Audio Studio', description: 'Generates speech from text.', inputs: [{ id: 'text', name: 'Text', type: 'string' }], outputs: [{ id: 'audioBase64', name: 'Audio (Base64)', type: 'string' }], hasSettings: true },
    { type: 'copyStudioSocialPost', name: 'Social Post', description: 'Generates a social media post.', inputs: [{ id: 'prompt', name: 'Prompt', type: 'string' }], outputs: [{ id: 'postData', name: 'Post Data', type: 'object' }], hasSettings: true },
    { type: 'copyStudioBlogPost', name: 'Blog Post', description: 'Generates a full blog post.', inputs: [{ id: 'topic', name: 'Topic', type: 'string' }], outputs: [{ id: 'blogData', name: 'Blog Data', type: 'object' }], hasSettings: false },
    { type: 'resultViewer', name: 'Result Viewer', description: 'Displays any connected output.', inputs: [{ id: 'data', name: 'Data', type: 'any' }], outputs: [], hasSettings: false },
];

const PLATFORMS = ['X/Twitter', 'Instagram', 'LinkedIn', 'Facebook', 'TikTok'];
const ASPECT_RATIOS = { image: ["16:9", "1:1", "9:16", "4:3", "3:4"], video: ["16:9", "9:16"] };
const RESOLUTIONS = ["720p", "1080p"];
const VOICES = ["Kore", "Puck", "Charon", "Zephyr", "Fenrir"];

type NodeStatus = 'idle' | 'running' | 'completed' | 'failed';

const NodeComponent: React.FC<{
    node: WorkflowNode; def: NodeDefinition; isSelected: boolean; status: NodeStatus; output: any;
    onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
    onHandleMouseDown: (e: React.MouseEvent, nodeId: string, handleId: string, type: 'in' | 'out', handleRef: React.RefObject<HTMLDivElement>) => void;
    onHandleMouseUp: (e: React.MouseEvent, nodeId: string, handleId: string) => void;
}> = ({ node, def, isSelected, status, output, onMouseDown, onHandleMouseDown, onHandleMouseUp }) => {
    const statusClasses = {
        idle: 'border-slate-600',
        running: 'border-yellow-500 animate-pulse',
        completed: 'border-green-500',
        failed: 'border-red-500',
    };
    
    const inputHandleRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({});
    def.inputs.forEach(input => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        inputHandleRefs.current[input.id] = useRef<HTMLDivElement>(null);
    });
    
    const outputHandleRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({});
    def.outputs.forEach(output => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        outputHandleRefs.current[output.id] = useRef<HTMLDivElement>(null);
    });

    const renderPreview = () => {
        if (status !== 'completed' || !output) return null;

        if (node.type === 'imageStudio' && output.imageBase64) {
            return <img src={`data:image/jpeg;base64,${output.imageBase64}`} alt="Generated Preview" className="w-full h-24 object-cover rounded-b-md" />;
        }
        if (node.type === 'audioStudio' && output.audioBase64) {
            return <audio src={`data:audio/mp3;base64,${output.audioBase64}`} controls className="w-full h-8" />;
        }
        if (node.type === 'videoStudio' && output.videoUrl) {
            return <video src={output.videoUrl} controls className="w-full h-24 object-cover rounded-b-md" muted />;
        }
        return null;
    };

    return (
        <div
            onMouseDown={(e) => onMouseDown(e, node.id)}
            style={{ transform: `translate(${node.position.x}px, ${node.position.y}px)` }}
            className={`absolute w-64 bg-slate-800 rounded-lg shadow-lg cursor-grab active:cursor-grabbing border-2 ${statusClasses[status]} ${isSelected ? 'ring-2 ring-brand-blue ring-offset-2 ring-offset-canvas-bg' : ''}`}
        >
            <div className="p-3 bg-slate-900/50 rounded-t-lg">
                <h3 className="font-bold text-sm">{def.name}</h3>
            </div>
            <div className="p-3 min-h-[4rem] relative">
                {def.inputs.map((input) => (
                    <div key={input.id} className="flex items-center mb-2">
                         <div
                            ref={inputHandleRefs.current[input.id]}
                            onMouseDown={e => onHandleMouseDown(e, node.id, input.id, 'in', inputHandleRefs.current[input.id])}
                            onMouseUp={e => onHandleMouseUp(e, node.id, input.id)}
                            className="w-4 h-4 bg-slate-600 rounded-full border-2 border-slate-900 hover:bg-brand-blue absolute -left-2.5 z-10"
                         />
                        <span className="text-xs text-slate-400 ml-3">{input.name}</span>
                    </div>
                ))}
                {def.outputs.map((output) => (
                    <div key={output.id} className="flex items-center justify-end mb-2">
                        <span className="text-xs text-slate-400 mr-3">{output.name}</span>
                        <div ref={outputHandleRefs.current[output.id]} onMouseDown={e => onHandleMouseDown(e, node.id, output.id, 'out', outputHandleRefs.current[output.id])} className="w-4 h-4 bg-slate-600 rounded-full border-2 border-slate-900 hover:bg-brand-blue absolute -right-2.5 z-10" />
                    </div>
                ))}
            </div>
             {renderPreview() && <div className="p-2 border-t border-slate-700">{renderPreview()}</div>}
        </div>
    );
};

const getEdgePath = (sourcePos: {x:number, y:number}, targetPos: {x:number, y:number}) => {
    const dx = targetPos.x - sourcePos.x;
    const dy = targetPos.y - sourcePos.y;
    const curveFactor = Math.abs(dx) * 0.5;
    return `M${sourcePos.x},${sourcePos.y} C${sourcePos.x + curveFactor},${sourcePos.y} ${targetPos.x - curveFactor},${targetPos.y} ${targetPos.x},${targetPos.y}`;
};


export const WorkflowStudio: React.FC = () => {
    const [nodes, setNodes] = useState<WorkflowNode[]>([]);
    const [edges, setEdges] = useState<WorkflowEdge[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [nodeStatus, setNodeStatus] = useState<Record<string, NodeStatus>>({});
    const [nodeOutputs, setNodeOutputs] = useState<Record<string, any>>({});
    
    const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [draggingNode, setDraggingNode] = useState<{ id: string; offset: { x: number; y: number } } | null>(null);
    const [connectingLine, setConnectingLine] = useState<{ sourceNodeId: string; sourceHandleId: string; startPos: { x: number; y: number }; } | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const canvasRef = useRef<HTMLDivElement>(null);
    const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === ' ') setIsSpacePressed(true); };
        const handleKeyUp = (e: KeyboardEvent) => { if (e.key === ' ') setIsSpacePressed(false); };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const onNodeDragStart = (e: React.DragEvent<HTMLDivElement>, nodeType: string) => {
        e.dataTransfer.setData('application/json', nodeType);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('application/json');
        if (!type || !canvasRef.current) return;
        
        const rect = canvasRef.current.getBoundingClientRect();
        const position = {
            x: (e.clientX - rect.left - viewport.x) / viewport.zoom,
            y: (e.clientY - rect.top - viewport.y) / viewport.zoom
        };
        
        const newNode: WorkflowNode = { id: `node-${Date.now()}`, type, position, data: {} };
        if (type === 'textInput') newNode.data.text = 'Your text here...';
        if (type === 'copyStudioSocialPost') newNode.data.platform = PLATFORMS[0];
        if (type === 'imageStudio') newNode.data.aspectRatio = ASPECT_RATIOS.image[0];
        if (type === 'videoStudio') { newNode.data.aspectRatio = ASPECT_RATIOS.video[0]; newNode.data.resolution = "720p"; }
        if (type === 'audioStudio') newNode.data.voice = VOICES[0];
        
        setNodes(prev => [...prev, newNode]);
        setNodeStatus(prev => ({ ...prev, [newNode.id]: 'idle' }));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 1 || isSpacePressed || e.getModifierState("Alt")) {
            setIsPanning(true);
        } else {
            setSelectedNodeId(null);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        if (isPanning) {
            setViewport(v => ({ ...v, x: v.x + e.movementX, y: v.y + e.movementY }));
        }
        if (draggingNode) {
            setNodes(nds => nds.map(n => n.id === draggingNode.id ? { ...n, position: { x: n.position.x + e.movementX / viewport.zoom, y: n.position.y + e.movementY / viewport.zoom } } : n));
        }
    };
    
    const handleMouseUp = () => {
        setIsPanning(false);
        setDraggingNode(null);
        setConnectingLine(null);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const rect = canvasRef.current!.getBoundingClientRect();
        const mousePoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const newZoom = Math.max(0.2, Math.min(2, viewport.zoom - e.deltaY * 0.001));
        const zoomFactor = (newZoom - viewport.zoom) / viewport.zoom;
        const newX = viewport.x - (mousePoint.x - viewport.x) * zoomFactor;
        const newY = viewport.y - (mousePoint.y - viewport.y) * zoomFactor;
        setViewport({ x: newX, y: newY, zoom: newZoom });
    };

    const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        setSelectedNodeId(nodeId);
        setDraggingNode({ id: nodeId, offset: { x: e.clientX, y: e.clientY } });
    };

    const handleHandleMouseDown = (e: React.MouseEvent, nodeId: string, handleId: string, type: 'in' | 'out', handleRef: React.RefObject<HTMLDivElement>) => {
        e.stopPropagation();
        if (type === 'out') {
            const rect = handleRef.current!.getBoundingClientRect();
            const canvasRect = canvasRef.current!.getBoundingClientRect();
            setConnectingLine({ sourceNodeId: nodeId, sourceHandleId: handleId, startPos: { x: rect.left + rect.width / 2 - canvasRect.left, y: rect.top + rect.height / 2 - canvasRect.top } });
        }
    };
    
    const handleHandleMouseUp = (e: React.MouseEvent, nodeId: string, handleId: string) => {
        e.stopPropagation();
        if (!connectingLine) return;
        
        const newEdge: WorkflowEdge = {
            id: `edge-${connectingLine.sourceNodeId}-${connectingLine.sourceHandleId}-${nodeId}-${handleId}`,
            source: connectingLine.sourceNodeId,
            sourceHandle: connectingLine.sourceHandleId,
            target: nodeId,
            targetHandle: handleId
        };
        setEdges(prev => [...prev.filter(edge => edge.target !== nodeId || edge.targetHandle !== handleId), newEdge]);
        setConnectingLine(null);
    };

    const runWorkflow = async () => {
        setNodeStatus(nodes.reduce((acc, n) => ({ ...acc, [n.id]: 'idle' }), {}));
        setNodeOutputs({});

        // Topological Sort
        const inDegree: Record<string, number> = {};
        const adj: Record<string, string[]> = {};
        nodes.forEach(node => {
            inDegree[node.id] = 0;
            adj[node.id] = [];
        });
        edges.forEach(edge => {
            adj[edge.source]?.push(edge.target);
            inDegree[edge.target]++;
        });

        const queue = nodes.filter(node => inDegree[node.id] === 0).map(n => n.id);
        const sortedNodes: string[] = [];
        while (queue.length > 0) {
            const nodeId = queue.shift()!;
            sortedNodes.push(nodeId);
            adj[nodeId]?.forEach(neighbor => {
                inDegree[neighbor]--;
                if (inDegree[neighbor] === 0) {
                    queue.push(neighbor);
                }
            });
        }
        if (sortedNodes.length !== nodes.length) {
            alert("Error: Workflow contains a cycle!");
            return;
        }

        // Execute nodes in order
        for (const nodeId of sortedNodes) {
            setNodeStatus(prev => ({ ...prev, [nodeId]: 'running' }));
            const node = nodes.find(n => n.id === nodeId)!;
            const inputEdges = edges.filter(e => e.target === nodeId);
            const inputs: Record<string, any> = {};
            inputEdges.forEach(edge => {
                const sourceOutput = nodeOutputs[edge.source];
                if (sourceOutput) {
                    inputs[edge.targetHandle] = sourceOutput[edge.sourceHandle];
                }
            });

            try {
                let output: any = {};
                switch (node.type) {
                    case 'textInput':
                        output.text = node.data.text;
                        break;
                    case 'imageStudio':
                        output.imageBase64 = await geminiService.generateImage(inputs.prompt, node.data.aspectRatio);
                        break;
                    case 'videoStudio':
                        const videoUrl = await geminiService.generateVideo(inputs.prompt, node.data.aspectRatio, node.data.resolution, (msg) => console.log(msg));
                        const response = await fetch(`${videoUrl}&key=${process.env.API_KEY}`);
                        if (!response.ok) throw new Error(`Failed to download video: ${response.statusText}`);
                        const videoBlob = await response.blob();
                        output.videoUrl = URL.createObjectURL(videoBlob);
                        break;
                    case 'audioStudio':
                        output.audioBase64 = await geminiService.generateSpeech(inputs.text, node.data.voice);
                        break;
                    case 'copyStudioSocialPost':
                        output.postData = await geminiService.generateSocialPost(inputs.prompt, node.data.platform);
                        break;
                    case 'copyStudioBlogPost':
                        output.blogData = await geminiService.generateBlogPost(inputs.topic);
                        break;
                    case 'resultViewer':
                        // No execution, just displays input
                        break;
                }
                setNodeOutputs(prev => ({ ...prev, [nodeId]: output }));
                setNodeStatus(prev => ({ ...prev, [nodeId]: 'completed' }));
            } catch (error) {
                console.error(`Error executing node ${nodeId}:`, error);
                setNodeStatus(prev => ({ ...prev, [nodeId]: 'failed' }));
                setNodeOutputs(prev => ({ ...prev, [nodeId]: { error: error instanceof Error ? error.message : 'Unknown error' } }));
                break; // Stop execution on failure
            }
        }
    };
    
    const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);
    const selectedNodeDef = useMemo(() => selectedNode ? NODE_DEFINITIONS.find(def => def.type === selectedNode.type) : null, [selectedNode]);

    const updateNodeData = (nodeId: string, data: Partial<any>) => {
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n));
    };

    return (
        <div className="flex h-full w-full bg-canvas-bg text-white">
            <aside className="w-64 flex-shrink-0 bg-slate-900/50 p-4 border-r border-slate-700 overflow-y-auto">
                <h2 className="font-bold mb-4">Nodes</h2>
                <div className="space-y-2">
                    {NODE_DEFINITIONS.map(def => (
                        <div key={def.type} onDragStart={(e) => onNodeDragStart(e, def.type)} draggable className="p-3 bg-slate-800 rounded-lg cursor-grab active:cursor-grabbing hover:bg-slate-700">
                            <h3 className="font-semibold text-sm">{def.name}</h3>
                            <p className="text-xs text-slate-400 mt-1">{def.description}</p>
                        </div>
                    ))}
                </div>
            </aside>
            <main className="flex-1 relative overflow-hidden" ref={canvasRef} onDrop={onDrop} onDragOver={(e) => e.preventDefault()} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onWheel={handleWheel}>
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                     <button onClick={runWorkflow} className="px-4 py-2 bg-brand-blue text-white font-semibold rounded-md hover:bg-brand-blue-hover flex items-center gap-2"><i className="fi fi-rr-play"></i> Run</button>
                </div>
                <div className="w-full h-full" style={{ background: 'repeating-conic-gradient(#374151 0% 25%, #4b5563 0% 50%) 50% / 20px 20px', cursor: isPanning || isSpacePressed ? 'grabbing' : 'default' }}>
                    <div style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`, transformOrigin: 'top left' }}>
                        {nodes.map(node => {
                            const def = NODE_DEFINITIONS.find(d => d.type === node.type);
                            if (!def) return null;
                            return <NodeComponent key={node.id} node={node} def={def} isSelected={selectedNodeId === node.id} status={nodeStatus[node.id] || 'idle'} output={nodeOutputs[node.id]} onMouseDown={handleNodeMouseDown} onHandleMouseDown={handleHandleMouseDown} onHandleMouseUp={handleHandleMouseUp} />
                        })}
                    </div>
                </div>
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`, transformOrigin: 'top left' }}>
                    <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" /></marker></defs>
                    {edges.map(edge => {
                        // This logic to get handle positions is complex and depends on refs, which is hard here.
                        // A more robust solution would use a state management library to sync positions.
                        // For now, we'll approximate.
                        const sourceNode = nodes.find(n => n.id === edge.source);
                        const targetNode = nodes.find(n => n.id === edge.target);
                        if(!sourceNode || !targetNode) return null;
                        const sourcePos = { x: sourceNode.position.x + 256, y: sourceNode.position.y + 60 }; // Approximation
                        const targetPos = { x: targetNode.position.x, y: targetNode.position.y + 40 }; // Approximation
                        return <path key={edge.id} d={getEdgePath(sourcePos, targetPos)} stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                    })}
                     {connectingLine && <path d={getEdgePath({x: (connectingLine.startPos.x - viewport.x) / viewport.zoom, y: (connectingLine.startPos.y - viewport.y) / viewport.zoom}, { x: (mousePos.x - viewport.x) / viewport.zoom, y: (mousePos.y - viewport.y) / viewport.zoom })} stroke="#94a3b8" strokeWidth="2" fill="none" strokeDasharray="5,5" />}
                </svg>
            </main>
            {selectedNode && selectedNodeDef?.hasSettings && (
                 <aside className="w-80 flex-shrink-0 bg-slate-900/50 p-4 border-l border-slate-700 overflow-y-auto">
                    <h2 className="font-bold mb-4">Inspector: {selectedNodeDef.name}</h2>
                    <div className="space-y-4">
                        {selectedNode.type === 'textInput' && (
                            <div>
                                <label className="text-xs text-slate-400">Text</label>
                                <textarea value={selectedNode.data.text} onChange={e => updateNodeData(selectedNodeId!, { text: e.target.value })} className="w-full h-24 mt-1 p-2 bg-slate-800 rounded border border-slate-700 text-sm" />
                            </div>
                        )}
                        {selectedNode.type === 'imageStudio' && (
                             <div>
                                <label className="text-xs text-slate-400">Aspect Ratio</label>
                                <select value={selectedNode.data.aspectRatio} onChange={e => updateNodeData(selectedNodeId!, { aspectRatio: e.target.value })} className="w-full mt-1 p-2 bg-slate-800 rounded border border-slate-700 text-sm">
                                    {ASPECT_RATIOS.image.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        )}
                        {selectedNode.type === 'videoStudio' && (
                             <>
                                <div>
                                    <label className="text-xs text-slate-400">Aspect Ratio</label>
                                    <select value={selectedNode.data.aspectRatio} onChange={e => updateNodeData(selectedNodeId!, { aspectRatio: e.target.value })} className="w-full mt-1 p-2 bg-slate-800 rounded border border-slate-700 text-sm">
                                        {ASPECT_RATIOS.video.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">Resolution</label>
                                    <select value={selectedNode.data.resolution} onChange={e => updateNodeData(selectedNodeId!, { resolution: e.target.value })} className="w-full mt-1 p-2 bg-slate-800 rounded border border-slate-700 text-sm">
                                        {RESOLUTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                             </>
                        )}
                        {selectedNode.type === 'audioStudio' && (
                            <div>
                                <label className="text-xs text-slate-400">Voice</label>
                                <select value={selectedNode.data.voice} onChange={e => updateNodeData(selectedNodeId!, { voice: e.target.value })} className="w-full mt-1 p-2 bg-slate-800 rounded border border-slate-700 text-sm">
                                    {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                        )}
                        {selectedNode.type === 'copyStudioSocialPost' && (
                            <div>
                                <label className="text-xs text-slate-400">Platform</label>
                                <select value={selectedNode.data.platform} onChange={e => updateNodeData(selectedNodeId!, { platform: e.target.value })} className="w-full mt-1 p-2 bg-slate-800 rounded border border-slate-700 text-sm">
                                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="mt-6 border-t border-slate-700 pt-4">
                        <h3 className="font-bold mb-2">Output</h3>
                        <div className="p-2 bg-slate-800 rounded text-xs h-48 overflow-auto">
                            <pre>{JSON.stringify(nodeOutputs[selectedNodeId] || { status: nodeStatus[selectedNodeId] || 'idle' }, null, 2)}</pre>
                        </div>
                    </div>
                </aside>
            )}
        </div>
    );
};
