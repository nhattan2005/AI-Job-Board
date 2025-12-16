# 🚀 AI-Powered IT Job Board

Nền tảng tuyển dụng IT hiện đại tích hợp trí tuệ nhân tạo (Google Gemini AI) giúp kết nối ứng viên và nhà tuyển dụng một cách thông minh. Hệ thống không chỉ đăng tin tuyển dụng mà còn tự động phân tích CV, tính điểm phù hợp và gợi ý lộ trình nghề nghiệp cho ứng viên.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
![React](https://img.shields.io/badge/react-18.3.1-blue)
![PostgreSQL](https://img.shields.io/badge/postgresql-14+-blue)

---

## ✨ Tính Năng Nổi Bật

### 🤖 Tính Năng AI (Powered by Gemini)
- **Match Score Calculation**: Tự động chấm điểm mức độ phù hợp giữa CV và Job Description (0-100%).
- **CV Tailoring**: Phân tích CV và đưa ra gợi ý chỉnh sửa cụ thể để phù hợp với công việc ứng tuyển.
- **Career Path Analyzer**: Phân tích kỹ năng hiện tại và vẽ ra lộ trình thăng tiến, gợi ý các kỹ năng cần học thêm.
- **Vector Search**: Sử dụng `pgvector` để tìm kiếm ứng viên/công việc dựa trên ngữ nghĩa (Semantic Search).

### 🎯 Cho Ứng Viên (Candidate)
- Tìm kiếm việc làm thông minh với bộ lọc chi tiết.
- Upload CV (PDF, DOCX) và quản lý hồ sơ cá nhân.
- Ứng tuyển nhanh (One-Click Apply).
- Theo dõi trạng thái ứng tuyển (Pending, Reviewed, Accepted).
- Nhận lộ trình nghề nghiệp cá nhân hóa từ AI.

### 💼 Cho Nhà Tuyển Dụng (Employer)
- Đăng tin và quản lý tin tuyển dụng.
- Dashboard thống kê hiệu quả tuyển dụng.
- Quản lý danh sách ứng viên theo từng Job.
- Xem trước CV online không cần tải về.
- Gửi email mời phỏng vấn tự động.

---

## 🛠️ Công Nghệ Sử Dụng (PERN Stack)

- **Frontend**: React.js (Vite), TailwindCSS, Axios, React Router v6.
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL (với extension `pgvector`).
- **AI Model**: Google Gemini (`gemini-2.5-flash` cho text, `text-embedding-004` cho vector).
- **Authentication**: JWT (JSON Web Tokens).
- **File Storage**: Multer (lưu trữ cục bộ hoặc memory).

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### 1. Yêu cầu hệ thống
- **Node.js**: Phiên bản 16 trở lên.
- **PostgreSQL**: Đã cài đặt và đang chạy.
- **Git**: Để clone dự án.
- **Gemini API Key**: Lấy miễn phí tại [Google AI Studio](https://aistudio.google.com/).

### 2. Cài đặt

**Bước 1: Clone dự án**
```bash
git clone https://github.com/nhattan2005/AI-Job-Board.git
cd ai-job-board
```

**Bước 2: Cài đặt thư viện (Dependencies)**
```bash
# Cài đặt cho Server
cd server
npm install

# Cài đặt cho Client
cd ../client
npm install
```

**Bước 3: Cấu hình Database**
```bash
# Tạo database
createdb ai_job_board

# Chạy script từ file server/database.sql
psql -d ai_job_board -f ../server/database.sql
```

**Bước 4: Cấu hình biến môi trường (.env)**

Tạo file `server/.env`:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_job_board
JWT_SECRET=my_super_secret_key_123
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=AIzaSy...
CORS_ORIGIN=http://localhost:3000
```

### 3. Chạy ứng dụng

**Terminal 1: Backend**
```bash
cd server
npm run dev
# Server sẽ chạy tại http://localhost:5000
```

**Terminal 2: Frontend**
```bash
cd client
npm run dev
# Client sẽ chạy tại http://localhost:3000
```

---

## 📂 Cấu Trúc Thư Mục
```
ai-job-board/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Các component tái sử dụng
│   │   ├── pages/          # Các trang chính
│   │   ├── context/        # Quản lý trạng thái
│   │   └── services/       # Gọi API
│
├── server/                 # Express Backend
│   ├── src/
│   │   ├── config/         # Cấu hình DB, Gemini
│   │   ├── controllers/    # Xử lý logic
│   │   ├── routes/         # Định nghĩa API
│   │   └── services/       # Logic nghiệp vụ
│   ├── database.sql        # Script tạo DB
│   └── .env                # Biến môi trường
└── README.md
```

---

**Developed by Nhat Tan**