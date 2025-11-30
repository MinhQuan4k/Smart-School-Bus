DROP DATABASE IF EXISTS ssb_bus_tracking;
CREATE DATABASE ssb_bus_tracking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ssb_bus_tracking;

SET FOREIGN_KEY_CHECKS = 0; -- Tắt kiểm tra khóa ngoại để tạo bảng trơn tru

-- =============================================================
-- PHẦN 2: TẠO CÁC BẢNG (STRUCTURE)
-- =============================================================

-- 1. Bảng USERS (Lưu tất cả tài khoản)
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE, -- Tài khoản đăng nhập
    password VARCHAR(255) NOT NULL,    -- Mật khẩu đã mã hóa
    role ENUM('admin', 'driver', 'parent') NOT NULL DEFAULT 'parent',
    avatar VARCHAR(255) DEFAULT NULL,
    address TEXT,
    fcm_token VARCHAR(255) DEFAULT NULL, -- Token để bắn thông báo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Bảng XE BUÝT (BUSES)
CREATE TABLE buses (
    bus_id INT PRIMARY KEY AUTO_INCREMENT,
    license_plate VARCHAR(20) NOT NULL UNIQUE, -- Biển số (VD: 59B-123.45)
    brand VARCHAR(50),
    capacity INT NOT NULL DEFAULT 16,
    status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active'
) ENGINE=InnoDB;

-- 3. Bảng TUYẾN ĐƯỜNG (ROUTES)
CREATE TABLE routes (
    route_id INT PRIMARY KEY AUTO_INCREMENT,
    route_name VARCHAR(100) NOT NULL, 
    start_point VARCHAR(255) NOT NULL,
    end_point VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Bảng HỌC SINH (STUDENTS)
CREATE TABLE students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    parent_id INT NOT NULL,     -- Con của phụ huynh nào
    full_name VARCHAR(100) NOT NULL,
    class_name VARCHAR(20),
    image_url VARCHAR(255),
    pickup_address TEXT,        -- Điểm đón
    FOREIGN KEY (parent_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Bảng LỊCH TRÌNH (SCHEDULES)
CREATE TABLE schedules (
    schedule_id INT PRIMARY KEY AUTO_INCREMENT,
    route_id INT NOT NULL,
    bus_id INT NOT NULL,
    driver_id INT NOT NULL,
    
    date DATE NOT NULL,              -- Ngày chạy
    start_time TIME NOT NULL,        -- Giờ xuất phát
    
    status ENUM('pending', 'running', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (route_id) REFERENCES routes(route_id),
    FOREIGN KEY (bus_id) REFERENCES buses(bus_id),
    FOREIGN KEY (driver_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- 6. Bảng ĐIỂM DANH (TRIP_ATTENDANCE)
CREATE TABLE trip_attendance (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    schedule_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('not_picked', 'picked_up', 'dropped_off', 'absent') DEFAULT 'not_picked',
    pickup_time DATETIME DEFAULT NULL,
    dropoff_time DATETIME DEFAULT NULL,
    
    FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Bảng LỊCH SỬ VỊ TRÍ (LOCATION_LOGS)
CREATE TABLE location_logs (
    log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    schedule_id INT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed FLOAT DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX (schedule_id),
    FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Bảng THÔNG BÁO (NOTIFICATIONS)
CREATE TABLE notifications (
    noti_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(100),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1; -- Bật lại kiểm tra

-- =============================================================
-- PHẦN 3: DỮ LIỆU MẪU (SEED DATA) - MẬT KHẨU LÀ "123"
-- =============================================================

-- Hash chuẩn của "123" là: $2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa

-- 1. Thêm Users
INSERT INTO users (user_id, full_name, phone, password, role) VALUES 
(1, 'Admin Quản Trị', 'admin', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'admin'),
(2, 'Tài Xế Tuấn', '0901111111', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'driver'),
(3, 'Tài Xế Hùng', '0902222222', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'driver'),
(4, 'Mẹ Bé Bi', '0903333333', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'parent'),
(5, 'Bố Bé Bo', '0904444444', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'parent');

-- 2. Thêm Xe Buýt
INSERT INTO buses (bus_id, license_plate, brand, capacity) VALUES 
(1, '59B-123.45', 'Hyundai Solati', 16),
(2, '59B-999.99', 'Ford Transit', 16);

-- 3. Thêm Tuyến Đường
INSERT INTO routes (route_id, route_name, start_point, end_point) VALUES 
(1, 'Tuyến 01: Q7 - Q1', 'KDC Him Lam', 'Trường Lê Hồng Phong'),
(2, 'Tuyến 02: Tân Bình - Q3', 'Sân Bay TSN', 'Trường Marie Curie');

-- 4. Thêm Học Sinh
INSERT INTO students (student_id, parent_id, full_name, class_name) VALUES 
(1, 4, 'Nguyễn Bé Bi', 'Lớp Lá'),
(2, 5, 'Trần Bé Bo', 'Lớp Chồi');

-- 5. Thêm Lịch Trình (Cho ngày hôm nay)
INSERT INTO schedules (schedule_id, route_id, bus_id, driver_id, date, start_time, status) VALUES 
(1, 1, 1, 2, CURDATE(), '06:30:00', 'running'), -- Chuyến số 1 đang chạy
(2, 2, 2, 3, CURDATE(), '07:00:00', 'pending'); -- Chuyến số 2 đang chờ

-- 6. Thêm Điểm Danh (Bé Bi đi chuyến 1)
INSERT INTO trip_attendance (schedule_id, student_id, status) VALUES 
(1, 1, 'not_picked');
DELETE FROM users WHERE user_id = 1;
ALTER TABLE students 
ADD COLUMN latitude DECIMAL(10, 8) DEFAULT 10.762622,
ADD COLUMN longitude DECIMAL(11, 8) DEFAULT 106.660172;