import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppDefinition, WindowSnapHint, WindowState } from '../types';

interface WindowProps {
    app: AppDefinition;
    children: React.ReactNode;
    onClose: () => void;
    onMinimize: () => void;
    onMaximize: () => void;
    onFocus: () => void;
    isActive: boolean;
    isMaximized: boolean;
    isStageVisible: boolean;
    setSnapHint: (hint: WindowSnapHint | null) => void;
    topBarHeight: number;
    dockHeight: number;
    initialState?: WindowState;
    onStateChange: (appId: string, newState: WindowState) => void;
}

const MIN_WIDTH = 480;
const MIN_HEIGHT = 320;
const STAGE_WIDTH = 144; // w-36
const SNAP_THRESHOLD = 20;
const DEFAULT_SIZE = { width: 800, height: 600 };

export const Window: React.FC<WindowProps> = (props) => {
    const { 
        app, children, onClose, onMinimize, onMaximize, onFocus, 
        isActive, isMaximized, isStageVisible, setSnapHint, 
        topBarHeight, dockHeight, initialState, onStateChange
    } = props;

    const rightOffset = isStageVisible ? STAGE_WIDTH : 0;
    
    const getCenteredPosition = (size: { width: number, height: number }) => {
        const availableWidth = window.innerWidth - rightOffset;
        const availableHeight = window.innerHeight - topBarHeight - dockHeight;
        return {
            x: (availableWidth - size.width) / 2,
            y: topBarHeight + (availableHeight - size.height) / 2
        };
    };
    
    const [position, setPosition] = useState(initialState ? { x: initialState.x, y: initialState.y } : getCenteredPosition(initialState || DEFAULT_SIZE));
    const [size, setSize] = useState(initialState ? { width: initialState.width, height: initialState.height } : DEFAULT_SIZE);
    
    const [preSnapState, setPreSnapState] = useState<{ pos: {x:number, y:number}, size: {width:number, height:number} } | null>(null);
    const [isSnapped, setIsSnapped] = useState(false);
    
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    
    const dragOffset = useRef({ x: 0, y: 0 });
    const windowRef = useRef<HTMLDivElement>(null);

    const onDragMouseDown = (e: React.MouseEvent<HTMLElement>) => {
        if (isMaximized || !windowRef.current) return;
        onFocus();
        setIsDragging(true);
        if (isSnapped) {
            if (preSnapState) {
                const widthRatio = preSnapState.size.width / size.width;
                dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
                dragOffset.current.x *= widthRatio;
                setSize(preSnapState.size);
            }
        } else {
            const rect = windowRef.current.getBoundingClientRect();
            dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }
        e.preventDefault();
    };

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging && !isMaximized) {
            const { innerWidth, innerHeight } = window;
            const newPos = { 
                x: e.clientX - dragOffset.current.x, 
                y: Math.max(topBarHeight, e.clientY - dragOffset.current.y)
            };
            setPosition(newPos);
            setIsSnapped(false);

            const effectiveRight = innerWidth - rightOffset;
            const effectiveHeight = innerHeight - topBarHeight - dockHeight;
            let hint: WindowSnapHint | null = null;
            
            if (e.clientX < SNAP_THRESHOLD) hint = { top: topBarHeight, left: 0, width: effectiveRight / 2, height: effectiveHeight };
            else if (e.clientX > effectiveRight - SNAP_THRESHOLD) hint = { top: topBarHeight, left: effectiveRight / 2, width: effectiveRight / 2, height: effectiveHeight };
            else if (e.clientY < topBarHeight + SNAP_THRESHOLD) hint = { top: topBarHeight, left: 0, width: effectiveRight, height: effectiveHeight };
            
            setSnapHint(hint);
        }
        if (isResizing && !isMaximized) {
            setSize(prevSize => ({
                width: Math.max(MIN_WIDTH, e.clientX - position.x),
                height: Math.max(MIN_HEIGHT, e.clientY - position.y),
            }));
        }
    }, [isDragging, isResizing, position.x, position.y, isMaximized, rightOffset, setSnapHint, topBarHeight, dockHeight]);

    const onMouseUp = useCallback((e: MouseEvent) => {
        const finalPosition = { ...position };
        const finalSize = { ...size };
        
        if (isDragging) {
            const { innerWidth, innerHeight } = window;
            const effectiveRight = innerWidth - rightOffset;
            let snapTarget: WindowSnapHint | null = null;
    
            if (e.clientX < SNAP_THRESHOLD) snapTarget = { top: topBarHeight, left: 0, width: effectiveRight / 2, height: innerHeight - topBarHeight - dockHeight };
            else if (e.clientX > effectiveRight - SNAP_THRESHOLD) snapTarget = { top: topBarHeight, left: effectiveRight / 2, width: effectiveRight / 2, height: innerHeight - topBarHeight - dockHeight };
            else if (e.clientY < topBarHeight + SNAP_THRESHOLD) snapTarget = { top: topBarHeight, left: 0, width: effectiveRight, height: innerHeight - topBarHeight - dockHeight };
            
            if (snapTarget) {
                if(!isSnapped) setPreSnapState({ pos: position, size: size });
                finalPosition.x = snapTarget.left;
                finalPosition.y = snapTarget.top;
                finalSize.width = snapTarget.width;
                finalSize.height = snapTarget.height;
                setPosition(finalPosition);
                setSize(finalSize);
                setIsSnapped(true);
            }
        }
        
        onStateChange(app.id, { ...finalPosition, ...finalSize });
        
        setIsDragging(false);
        setIsResizing(false);
        setSnapHint(null);
    }, [app.id, rightOffset, position, size, isSnapped, topBarHeight, dockHeight, setSnapHint, onStateChange, isDragging]);

    const onResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isMaximized) return;
        onFocus();
        setIsResizing(true);
        setIsSnapped(false);
        e.stopPropagation();
    };

    useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isDragging, isResizing, onMouseMove, onMouseUp]);
    
    const windowStyle: React.CSSProperties = {
        top: isMaximized ? `${topBarHeight}px` : position.y,
        left: isMaximized ? `0px` : position.x,
        width: isMaximized ? `calc(100vw - ${rightOffset}px)` : size.width,
        height: isMaximized ? `calc(100vh - ${topBarHeight}px - ${dockHeight}px)` : size.height,
        zIndex: isActive ? 30 : 20,
        borderRadius: isMaximized || isSnapped ? '0' : '0.75rem',
        transitionProperty: 'top, left, width, height, transform, opacity, border-radius, box-shadow',
        transitionDuration: (isDragging || isResizing) ? '0ms' : '200ms',
        transitionTimingFunction: 'ease-out',
    };

    return (
        <div
            ref={windowRef}
            className={`absolute bg-window-bg backdrop-blur-xl flex flex-col text-white/90 border border-border-color ${isActive ? 'shadow-window-active' : 'shadow-window'}`}
            style={windowStyle}
            onMouseDown={onFocus}
            onContextMenu={(e) => e.stopPropagation()}
        >
            <header
                className="flex items-center justify-center h-10 flex-shrink-0 relative border-b border-white/5"
                style={{ 
                    cursor: isMaximized ? 'default' : (isDragging ? 'grabbing' : 'grab'),
                    borderTopLeftRadius: isMaximized || isSnapped ? '0' : '0.75rem',
                    borderTopRightRadius: isMaximized || isSnapped ? '0' : '0.75rem',
                }}
                onMouseDown={onDragMouseDown}
                onDoubleClick={onMaximize}
            >
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center space-x-2 group">
                    <button onClick={onClose} className="w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
                        <i className="fi fi-br-cross-small text-black/60 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </button>
                    <button onClick={onMinimize} className="w-3.5 h-3.5 bg-yellow-400 rounded-full flex items-center justify-center">
                         <i className="fi fi-br-minus-small text-black/60 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </button>
                    <button onClick={onMaximize} className="w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center">
                         <i className="fi fi-br-expand text-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-xs"></i>
                    </button>
                </div>
                <div className="flex items-center gap-2 select-none">
                    <div className="w-4 h-4 text-white/70">{app.icon}</div>
                    <span className="text-sm font-medium text-white/90">{app.name}</span>
                </div>
            </header>
            <div className="flex-grow relative" style={{ minHeight: 0 }}>
                {children}
            </div>
             <div 
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                style={{ display: isMaximized || isSnapped ? 'none' : 'block' }}
                onMouseDown={onResizeMouseDown}
            />
        </div>
    );
};