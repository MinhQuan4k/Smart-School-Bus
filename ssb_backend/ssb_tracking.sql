-- =============================================================
-- PHẦN 1: KHỞI TẠO DATABASE
-- =============================================================
DROP DATABASE IF EXISTS ssb_bus_tracking;
CREATE DATABASE ssb_bus_tracking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ssb_bus_tracking;

SET FOREIGN_KEY_CHECKS = 0; -- Tắt check khóa ngoại để tạo bảng không bị lỗi thứ tự

-- =============================================================
-- PHẦN 2: TẠO CÁC BẢNG (TABLES)
-- =============================================================

-- 1. Bảng USERS (Dùng chung cho Admin, Tài xế, Phụ huynh)
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE, -- Số điện thoại là tài khoản đăng nhập
    password VARCHAR(255) NOT NULL,    -- Mật khẩu (Nên mã hóa Bcrypt)
    role ENUM('admin', 'driver', 'parent') NOT NULL DEFAULT 'parent',
    avatar VARCHAR(255) DEFAULT NULL,
    address TEXT,
    fcm_token VARCHAR(255) DEFAULT NULL, -- Token để bắn thông báo (Firebase Cloud Messaging)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Bảng XE BUÝT (BUSES)
CREATE TABLE buses (
    bus_id INT PRIMARY KEY AUTO_INCREMENT,
    license_plate VARCHAR(20) NOT NULL UNIQUE, -- Biển số (VD: 59B-123.45)
    brand VARCHAR(50),                         -- Hãng xe
    capacity INT NOT NULL DEFAULT 16,          -- Số chỗ ngồi
    status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active'
) ENGINE=InnoDB;

-- 3. Bảng TUYẾN ĐƯỜNG (ROUTES)
CREATE TABLE routes (
    route_id INT PRIMARY KEY AUTO_INCREMENT,
    route_name VARCHAR(100) NOT NULL, -- VD: Tuyến 01 - Quận 7
    start_point VARCHAR(255) NOT NULL,
    end_point VARCHAR(255) NOT NULL,
    path_json JSON DEFAULT NULL,      -- (Nâng cao) Lưu danh sách các điểm dừng dạng JSON
    estimated_distance FLOAT,         -- Khoảng cách ước tính (km)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Bảng HỌC SINH (STUDENTS)
CREATE TABLE students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    parent_id INT NOT NULL,     -- Liên kết với Phụ huynh
    full_name VARCHAR(100) NOT NULL,
    class_name VARCHAR(20),
    gender ENUM('male', 'female', 'other') DEFAULT 'male',
    dob DATE,                   -- Ngày sinh
    image_url VARCHAR(255),
    pickup_address TEXT,        -- Điểm đón cụ thể của bé này
    FOREIGN KEY (parent_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Bảng LỊCH TRÌNH CHẠY (SCHEDULES) - Trung tâm của hệ thống
CREATE TABLE schedules (
    schedule_id INT PRIMARY KEY AUTO_INCREMENT,
    route_id INT NOT NULL,
    bus_id INT NOT NULL,
    driver_id INT NOT NULL,
    
    date DATE NOT NULL,              -- Ngày chạy
    start_time TIME NOT NULL,        -- Giờ dự kiến xuất phát
    actual_start_time DATETIME,      -- Giờ thực tế chạy
    actual_end_time DATETIME,        -- Giờ thực tế kết thúc
    
    status ENUM('pending', 'running', 'completed', 'cancelled') DEFAULT 'pending',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (route_id) REFERENCES routes(route_id),
    FOREIGN KEY (bus_id) REFERENCES buses(bus_id),
    FOREIGN KEY (driver_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- 6. Bảng ĐIỂM DANH (TRIP_ATTENDANCE) - Quản lý Đón/Trả
CREATE TABLE trip_attendance (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    schedule_id INT NOT NULL,
    student_id INT NOT NULL,
    
    status ENUM('not_picked', 'picked_up', 'dropped_off', 'absent') DEFAULT 'not_picked',
    
    pickup_time DATETIME DEFAULT NULL,  -- Thời gian lên xe
    dropoff_time DATETIME DEFAULT NULL, -- Thời gian xuống xe
    
    note VARCHAR(255),                  -- Ghi chú của tài xế
    
    FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Bảng LỊCH SỬ VỊ TRÍ (LOCATION_LOGS) - Cho tính năng Tracking
CREATE TABLE location_logs (
    log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    schedule_id INT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed FLOAT DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX (schedule_id), -- Đánh index để truy vấn nhanh
    FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Bảng SỰ CỐ (INCIDENTS) - Báo cáo kẹt xe, hỏng xe
CREATE TABLE incidents (
    incident_id INT PRIMARY KEY AUTO_INCREMENT,
    schedule_id INT NOT NULL,
    driver_id INT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'traffic_jam', 'accident', 'breakdown'
    description TEXT,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Bảng THÔNG BÁO (NOTIFICATIONS) - Lưu tin nhắn hệ thống
CREATE TABLE notifications (
    noti_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL, -- Người nhận (Phụ huynh hoặc Tài xế)
    title VARCHAR(100),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    type ENUM('info', 'alert', 'reminder') DEFAULT 'info',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1; -- Bật lại kiểm tra khóa ngoại

-- =============================================================
-- PHẦN 3: DỮ LIỆU MẪU (SEED DATA)
-- =============================================================

-- 1. Thêm Users (Mật khẩu mẫu chưa mã hóa, thực tế phải dùng bcrypt)
INSERT INTO users (user_id, full_name, phone, password, role) VALUES 
(1, 'Admin Hệ Thống', 'admin', '$2b$10$SampleHashPass...', 'admin'),
(2, 'Nguyễn Văn Tài', '0901000001', '$2b$10$SampleHashPass...', 'driver'),
(3, 'Trần Văn Xế', '0901000002', '$2b$10$SampleHashPass...', 'driver'),
(4, 'Chị Lan Phụ Huynh', '0902000001', '$2b$10$SampleHashPass...', 'parent'),
(5, 'Anh Hùng Phụ Huynh', '0902000002', '$2b$10$SampleHashPass...', 'parent');

-- 2. Thêm Xe
INSERT INTO buses (bus_id, license_plate, brand, capacity) VALUES 
(1, '59B-123.45', 'Hyundai Solati', 16),
(2, '51B-999.88', 'Ford Transit', 16),
(3, '59B-567.89', 'Thaco Bus', 29);

-- 3. Thêm Tuyến đường
INSERT INTO routes (route_id, route_name, start_point, end_point) VALUES 
(1, 'Tuyến Số 1: Q7 - Q1', 'KDC Him Lam', 'Trường THPT Lê Hồng Phong'),
(2, 'Tuyến Số 2: Bình Thạnh - Q1', 'Vinhomes Central Park', 'Trường THPT Lê Hồng Phong');

-- 4. Thêm Học sinh
INSERT INTO students (student_id, parent_id, full_name, class_name) VALUES 
(1, 4, 'Nguyễn Bé Bi', '1A'), -- Con của Chị Lan (ID 4)
(2, 4, 'Nguyễn Bé Bo', '5B'), -- Con của Chị Lan (ID 4)
(3, 5, 'Trần Tí Nị', '3C');   -- Con của Anh Hùng (ID 5)

-- 5. Thêm Lịch trình (Schedules) cho NGÀY HÔM NAY (CURDATE)
INSERT INTO schedules (schedule_id, route_id, bus_id, driver_id, date, start_time, status) VALUES 
(1, 1, 1, 2, CURDATE(), '06:30:00', 'running'),  -- Chuyến đang chạy
(2, 2, 2, 3, CURDATE(), '07:00:00', 'pending');  -- Chuyến sắp chạy

-- 6. Thêm Điểm danh cho Chuyến số 1
INSERT INTO trip_attendance (schedule_id, student_id, status, pickup_time) VALUES 
(1, 1, 'picked_up', NOW()), -- Bé Bi đã lên xe
(1, 2, 'not_picked', NULL); -- Bé Bo chưa lên

-- 7. Thêm Thông báo mẫu
INSERT INTO notifications (user_id, title, message) VALUES 
(4, 'Xe sắp đến', 'Xe buýt số 59B-123.45 đang cách điểm đón 500m.');

-- Kết thúc script