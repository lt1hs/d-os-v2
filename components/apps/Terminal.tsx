
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfileState } from '../../types';

interface TerminalProps {
    userProfile: UserProfileState;
    onClose: () => void;
}

type Line = { type: 'input' | 'output' | 'system'; text: string; };

const BOOT_SEQUENCE = [
    "AI_STUDIO_OS v1.0.0 initializing...",
    "Mounting virtual file system... OK",
    "Loading kernel modules... DONE",
    "Starting core services... OK",
    "Establishing neural link... SECURE",
    "Welcome to the Secret Terminal.",
    "Type 'help' for a list of commands."
];

const COWSAY_TEMPLATE = (text: string) => `
 ____________
< ${text} >
 ------------
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||
`;

export const Terminal: React.FC<TerminalProps> = ({ userProfile, onClose }) => {
    const [lines, setLines] = useState<Line[]>([]);
    const [input, setInput] = useState('');
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isBooting, setIsBooting] = useState(true);
    const [isMatrix, setIsMatrix] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        containerRef.current?.scrollTo(0, containerRef.current.scrollHeight);
    }, [lines]);

    useEffect(() => {
        let bootIndex = 0;
        const interval = setInterval(() => {
            if (bootIndex < BOOT_SEQUENCE.length) {
                setLines(prev => [...prev, { type: 'system', text: BOOT_SEQUENCE[bootIndex] }]);
                bootIndex++;
            } else {
                clearInterval(interval);
                setIsBooting(false);
            }
        }, 150);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!isMatrix || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
        const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const nums = '0123456789';
        const alphabet = katakana + latin + nums;
        
        const fontSize = 16;
        const columns = canvas.width / fontSize;
        const rainDrops: number[] = [];

        for (let x = 0; x < columns; x++) {
            rainDrops[x] = 1;
        }

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#0F0';
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < rainDrops.length; i++) {
                const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
                ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);
                if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    rainDrops[i] = 0;
                }
                rainDrops[i]++;
            }
        };

        const interval = setInterval(draw, 30);
        return () => clearInterval(interval);

    }, [isMatrix]);

    const processCommand = (command: string) => {
        const [cmd, ...args] = command.trim().toLowerCase().split(' ');
        let output: Line[] = [];

        switch (cmd) {
            case 'help':
                output = [{ type: 'output', text: "Available commands:\n  help                - Show this help message\n  whoami              - Display current user info\n  date                - Show current date and time\n  clear               - Clear the terminal screen\n  cowsay <message>    - Make a cow say something\n  matrix              - Enter the matrix\n  open-super-admin    - Open Super Admin panel (dev)\n  open-company-admin  - Open Company Admin panel (dev)\n  exit                - Close the terminal" }];
                break;
            case 'whoami':
                output = [{ type: 'output', text: `User: ${userProfile.name}` }];
                break;
            case 'date':
                output = [{ type: 'output', text: new Date().toLocaleString() }];
                break;
            case 'clear':
                setLines([]);
                return;
            case 'cowsay':
                const message = args.join(' ') || "Moo!";
                output = [{ type: 'output', text: COWSAY_TEMPLATE(message) }];
                break;
            case 'matrix':
                setIsMatrix(true);
                setLines([]);
                return;
            case 'open-super-admin':
                output = [{ type: 'output', text: "Redirecting to Super Admin panel..." }];
                window.location.href = '/super-admin/index.html';
                break;
            case 'open-company-admin':
                output = [{ type: 'output', text: "Redirecting to Company Admin panel..." }];
                window.location.href = '/company-admin/index.html';
                break;
            case 'exit':
                if(isMatrix) {
                    setIsMatrix(false);
                    setLines([{ type: 'system', text: "Welcome back. Type 'help' for commands."}]);
                } else {
                    onClose();
                }
                return;
            case '':
                break;
            default:
                output = [{ type: 'output', text: `command not found: ${cmd}` }];
                break;
        }
        setLines(prev => [...prev, ...output]);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const command = input.trim();
            setLines(prev => [...prev, { type: 'input', text: command }]);
            if (command) {
                setCommandHistory(prev => [command, ...prev]);
            }
            setHistoryIndex(-1);
            processCommand(command);
            setInput('');
        } else if (e.key === 'ArrowUp') {
            if (historyIndex < commandHistory.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                setInput(commandHistory[newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setInput(commandHistory[newIndex]);
            } else {
                setHistoryIndex(-1);
                setInput('');
            }
        } else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
             if (isMatrix) {
                setIsMatrix(false);
                setLines([{ type: 'system', text: "Welcome back. Type 'help' for commands."}]);
            }
        }
    };

    const promptPrefix = () => (
        <span className="text-green-400">
            <span className="text-cyan-400">{userProfile.name.split(' ')[0]}@aistudio</span>
            :
            <span className="text-yellow-400">~</span>$
        </span>
    );
    
    if (isMatrix) {
        return (
            <div className="w-full h-full bg-black font-mono">
                <canvas ref={canvasRef} className="w-full h-full" />
                <p className="absolute bottom-2 left-2 text-white/50 text-xs">Press Ctrl/Cmd+C or type 'exit' to leave.</p>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef}
            className="w-full h-full bg-black/90 text-green-400 font-mono p-4 overflow-y-auto"
            onClick={() => inputRef.current?.focus()}
        >
            {lines.map((line, index) => (
                <div key={index}>
                    {line.type === 'input' ? (
                        <div>{promptPrefix()} {line.text}</div>
                    ) : (
                        <pre className="whitespace-pre-wrap">{line.text}</pre>
                    )}
                </div>
            ))}
            {!isBooting && (
                <div className="flex">
                    {promptPrefix()}&nbsp;
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-grow bg-transparent border-none outline-none text-green-400"
                        autoFocus
                    />
                     <span className="animate-pulse">█</span>
                </div>
            )}
        </div>
    );
};
