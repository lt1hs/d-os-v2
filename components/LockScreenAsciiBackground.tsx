import React, { useRef, useEffect } from 'react';

export const LockScreenAsciiBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const setupAndRun = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const characters = '0123456789{}[]()<>/\;:\'".,';
            const fontSize = 14;
            const columns = Math.floor(canvas.width / fontSize);
            const drops = Array.from({ length: columns }).map(() => Math.floor(Math.random() * (canvas.height / fontSize)));
            const colors = ['#333', '#444', '#555', '#666'];

            const draw = () => {
                ctx.fillStyle = 'rgba(2, 6, 23, 0.1)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.font = `${fontSize}px monospace`;

                for (let i = 0; i < drops.length; i++) {
                    const text = characters[Math.floor(Math.random() * characters.length)];
                    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                        drops[i] = 0;
                    }
                    drops[i]++;
                }
                animationFrameId = requestAnimationFrame(draw);
            };
            draw();
        };

        setupAndRun();
        const resizeObserver = new ResizeObserver(() => {
            cancelAnimationFrame(animationFrameId);
            setupAndRun();
        });
        resizeObserver.observe(document.body);

        return () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />;
};