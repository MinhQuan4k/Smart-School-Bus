-- =============================================================
-- PHẦN 1: KHỞI TẠO DATABASE (LÀM SẠCH)
-- =============================================================
DROP DATABASE IF EXISTS ssb_bus_tracking;
CREATE DATABASE ssb_bus_tracking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ssb_bus_tracking;

SET FOREIGN_KEY_CHECKS = 0; -- Tắt kiểm tra khóa ngoại tạm thời

-- =============================================================
-- PHẦN 2: TẠO CẤU TRÚC BẢNG (SCHEMA)
-- =============================================================

-- 1. Bảng USERS (Lưu tất cả tài khoản)
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE, -- Tài khoản đăng nhập
    password VARCHAR(255) NOT NULL,    -- Mật khẩu đã mã hóa
    role ENUM('admin', 'driver', 'parent') NOT NULL DEFAULT 'parent',
    address VARCHAR(255) DEFAULT NULL, -- Địa chỉ liên hệ
    avatar VARCHAR(255) DEFAULT NULL,
    fcm_token VARCHAR(255) DEFAULT NULL, -- Token bắn thông báo mobile
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
    estimated_duration INT DEFAULT 60, -- Thời gian dự kiến (phút)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Bảng TRẠM DỪNG (STOPS) - QUAN TRỌNG
CREATE TABLE stops (
    stop_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,        -- Tên trạm (VD: Cổng Siêu thị Go)
    address VARCHAR(255),              -- Địa chỉ cụ thể
    latitude DECIMAL(10, 8) NOT NULL,  -- GPS Lat
    longitude DECIMAL(11, 8) NOT NULL, -- GPS Lng
    is_school BOOLEAN DEFAULT FALSE,   -- Đánh dấu nếu đây là Trường học
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Bảng LỘ TRÌNH CHI TIẾT (ROUTE_STOPS)
-- Liên kết Tuyến đường và Trạm dừng theo thứ tự
CREATE TABLE route_stops (
    id INT PRIMARY KEY AUTO_INCREMENT,
    route_id INT NOT NULL,
    stop_id INT NOT NULL,
    order_index INT NOT NULL,      -- Thứ tự dừng (1, 2, 3...)
    minutes_from_start INT,        -- Thời gian dự kiến từ lúc xuất phát
    
    FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE CASCADE,
    FOREIGN KEY (stop_id) REFERENCES stops(stop_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Bảng HỌC SINH (STUDENTS)
CREATE TABLE students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    parent_id INT NOT NULL,     -- Con của phụ huynh nào
    stop_id INT,                -- Đón ở trạm nào (Thay cho địa chỉ nhà)
    full_name VARCHAR(100) NOT NULL,
    class_name VARCHAR(20),
    image_url VARCHAR(255),
    pickup_address TEXT,        -- Giữ lại để tham khảo (optional)
    
    FOREIGN KEY (parent_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (stop_id) REFERENCES stops(stop_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 7. Bảng LỊCH TRÌNH CHẠY (SCHEDULES)
CREATE TABLE schedules (
    schedule_id INT PRIMARY KEY AUTO_INCREMENT,
    route_id INT NOT NULL,
    bus_id INT NOT NULL,
    driver_id INT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    status ENUM('pending', 'running', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (route_id) REFERENCES routes(route_id),
    FOREIGN KEY (bus_id) REFERENCES buses(bus_id),
    FOREIGN KEY (driver_id) REFERENCES users(user_id)
) ENGINE=InnoDB;

-- 8. Bảng ĐIỂM DANH (TRIP_ATTENDANCE)
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

-- 9. Bảng LOG VỊ TRÍ (LOCATION_LOGS)
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

-- 10. Bảng SỰ CỐ (INCIDENTS)
CREATE TABLE incidents (
    incident_id INT PRIMARY KEY AUTO_INCREMENT,
    schedule_id INT NOT NULL,
    driver_id INT NOT NULL,
    type VARCHAR(50), -- traffic, breakdown, accident
    description TEXT,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. Bảng THÔNG BÁO (NOTIFICATIONS)
CREATE TABLE notifications (
    noti_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(100),
    message TEXT,
    type ENUM('info', 'alert', 'reminder') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tối ưu hiệu năng tìm kiếm
CREATE INDEX idx_schedule_date ON schedules(date);
CREATE INDEX idx_user_phone ON users(phone);
CREATE INDEX idx_attendance_status ON trip_attendance(status);

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================
-- PHẦN 3: DỮ LIỆU MẪU (DATA SEEDING)
-- =============================================================

-- Hash chuẩn của mật khẩu "123":
-- $2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa

-- 1. USERS (Admin, Driver, Parent)
INSERT INTO users (user_id, full_name, phone, password, role, address) VALUES 
(1, 'Admin Quản Trị', 'admin', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'admin', 'Văn phòng'),
-- Drivers
(2, 'Tài Xế Tuấn', '0901111111', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'driver', 'Quận 7'),
(3, 'Tài Xế Hùng', '0902222222', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'driver', 'Bình Thạnh'),
(4, 'Tài Xế Nam', '0903333333', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'driver', 'Gò Vấp'),
-- Parents
(5, 'Chị Lan (Mẹ Bé Bi)', '0905555555', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'parent', 'Sunrise City'),
(6, 'Anh Minh (Bố Bé Bo)', '0906666666', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'parent', 'Vinhomes Central Park'),
(7, 'Chị Hạnh (Mẹ Bé Na)', '0907777777', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'parent', 'Thảo Điền');

-- 2. BUSES
INSERT INTO buses (bus_id, license_plate, brand, capacity, status) VALUES 
(1, '59B-123.45', 'Hyundai Solati', 16, 'active'),
(2, '59B-678.90', 'Ford Transit', 16, 'active'),
(3, '51B-999.99', 'Thaco Bus', 29, 'maintenance');

-- 3. STOPS (Tọa độ thực tế TP.HCM)
INSERT INTO stops (stop_id, name, address, latitude, longitude, is_school) VALUES 
-- Điểm cuối chung
(1, 'Trường THPT Lê Hồng Phong', '235 Nguyễn Văn Cừ, Q.5', 10.762622, 106.682172, 1), 

-- Tuyến 1 (Quận 7)
(2, 'Lotte Mart Quận 7', '469 Nguyễn Hữu Thọ', 10.732832, 106.700825, 0),
(3, 'KDC Him Lam', 'Nguyễn Thị Thập', 10.738912, 106.696500, 0),
(4, 'Đại học Tôn Đức Thắng', '19 Nguyễn Hữu Thọ', 10.732500, 106.699000, 0),
(5, 'Cầu Kênh Tẻ', 'Nối Q4 - Q7', 10.749500, 106.700200, 0),

-- Tuyến 2 (Bình Thạnh)
(6, 'Landmark 81', '208 Nguyễn Hữu Cảnh', 10.795300, 106.721800, 0),
(7, 'Thảo Cầm Viên', '2 Nguyễn Bỉnh Khiêm', 10.787700, 106.705000, 0),
(8, 'Nhà Thờ Đức Bà', '01 Công xã Paris', 10.779800, 106.699000, 0);

-- 4. ROUTES
INSERT INTO routes (route_id, route_name, start_point, end_point, estimated_duration) VALUES 
(1, 'Tuyến 01: Quận 7 - LHP', 'Lotte Mart Q7', 'Trường LHP', 45),
(2, 'Tuyến 02: Bình Thạnh - LHP', 'Landmark 81', 'Trường LHP', 40);

-- 5. ROUTE_STOPS (Liên kết Trạm vào Tuyến)
INSERT INTO route_stops (route_id, stop_id, order_index, minutes_from_start) VALUES
-- Tuyến 1
(1, 2, 1, 0), (1, 4, 2, 10), (1, 3, 3, 15), (1, 5, 4, 25), (1, 1, 5, 45),
-- Tuyến 2
(2, 6, 1, 0), (2, 7, 2, 15), (2, 8, 3, 25), (2, 1, 4, 40);

-- 6. STUDENTS (Gán vào Trạm)
INSERT INTO students (student_id, parent_id, stop_id, full_name, class_name) VALUES 
(1, 5, 2, 'Nguyễn Bé Bi', '1A'),   -- Con chị Lan, đón ở Lotte Mart
(2, 5, 3, 'Nguyễn Bé Bông', '5B'), -- Con chị Lan, đón ở Him Lam
(3, 6, 6, 'Trần Bé Bo', '3C'),     -- Con anh Minh, đón ở Landmark 81
(4, 7, 7, 'Lê Bé Na', '2A');       -- Con chị Hạnh, đón ở Sở Thú

-- 7. SCHEDULES (Lịch hôm nay)
INSERT INTO schedules (schedule_id, route_id, bus_id, driver_id, date, start_time, status) VALUES 
(1, 1, 1, 2, CURDATE(), '06:30:00', 'running'), -- Tuyến 1, Tài xế Tuấn
(2, 2, 2, 3, CURDATE(), '06:45:00', 'pending'); -- Tuyến 2, Tài xế Hùng

-- 8. TRIP_ATTENDANCE (Điểm danh ban đầu)
INSERT INTO trip_attendance (schedule_id, student_id, status) VALUES 
-- Chuyến 1 (Q7)
(1, 1, 'not_picked'), (1, 2, 'not_picked'),
-- Chuyến 2 (Bình Thạnh)
(2, 3, 'not_picked'), (2, 4, 'not_picked');

-- 9. NOTIFICATIONS
INSERT INTO notifications (user_id, title, message, type) VALUES 
(5, 'Học phí', 'Đã nhận học phí tháng 12.', 'info'),
(2, 'Nhắc nhở', 'Bảo dưỡng xe định kỳ.', 'alert');