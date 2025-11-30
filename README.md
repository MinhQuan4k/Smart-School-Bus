🚍 Smart School Bus (SSB) - Hệ thống Giám sát Xe Buýt Học sinh

Dự án quản lý và theo dõi xe buýt đưa đón học sinh theo thời gian thực (Real-time Tracking), bao gồm Backend API và Web Admin Dashboard.

📂 Cấu trúc dự án

ssb_backend/: Server Node.js + Express + MySQL + Socket.io.

ssb_admin/: Web Admin Dashboard (ReactJS + Vite + Leaflet Map).

test_client/: File HTML giả lập App Tài xế (nằm trong backend).

🚀 Hướng dẫn Cài đặt & Chạy

1. Chuẩn bị Cơ sở dữ liệu (MySQL)

Mở XAMPP, bật module MySQL.

Truy cập http://localhost/phpmyadmin.

Tạo database tên: ssb_bus_tracking.

Import file SQL (hoặc chạy script tạo bảng) vào database này.

Quan trọng: Đảm bảo trong bảng users đã có tài khoản Admin (SĐT: admin, Pass: 123).

2. Khởi động Backend (Server)

Mở Terminal tại thư mục ssb_backend:

# Cài đặt thư viện (chỉ làm lần đầu)
npm install

# Chạy Server
npm run dev
# Hoặc: node server.js


Server sẽ chạy tại: http://localhost:3000

3. Khởi động Web Admin

Mở Terminal mới tại thư mục ssb_admin:

# Cài đặt thư viện (chỉ làm lần đầu)
npm install

# Chạy Web
npm run dev


Web sẽ chạy tại: http://localhost:5173

4. Giả lập Xe chạy (Mobile App Simulator)

Vào thư mục ssb_backend/test_client.

Mở file index.html bằng trình duyệt.

Nhập ID chuyến xe và bấm "Bắt đầu lái xe" để gửi tọa độ GPS về Server.

🔑 Tài khoản Demo (Mật khẩu mặc định: 123)

Vai trò

SĐT Đăng nhập

Quyền hạn

Admin

admin

Quản lý toàn bộ, Tạo lịch, Xem bản đồ

Tài xế

0901111111

Xem lịch chạy, Điểm danh

Phụ huynh

0903333333

Xem vị trí con, Nhận thông báo

🛠️ Công nghệ sử dụng

Backend: Node.js, Express, MySQL2, Socket.io, JWT Auth.

Frontend: ReactJS (Vite), Axios, React-Leaflet (Bản đồ), CSS Modules.

Real-time: Socket.io (WebSocket).

📝 Các API chính (Postman)

Auth: POST /api/auth/login

Lịch trình: GET /api/schedules, POST /api/schedules

Vị trí (Tracking): Socket Event driver_send_location

Điểm danh: POST /api/tracking/attendance