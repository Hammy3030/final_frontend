# BearThai — Frontend

แอป React (Vite) สำหรับนักเรียนและครู

## ความต้องการของระบบ

- Node.js 18+ (แนะนำ LTS)

## ตั้งค่า

1. คัดลอก `bearthai-front-main/.env.example` เป็น `.env`  
2. ตั้ง `VITE_API_URL` ชี้ไปที่ backend **ไม่มี** trailing slash (ไม่ต้องต่อ `/api` — โค้ดต่อให้แล้ว)

## รันในเครื่อง

```bash
cd bearthai-front-main
npm install
npm run dev
```

ค่าเริ่มต้นมักอยู่ที่ `http://localhost:5173`

## Build

```bash
npm run build
npm run preview   # ทดสอบ production build ในเครื่อง
```

## ทดสอบ

```bash
npm test
```

หมายเหตุ: สคริปต์ `npm run lint` อาจไม่สอดคล้องกับรูปแบบ config ปัจจุบัน — CI ใน repo เน้น test + build

## E2E แบบมือ (ร่วมกับ backend)

1. รัน API ตาม [`bearthai-Backend-main/README.md`](../bearthai-Backend-main/README.md)  
2. ตั้ง `VITE_API_URL` ให้ตรงกับ URL API  
3. ล็อกอิน / ลงทะเบียน → นำทางหลักของครูและนักเรียน → เปิดบทเรียนหนึ่งบท → ตรวจ network tab ว่าไม่มี CORS หรือ 401 ผิดปกติ

รายละเอียด smoke API: `bearthai-Backend-main/scripts/smoke-release.sh`

## Deploy และเอกสารทีม

- แยก staging/production, secrets, `VITE_API_URL`: [`docs/deploy.md`](../docs/deploy.md)  
- Monitoring / `X-Request-Id`: [`docs/monitoring.md`](../docs/monitoring.md)  
- สำรอง DB, rollback, หมุนเวียนความลับ: โฟลเดอร์ [`docs/runbooks/`](../docs/runbooks/)  
- Checklist เมื่อเกิดเหตุ (สั้น): ส่วนท้ายของ [`bearthai-Backend-main/README.md`](../bearthai-Backend-main/README.md)
