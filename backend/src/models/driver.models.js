const { pool } = require("../config/db");
const { route } = require("../routes/auth.routes");

//Lấy lịch làm việc hôm nay của tài xế
exports.getTodaySchedules = async (driverId) => {
  const [rows] = await pool.query(
    `SELECT s.*, r.route_name, b.license_plate
     FROM schedules s
     JOIN routes r ON s.route_id = r.route_id
     JOIN buses b ON s.bus_id = b.bus_id
     WHERE s.driver_id = ? AND s.date = CURDATE()`,
    [driverId]
  );
  return rows;
};

//Lấy danh sách học sinh của 1 chuyến
exports.getStudentsBySchedule = async (scheduleId) => {
  const [rows] = await pool.query(
    `SELECT s.student_id, s.full_name, s.class_name, 
            s.pickup_address, ta.attendance_id, ta.status
     FROM trip_attendance ta
     JOIN students s ON ta.student_id = s.student_id
     WHERE ta.schedule_id = ?`,
    [scheduleId]
  );
  return rows;
};

//Cập nhật trạng thái đón / trả học sinh
exports.updateAttendance = async (attendanceId, status) => {
  let timeField = null;

  if (status === "picked_up") timeField = "pickup_time";
  if (status === "dropped_off") timeField = "dropoff_time";

  if (!timeField) {
    throw new Error("Invalid status");
  }

  await pool.query(
    `UPDATE trip_attendance 
     SET status = ?, ${timeField} = NOW()
     WHERE attendance_id = ?`,
    [status, attendanceId]
  );
};

//Gửi cảnh báo sự cố
exports.sendEmergency = async (userId, message) => {
  await pool.query(
    `INSERT INTO notifications (user_id, title, message) 
     VALUES (?, 'Cảnh báo sự cố', ?)`,
    [userId, message]
  );
};
module.exports = {
  getTodaySchedules,
  getStudentsBySchedule,
  updateAttendance,
  sendEmergency
};