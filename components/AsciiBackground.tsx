import React, { useRef, useEffect } from 'react';

export const AsciiBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        // Debounce resize handler
        let resizeTimeout: number;
        const debouncedResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = window.setTimeout(() => {
                 if (animationFrameId) cancelAnimationFrame(animationFrameId);
                 setupAndRun();
            }, 250);
        };

        const setupAndRun = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const characters = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッンABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            const fontSize = 16;
            const columns = Math.floor(canvas.width / fontSize);
            const drops = Array.from({ length: columns }).map(() => Math.floor(Math.random() * (canvas.height / fontSize)));

            const draw = () => {
                ctx.fillStyle = 'rgba(2, 6, 23, 0.05)'; // This should match the body background color from index.html for a seamless effect
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#0f0'; // Classic green matrix color
                ctx.font = `${fontSize}px monospace`;

                for (let i = 0; i < drops.length; i++) {
                    const text = characters[Math.floor(Math.random() * characters.length)];
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
        window.addEventListener('resize', debouncedResize);

        return () => {
            window.removeEventListener('resize', debouncedResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute top-0 left-0 w-full h-full z-0"
        />
    );
};
