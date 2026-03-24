import React from 'react';

/**
 * Status Legend Component
 * Displays lesson status descriptions
 */
const StatusLegend = () => {
  return (
    <div className="bg-white/80 rounded-lg px-4 py-2 mb-4 flex items-center justify-center gap-4 flex-wrap text-sm text-gray-600">
      <span>🔒 ล็อก</span>
      <span>🔓 พร้อม</span>
      <span>📖 กำลังเรียน</span>
      <span>✅ จบแล้ว</span>
    </div>
  );
};

export default StatusLegend;
