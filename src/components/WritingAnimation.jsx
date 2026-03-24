import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

const WritingAnimation = ({ character }) => {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationFrameRef = useRef(null);
  const progressRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !character) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Draw guide character
    ctx.font = 'bold 180px "Noto Sans Thai", "Sarabun", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#9CA3AF'; // Gray-400
    ctx.lineWidth = 4;
    ctx.setLineDash([15, 15]);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 15;

    // Always draw guide (dashed)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeText(character, centerX, centerY);

    // Animated overlay (solid blue, draws progressively with path-based animation)
    if (isPlaying) {
      const animateWriting = () => {
        if (progressRef.current < 1) {
          progressRef.current += 0.008; // Slower animation speed for smoother effect
          
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Always draw guide (dashed) in background
          ctx.save();
          ctx.setLineDash([15, 15]);
          ctx.strokeStyle = '#9CA3AF';
          ctx.lineWidth = 4;
          ctx.globalAlpha = 0.3; // Lighter guide
          ctx.strokeText(character, centerX, centerY);
          ctx.restore();

          // Draw animated stroke (solid blue, progressive)
          // Use clip path to show only the portion that should be visible
          ctx.save();
          ctx.beginPath();
          
          // Create a clipping region that reveals the character progressively
          // We'll use a mask approach: draw the character with increasing opacity
          ctx.setLineDash([]);
          ctx.strokeStyle = '#3B82F6'; // Blue-500
          ctx.lineWidth = 6;
          ctx.globalAlpha = Math.min(progressRef.current, 1);
          
          // Use composite operation to create a "reveal" effect
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeText(character, centerX, centerY);
          
          ctx.restore();

          animationFrameRef.current = requestAnimationFrame(animateWriting);
        } else {
          progressRef.current = 1;
          // Final draw - complete character
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          ctx.setLineDash([15, 15]);
          ctx.strokeStyle = '#9CA3AF';
          ctx.lineWidth = 4;
          ctx.globalAlpha = 0.3;
          ctx.strokeText(character, centerX, centerY);
          ctx.restore();
          
          ctx.save();
          ctx.setLineDash([]);
          ctx.strokeStyle = '#3B82F6';
          ctx.lineWidth = 6;
          ctx.globalAlpha = 1;
          ctx.strokeText(character, centerX, centerY);
          ctx.restore();
          
          setIsPlaying(false);
        }
      };

      animateWriting();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [character, isPlaying]);

  const handlePlay = () => {
    progressRef.current = 0;
    setIsPlaying(true);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full h-64 bg-white rounded-lg border-2 border-gray-300"
      />
      {!isPlaying && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handlePlay}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg z-10"
          aria-label="เล่น animation"
        >
          <Play size={24} fill="white" />
        </motion.button>
      )}
    </div>
  );
};

export default WritingAnimation;

