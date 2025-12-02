-- =============================================================
-- PHẦN 1: KHỞI TẠO DATABASE
-- =============================================================
DROP DATABASE IF EXISTS ssb_bus_tracking;
CREATE DATABASE ssb_bus_tracking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ssb_bus_tracking;

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================
-- PHẦN 2: TẠO BẢNG (STRUCTURE)
-- =============================================================

-- 1. Bảng USERS
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'driver', 'parent') NOT NULL DEFAULT 'parent',
    address VARCHAR(255) DEFAULT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    fcm_token VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Bảng XE BUÝT (BUSES)
CREATE TABLE buses (
    bus_id INT PRIMARY KEY AUTO_INCREMENT,
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    brand VARCHAR(50),
    capacity INT NOT NULL DEFAULT 16,
    status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active'
) ENGINE=InnoDB;

-- 3. Bảng TUYẾN ĐƯỜNG (ROUTES)
CREATE TABLE routes (
    route_id INT PRIMARY KEY AUTO_INCREMENT,
    route_name VARCHAR(100) NOT NULL, 
    start_point VARCHAR(255) NOT NULL, -- Điểm xuất phát chung
    end_point VARCHAR(255) NOT NULL,   -- Điểm kết thúc chung
    estimated_duration INT DEFAULT 60, -- Tổng thời gian chạy (phút)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. [MỚI] Bảng TRẠM DỪNG (STOPS)
-- Lưu danh sách các điểm đón trả cố định
CREATE TABLE stops (
    stop_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,        -- Tên trạm (VD: Cổng Siêu thị Go)
    address VARCHAR(255),              -- Địa chỉ cụ thể
    latitude DECIMAL(10, 8) NOT NULL,  -- Tọa độ GPS
    longitude DECIMAL(11, 8) NOT NULL, -- Tọa độ GPS
    is_school BOOLEAN DEFAULT FALSE,   -- Đánh dấu nếu đây là Trường học
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. [MỚI] Bảng LỘ TRÌNH CHI TIẾT (ROUTE_STOPS)
-- Quy định tuyến A sẽ đi qua những trạm nào, theo thứ tự nào
CREATE TABLE route_stops (
    id INT PRIMARY KEY AUTO_INCREMENT,
    route_id INT NOT NULL,
    stop_id INT NOT NULL,
    order_index INT NOT NULL,      -- Thứ tự dừng (1, 2, 3...)
    minutes_from_start INT,        -- Thời gian dự kiến từ điểm xuất phát (phút)
    
    FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE CASCADE,
    FOREIGN KEY (stop_id) REFERENCES stops(stop_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Bảng HỌC SINH (STUDENTS) - Đã sửa
-- Liên kết học sinh với Trạm đón (thay vì địa chỉ nhà)
CREATE TABLE students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    parent_id INT NOT NULL,
    stop_id INT,               -- [QUAN TRỌNG] Bé đón ở trạm nào?
    full_name VARCHAR(100) NOT NULL,
    class_name VARCHAR(20),
    image_url VARCHAR(255),
    
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
    
    FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Bảng SỰ CỐ (INCIDENTS)
CREATE TABLE incidents (
    incident_id INT PRIMARY KEY AUTO_INCREMENT,
    schedule_id INT NOT NULL,
    driver_id INT NOT NULL,
    type VARCHAR(50),
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
-- Tạo Index cho ngày chạy (để tìm lịch hôm nay nhanh hơn)
CREATE INDEX idx_schedule_date ON schedules(date);

-- Tạo Index cho số điện thoại (để Login nhanh hơn)
CREATE INDEX idx_user_phone ON users(phone);

-- Tạo Index cho trạng thái điểm danh (để thống kê nhanh hơn)
CREATE INDEX idx_attendance_status ON trip_attendance(status);

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================
-- PHẦN 3: DỮ LIỆU MẪU (SEED DATA)
-- =============================================================

-- 1. Users (Pass: 123)
INSERT INTO users (user_id, full_name, phone, password, role) VALUES 
(1, 'Admin Quản Trị', 'admin', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'admin'),
(2, 'Tài Xế Tuấn', '0901111111', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'driver'),
(3, 'Mẹ Bé Bi', '0903333333', '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', 'parent');

-- 2. Xe
INSERT INTO buses (bus_id, license_plate, brand, capacity) VALUES (1, '59B-123.45', 'Hyundai', 16);

-- 3. Trạm Dừng (Stops) - Dữ liệu thật khu vực Quận 1, TP.HCM
INSERT INTO stops (stop_id, name, address, latitude, longitude) VALUES 
(1, 'Trường THPT Lê Hồng Phong', '235 Nguyễn Văn Cừ', 10.762622, 106.682172), -- Điểm cuối
(2, 'Co.op Mart Cống Quỳnh', '189 Cống Quỳnh', 10.768822, 106.687172),
(3, 'Công viên 23/9', 'Đường Phạm Ngũ Lão', 10.769922, 106.693172),
(4, 'Chợ Bến Thành', 'Lê Lợi, Bến Thành', 10.772522, 106.698172);

-- 4. Tuyến Đường (Routes)
INSERT INTO routes (route_id, route_name, start_point, end_point) VALUES 
(1, 'Tuyến 01: Trung tâm - Trường LHP', 'Chợ Bến Thành', 'Trường Lê Hồng Phong');

-- 5. Gán Trạm vào Tuyến (Route Stops)
-- Thứ tự: Chợ Bến Thành (1) -> CV 23/9 (2) -> Co.op Mart (3) -> Trường (4)
INSERT INTO route_stops (route_id, stop_id, order_index, minutes_from_start) VALUES
(1, 4, 1, 0),  -- Phút thứ 0
(1, 3, 2, 10), -- Phút thứ 10
(1, 2, 3, 20), -- Phút thứ 20
(1, 1, 4, 30); -- Phút thứ 30 (Đến trường)

-- 6. Học Sinh (Gán vào Trạm cụ thể)
INSERT INTO students (student_id, parent_id, stop_id, full_name, class_name) VALUES 
(1, 3, 2, 'Nguyễn Bé Bi', 'Lớp Lá'); -- Bé Bi đón ở Trạm số 2 (Co.op Mart)

-- 7. Lịch trình
INSERT INTO schedules (schedule_id, route_id, bus_id, driver_id, date, start_time, status) VALUES 
(1, 1, 1, 2, CURDATE(), '06:30:00', 'running');

-- 8. Điểm danh
INSERT INTO trip_attendance (schedule_id, student_id, status) VALUES (1, 1, 'not_picked');