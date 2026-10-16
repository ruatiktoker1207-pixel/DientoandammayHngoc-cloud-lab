# Nguyễn Hoài Ngọc

MSSV: 235191

## Quản lý sinh viên (MERN)

Ứng dụng CRUD sinh viên: React (Vite) + Express + MongoDB.

### Chạy local bằng Docker

```bash
cd mern-demo
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000 (kiểm tra: `/health`)

### Chạy bằng ảnh Docker Hub

Tạo file `mern-demo/.env`:

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/cloud_lab
```

rồi chạy `docker compose -f docker-compose.hub.yml up -d`. Frontend ở http://localhost:3000.

### Chạy không dùng Docker

```bash
# Backend
cd mern-demo/server && cp .env.example .env   # sửa MONGODB_URI
npm install && npm start

# Frontend
cd mern-demo/client && npm install && npm run dev
```

Biến `VITE_API_URL` của frontend đặt trong `client/.env.development` / `.env.production`.

### Lưu ý bảo mật

Không commit chuỗi kết nối MongoDB hay mật khẩu. Dùng file `.env` (đã nằm trong `.gitignore`).