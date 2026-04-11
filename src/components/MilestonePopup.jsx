import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Sparkles } from 'lucide-react';

const MilestoneToast = ({
  isOpen,
  onClose,
  lessonId,
  title = "เก่งที่สุดเลย 🥳",
  subtitle = "ลุยต่อกันเลย",
  duration = 1.5 // หน่วยเป็นวินาที
}) => {
  // ใช้ internal state เพื่อแยกขาดจาก Logic ของตัวแม่
  const [isSelfOpen, setIsSelfOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSelfOpen(true);
    }
  }, [isOpen, lessonId]);

  return (
    <AnimatePresence>
      {isSelfOpen && (
        <motion.div
          key={`toast-${lessonId}`}
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 20, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          // ใช้ transition แบบเรียบง่ายเพื่อลดภาระเครื่อง
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-1/2 z-[99999] w-full max-w-[320px] px-4 pointer-events-none"
        >
          <div className="bg-white border border-emerald-100 shadow-xl rounded-2xl p-3 flex items-center gap-3 border-b-2 border-b-emerald-400 overflow-hidden">

            <div className="flex-shrink-0 w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="text-emerald-500" size={24} />
            </div>

            <div className="flex-grow">
              <h3 className="text-gray-800 font-bold text-sm leading-tight">{title}</h3>
              <p className="text-gray-500 text-[10px] font-medium">{subtitle}</p>
            </div>

            <Sparkles size={16} className="text-amber-400" />

            {/* เส้นเวลา: เมื่อวิ่งเต็ม ให้สั่งปิดตัวเองทันที */}
            <motion.div
              className="absolute bottom-0 left-0 h-[3px] bg-emerald-400"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: duration, ease: "linear" }}
              onAnimationComplete={() => {
                setIsSelfOpen(false); // ปิดตัวเองที่นี่
                if (onClose) onClose(); // บอกตัวแม่
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MilestoneToast;