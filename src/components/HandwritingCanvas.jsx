import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eraser, RefreshCw, Check, PenTool } from 'lucide-react';

const HandwritingCanvas = ({
    width = 300,
    height = 300,
    strokeColor = '#4F46E5',
    strokeWidth = 8,
    onComplete,
    templateImage, // Optional: URL of a letter template to trace
    canvasRef: externalCanvasRef, // Optional: external ref to access canvas
    guideCharacter = null // Optional: character to show as dotted guide
}) => {
    const internalCanvasRef = useRef(null);
    const canvasRef = externalCanvasRef || internalCanvasRef;
    const [isDrawing, setIsDrawing] = useState(false);
    const [strokes, setStrokes] = useState([]);
    const [currentStroke, setCurrentStroke] = useState([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas size with high DPI support
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;

        // Draw template if provided
        if (templateImage) {
            const img = new Image();
            img.src = templateImage;
            img.onload = () => {
                ctx.globalAlpha = 0.2;
                ctx.drawImage(img, 0, 0, width, height);
                ctx.globalAlpha = 1.0;
            };
        }
        
        // Draw guide character (dotted line) if provided
        if (guideCharacter) {
            ctx.save();
            ctx.font = `bold ${Math.min(width, height) * 0.45}px "Noto Sans Thai", "Sarabun", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeStyle = '#9CA3AF'; // Gray-400
            ctx.lineWidth = 4;
            ctx.setLineDash([15, 15]); // Dashed Line
            const centerX = width / 2;
            const centerY = height / 2 + 15;
            ctx.strokeText(guideCharacter, centerX, centerY);
            ctx.restore();
        }
    }, [width, height, strokeColor, strokeWidth, templateImage, guideCharacter]);

    const startDrawing = (e) => {
        const { offsetX, offsetY } = getCoordinates(e);
        setIsDrawing(true);
        setCurrentStroke([{ x: offsetX, y: offsetY }]);

        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
    };

    const draw = (e) => {
        if (!isDrawing) return;

        const { offsetX, offsetY } = getCoordinates(e);
        const ctx = canvasRef.current.getContext('2d');

        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();

        setCurrentStroke(prev => [...prev, { x: offsetX, y: offsetY }]);
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        setStrokes(prev => [...prev, currentStroke]);

        // Analyze stroke direction (simplified)
        if (currentStroke.length > 5) {
            const start = currentStroke[0];
            const end = currentStroke[currentStroke.length - 1];
            const dx = end.x - start.x;
            const dy = end.y - start.y;

            // Determine primary direction
            let direction = '';
            if (Math.abs(dx) > Math.abs(dy)) {
                direction = dx > 0 ? 'RIGHT' : 'LEFT';
            } else {
                direction = dy > 0 ? 'DOWN' : 'UP';
            }

            console.log(`Stroke direction: ${direction}`);
        }
    };

    const getCoordinates = (e) => {
        if (e.nativeEvent instanceof TouchEvent) {
            const rect = canvasRef.current.getBoundingClientRect();
            const touch = e.nativeEvent.touches[0];
            return {
                offsetX: touch.clientX - rect.left,
                offsetY: touch.clientY - rect.top
            };
        }
        return {
            offsetX: e.nativeEvent.offsetX,
            offsetY: e.nativeEvent.offsetY
        };
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Redraw template
        if (templateImage) {
            const img = new Image();
            img.src = templateImage;
            img.onload = () => {
                ctx.globalAlpha = 0.2;
                ctx.drawImage(img, 0, 0, width, height);
                ctx.globalAlpha = 1.0;
            };
        }
        
        // Redraw guide character
        if (guideCharacter) {
            ctx.save();
            const dpr = window.devicePixelRatio || 1;
            ctx.font = `bold ${Math.min(width, height) * 0.45 * dpr}px "Noto Sans Thai", "Sarabun", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeStyle = '#9CA3AF';
            ctx.lineWidth = 4 * dpr;
            ctx.setLineDash([15 * dpr, 15 * dpr]);
            const centerX = (canvas.width / dpr) / 2;
            const centerY = (canvas.height / dpr) / 2 + 15;
            ctx.strokeText(guideCharacter, centerX, centerY);
            ctx.restore();
        }

        setStrokes([]);
    };

    const handleCheck = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            if (onComplete) onComplete(false);
            return;
        }

        // Check if canvas has content by checking if there are any non-transparent pixels
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let hasContent = false;
        
        for (let i = 3; i < pixelData.length; i += 4) {
            if (pixelData[i] !== 0) {
                hasContent = true;
                break;
            }
        }

        if (onComplete) onComplete(hasContent);
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative border-4 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white shadow-sm">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="touch-none cursor-crosshair"
                />

                <div className="absolute top-2 right-2 flex gap-2">
                    <button
                        onClick={clearCanvas}
                        className="p-2 bg-white rounded-full shadow-md text-gray-500 hover:text-red-500 transition"
                        title="ล้างกระดาน"
                    >
                        <Eraser size={20} />
                    </button>
                </div>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={clearCanvas}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                    <RefreshCw size={18} />
                    เขียนใหม่
                </button>

                <button
                    onClick={handleCheck}
                    className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition shadow-md font-bold"
                >
                    <Check size={18} />
                    ส่งคำตอบ
                </button>
            </div>
        </div>
    );
};

export default HandwritingCanvas;
