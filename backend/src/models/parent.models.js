const { pool } = require("../config/db");

//Xem vị trí xe của con
exports.getBusLocationByStudent = async (studentId) => {
  const [rows] = await pool.query(
    `SELECT ll.latitude, ll.longitude, ll.speed, ll.recorded_at
     FROM location_logs ll
     WHERE ll.schedule_id = (
        SELECT ta.schedule_id 
        FROM trip_attendance ta
        WHERE ta.student_id = ?
        ORDER BY ta.attendance_id DESC
        LIMIT 1
     )
     ORDER BY ll.recorded_at DESC
     LIMIT 1`,
    [studentId]
  );

  return rows[0];
};

//Xem trạng thái đón / trả của con
exports.getStudentTripStatus = async (studentId) => {
  const [rows] = await pool.query(
    `SELECT status, pickup_time, dropoff_time
     FROM trip_attendance
     WHERE student_id = ?
     ORDER BY attendance_id DESC
     LIMIT 1`,
    [studentId]
  );

  return rows[0];
};

//Lấy thông báo của phụ huynh
exports.getNotificationsByParent = async (parentId) => {
  const [rows] = await pool.query(
    `SELECT * FROM notifications 
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [parentId]
  );

  return rows;
};
module.exports = {
    getBusLocationByStudent,
    getStudentTripStatus,
    getNotificationsByParent
};
