import React, { useState, useEffect } from 'react';
import { X, UserPlus, Upload, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { getApiUrl } from '../../utils/apiConfig';
import toast from 'react-hot-toast';

const AddStudentToClassModal = ({ isOpen, onClose, onSuccess, classroomId }) => {
    // Create Mode States
    const [names, setNames] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Reset states when modal opens
    useEffect(() => {
        if (isOpen) {
            setNames('');
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const studentNames = names.split('\n')
                .map(name => name.trim())
                .filter(name => name.length > 0);

            if (studentNames.length === 0) {
                throw new Error('กรุณาระบุรายชื่อนักเรียนอย่างน้อย 1 คน');
            }

            // Check prefixes and duplicates
            const prefixRegex = /^(ด\.?ช\.?|ด\.?ญ\.?|เด็กชาย|เด็กหญิง)\s*/i;
            const nameSet = new Set();

            for (const name of studentNames) {
                if (!prefixRegex.test(name)) {
                    throw new Error('กรุณาเลือกตัวย่อคำนำหน้าชื่อ');
                }

                // Robust strip function matching backend: removes dots and ALL spaces
                const nameWithoutPrefix = name.trim()
                    .replace(prefixRegex, '')
                    .replace(/[\s\.]/g, '')
                    .toLowerCase();

                const nameParts = name.trim().replace(prefixRegex, '').trim().split(/\s+/).filter(p => p.length > 0);
                
                if (nameParts.length < 2) {
                    throw new Error('กรุณากรอกชื่อและนามสกุล');
                }

                if (nameSet.has(nameWithoutPrefix)) {
                    throw new Error('พบชื่อ-นามสกุลซ้ำในรายการที่กำลังจะเพิ่ม กรุณาตรวจสอบอีกครั้ง');
                }
                nameSet.add(nameWithoutPrefix);
            }

            const studentsData = studentNames.map(name => ({ name }));

            const token = localStorage.getItem('token');
            const response = await axios.post(
                getApiUrl(`/teacher/classrooms/${classroomId}/students`),
                { students: studentsData },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success(`สร้างบัญชีนักเรียนใหม่ ${response.data.data.students.length} คนสำเร็จ`);
                onSuccess();
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            // Scroll to error if it exists
            setTimeout(() => {
                const errorEl = document.getElementById('student-upload-error');
                if (errorEl) errorEl.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-[#FFB000] p-4 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <UserPlus size={24} />
                        สร้างบัญชีนักเรียน
                    </h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleCreateSubmit} className="flex flex-col h-full">
                    <div className="p-6 overflow-y-auto flex-1">
                        <div className="space-y-4 h-full flex flex-col">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 shrink-0">
                                <AlertCircle className="text-blue-500 shrink-0" size={20} />
                                <div className="text-sm text-blue-700">
                                    <p className="font-semibold mb-1">คำแนะนำ</p>

                                    <p>คำนำหน้าเลือกใช้     ด.ช./ด.ญ./เด็กชาย/เด็กหญิง</p>
                                    <p>พิมพ์ชื่อ-นามสกุลของนักเรียน 1 คนต่อ 1 บรรทัด</p>

                                </div>
                            </div>

                            <div className="flex-1 min-h-[200px]">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    รายชื่อนักเรียน
                                </label>
                                <textarea
                                    value={names}
                                    onChange={(e) => setNames(e.target.value)}
                                    placeholder="เด็กชาย พัชรพงษ์ พูนทรัพย์อมร &#10;ด.ญ.พัชราริน สุวรรณหงษ์&#10;"
                                    className="w-full h-full min-h-[200px] p-4 rounded-xl border-2 border-gray-200 focus:border-[#FFB000] focus:ring-4 focus:ring-[#FFB000]/20 transition-all resize-none font-medium"
                                />
                            </div>
                            <div className="text-right text-sm text-gray-500 shrink-0">
                                จำนวน: {names.split('\n').filter(n => n.trim()).length} คน
                            </div>

                            {error && (
                                <div id="student-upload-error" className="mt-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 shrink-0">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t bg-gray-50 flex gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-white transition-colors"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={
                                isSubmitting ||
                                !names.trim()
                            }
                            className="flex-1 px-4 py-2 rounded-xl bg-[#FFB000] text-white font-bold hover:bg-[#E59E00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Upload size={20} />
                                    สร้างบัญชี
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStudentToClassModal;
