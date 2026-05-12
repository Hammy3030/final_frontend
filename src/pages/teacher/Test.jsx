import { useEffect, useState } from "react";
import { getApiUrl } from "../../utils/apiConfig";
import axios from 'axios';

const TestPage = () => {
    const [classrooms, setClassrooms] = useState([]); // เก็บรายชื่อห้องเรียน
    const [selectedClass, setSelectedClass] = useState(""); // เก็บ ID ห้องที่เลือก
    const [reports, setReports] = useState([]); // เก็บผลคะแนนนักเรียน
    const [loading, setLoading] = useState(false);

    // 1. ดึงรายชื่อห้องเรียนทั้งหมดมาแสดงใน Dropdown (ใช้ API เดิมจากไฟล์คุณ)
    const fetchClassrooms = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(getApiUrl('/teacher/classrooms'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setClassrooms(response.data.data.classrooms);
            }
        } catch (error) {
            console.error('Error fetching classrooms:', error);
        }
    };

    // 2. คิวรี่รายงานนักเรียนเมื่อเลือกห้อง (ใช้ API Report จาก teacher.js)
    const fetchReports = async (classId) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(getApiUrl(`/teacher/classrooms/${classId}/reports`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setReports(response.data.data.reports || []); // ปรับตามโครงสร้าง data ของคุณ
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClassrooms();
    }, []);

    const handleClassChange = (e) => {
        const id = e.target.value;
        setSelectedClass(id);
        if (id) fetchReports(id);
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>ตรวจสอบผลการทดสอบ Pre-test / Post-test</h2>

            {/* ส่วนเลือกห้องเรียน */}
            <div style={{ marginBottom: '20px' }}>
                <label>เลือกห้องเรียน: </label>
                <select onChange={handleClassChange} value={selectedClass}>
                    <option value="">-- กรุณาเลือกห้องเรียน --</option>
                    {classrooms.map(cls => (
                        <option key={cls._id} value={cls._id}>{cls.name}</option>
                    ))}
                </select>
            </div>

            <hr />

            {/* ส่วนแสดงผลรายงาน */}
            {loading ? (
                <p>กำลังโหลดข้อมูลรายงาน...</p>
            ) : (
                <table border="1" width="100%" style={{ borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#eee' }}>
                            <th>ชื่อนักเรียน</th>
                            <th>แบบทดสอบ (Pre)</th>
                            <th>แบบทดสอบ (Post)</th>
                            <th>สถานะการเรียน</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.length > 0 ? reports.map((item, idx) => (
                            <tr key={idx}>
                                <td>{item.studentName}</td>
                                <td>{item.preTestScore ?? '-'}</td>
                                <td>{item.postTestScore ?? '-'}</td>
                                <td>{item.isCompleted ? 'เรียนจบแล้ว' : 'กำลังเรียน'}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center' }}>
                                    {selectedClass ? 'ไม่มีข้อมูลนักเรียนในห้องนี้' : 'โปรดเลือกห้องเรียนเพื่อดูข้อมูล'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default TestPage;