import React, { useState } from 'react';
import { X, Check, AlertCircle, Upload } from 'lucide-react';

const PdfImportPreviewModal = ({ isOpen, onClose, previewData, onConfirm, isSubmitting }) => {
    if (!isOpen) return null;

    // Filter valid students that will be imported
    const validStudents = previewData.filter(d => d.isValid).map(d => ({ name: d.name }));
    const invalidCount = previewData.filter(d => !d.isValid).length;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-[#FFB000] p-4 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Upload size={24} />
                        ตรวจสอบข้อมูลนำเข้าจาก PDF
                    </h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                    <div className="mb-4 flex gap-4">
                        <div className="bg-green-100 text-green-700 px-4 py-3 rounded-xl flex-1 flex items-center gap-2">
                            <Check size={20} />
                            <span>ข้อมูลถูกต้อง: <strong>{validStudents.length}</strong> รายการ</span>
                        </div>
                        <div className="bg-red-100 text-red-700 px-4 py-3 rounded-xl flex-1 flex items-center gap-2">
                            <AlertCircle size={20} />
                            <span>พบข้อผิดพลาด: <strong>{invalidCount}</strong> รายการ</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {previewData.map((student, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border-2 flex items-center justify-between ${student.isValid ? 'border-green-200 bg-white' : 'border-red-300 bg-red-50'}`}>
                                <div className="flex items-center gap-3">
                                    {student.isValid ? (
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                            <Check size={16} />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                                            <AlertCircle size={16} />
                                        </div>
                                    )}
                                    <div>
                                        <p className={`font-bold ${student.isValid ? 'text-gray-800' : 'text-red-700'}`}>
                                            {student.name || '(ไม่มีชื่อ)'}
                                        </p>
                                        {!student.isValid && (
                                            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                                <AlertCircle size={14} />
                                                {student.error}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {student.isValid && (
                                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">พร้อมนำเข้า</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-white flex gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(validStudents)}
                        disabled={isSubmitting || validStudents.length === 0}
                        className="flex-1 px-4 py-3 rounded-xl bg-[#FFB000] text-white font-bold hover:bg-[#E59E00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Check size={20} />
                                ยืนยันนำเข้า ({validStudents.length} คน)
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PdfImportPreviewModal;
