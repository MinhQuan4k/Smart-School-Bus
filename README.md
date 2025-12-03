🚍 Smart School Bus (SSB) - Hệ Thống Quản Lý & Giám Sát Xe Buýt Học Sinh

Đồ án Tốt nghiệp / Bài tập lớn > Hệ thống quản lý vận tải hành khách thông minh dành cho trường học, tích hợp định vị GPS thời gian thực (Real-time Tracking) và thông báo tự động.

📖 Giới thiệu

Smart School Bus (SSB) là giải pháp công nghệ giúp giải quyết bài toán an toàn trong việc đưa đón học sinh. Hệ thống kết nối 3 đối tượng: Nhà trường (Quản lý), Tài xế và Phụ huynh thông qua nền tảng Web và Mobile.

✨ Tính năng nổi bật

🗺️ Giám sát lộ trình thực (Live Tracking): Xem vị trí xe di chuyển mượt mà trên bản đồ.

🔔 Thông báo tức thì: Phụ huynh nhận tin nhắn ngay khi con lên/xuống xe hoặc xe sắp đến trạm.

📅 Phân công lịch trình thông minh: Tự động tạo lịch chạy, quản lý đội xe và tài xế.

🚨 Cảnh báo sự cố: Tài xế báo cáo tắc đường/hỏng xe chỉ với 1 chạm.

📊 Báo cáo tự động: Xuất danh sách điểm danh ra file Excel.

🛠️ Công nghệ sử dụng

Thành phần

Công nghệ

Chi tiết kỹ thuật

Backend

Node.js

Express Framework, RESTful API

Database

MySQL

Quan hệ (Relational), Indexing tối ưu

Real-time

Socket.io

WebSocket cho Tracking & Notification

Frontend (Admin)

ReactJS

Vite, Tailwind/CSS Modules, Axios

Maps

Leaflet

OpenStreetMap, Custom Markers, Polyline

Security

JWT

JSON Web Token, Bcrypt Hashing

📂 Cấu trúc thư mục

Smart-School-Bus/
├── ssb_backend/        # Server Node.js (API & Socket)
│   ├── src/
│   │   ├── config/     # Kết nối Database
│   │   ├── controllers/# Logic xử lý
│   │   ├── models/     # Truy vấn SQL
│   │   ├── routes/     # Định nghĩa API
│   │   └── sockets/    # Xử lý Real-time
│   ├── server.js       # File khởi chạy
│   └── test_client/    # Trình giả lập App (Simulator)
│
├── ssb_admin/          # Web Admin (ReactJS)
│   ├── src/
│   │   ├── components/ # Các màn hình chức năng
│   │   └── App.jsx     # Điều hướng chính
│   └── package.json
│
└── ssb_mobile/         # (Optional) Source code App Mobile


🚀 Hướng dẫn Cài đặt & Chạy

Bước 1: Chuẩn bị Cơ sở dữ liệu

Cài đặt XAMPP và bật module MySQL.

Truy cập http://localhost/phpmyadmin.

Tạo database mới tên: ssb_bus_tracking.

Import file SQL: ssb_full_final.sql (Nằm trong thư mục tài liệu hoặc do tác giả cung cấp).

Bước 2: Khởi chạy Backend (Server)

Mở Terminal tại thư mục ssb_backend:

# Cài đặt thư viện (lần đầu)
npm install

# Chạy Server
npm run dev
# Hoặc: node server.js


Server sẽ chạy tại: http://localhost:3000

Bước 3: Khởi chạy Web Admin (Frontend)

Mở Terminal mới tại thư mục ssb_admin:

# Cài đặt thư viện (lần đầu)
npm install

# Chạy Web
npm run dev


Web sẽ chạy tại: http://localhost:5173

🎮 Hướng dẫn Demo (Kịch bản kiểm thử)

Để thấy toàn bộ sức mạnh của hệ thống, hãy thực hiện theo kịch bản sau:

1. Đăng nhập Quản trị viên

Truy cập Web Admin.

Tài khoản: admin / Mật khẩu: 123.

Vào menu "📅 Phân công Lịch" -> Tạo một chuyến xe cho ngày hôm nay.

2. Kích hoạt Xe chạy (Giả lập Tài xế)

Mở trình duyệt mới, truy cập file: ssb_backend/test_client/index.html.

Tại cột Tài xế: Chọn chuyến xe vừa tạo -> Bấm Kết nối -> Bấm ▶️ BẮT ĐẦU CHẠY.

Quan sát: Trên Web Admin (Menu Giám sát), xe sẽ bắt đầu di chuyển trên bản đồ.

3. Theo dõi & Điểm danh (Giả lập Phụ huynh)

Tại file index.html, cột Phụ huynh: Chọn tên phụ huynh -> Bấm BẮT ĐẦU THEO DÕI.

Tại cột Tài xế: Bấm nút "Đón" bên cạnh tên học sinh.

Kết quả: Phụ huynh nhận được thông báo "🔔 Học sinh đã lên xe" ngay lập tức.

4. Báo cáo Sự cố

Tài xế bấm nút "🚗 Kẹt xe".

Admin và Phụ huynh đều nhận được cảnh báo đỏ "🚨 SỰ CỐ GIAO THÔNG".

🔑 Danh sách Tài khoản Demo (Mật khẩu: 123)

Vai trò

Tên hiển thị

SĐT Đăng nhập

ADMIN

Admin Quản Trị

admin

TÀI XẾ

Tài xế Tuấn

0901111111

TÀI XẾ

Tài xế Hùng

0902222222

PHỤ HUYNH

Chị Lan (Mẹ Bé Bi)

0903333333

PHỤ HUYNH

Anh Minh (Bố Bé Bo)

0904444444

📞 Liên hệ & Hỗ trợ

Tác giả: [Tên Của Bạn]

Email: [Email Của Bạn]

Phiên bản: 1.0.0 (MVP Release)