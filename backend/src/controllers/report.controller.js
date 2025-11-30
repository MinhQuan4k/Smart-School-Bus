const { pool } = require("../config/db");
const ExcelJS = require('exceljs');

exports.exportAttendance = async (req, res, next) => {
    try {
        // 1. Tạo Workbook (File Excel ảo)
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Báo Cáo Điểm Danh');

        // 2. Định nghĩa các cột
        sheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Học Sinh', key: 'student_name', width: 25 },
            { header: 'Lớp', key: 'class_name', width: 10 },
            { header: 'Tuyến Xe', key: 'route_name', width: 30 },
            { header: 'Trạng Thái', key: 'status', width: 15 },
            { header: 'Giờ Lên Xe', key: 'pickup_time', width: 20 },
            { header: 'Giờ Xuống Xe', key: 'dropoff_time', width: 20 },
        ];

        // 3. Lấy dữ liệu từ Database (Hôm nay)
        const sql = `
            SELECT 
                st.student_id, st.full_name, st.class_name,
                r.route_name,
                ta.status, ta.pickup_time, ta.dropoff_time
            FROM trip_attendance ta
            JOIN students st ON ta.student_id = st.student_id
            JOIN schedules s ON ta.schedule_id = s.schedule_id
            JOIN routes r ON s.route_id = r.route_id
            WHERE s.date = CURDATE()
        `;
        const [rows] = await pool.query(sql);

        // 4. Đổ dữ liệu vào sheet
        rows.forEach(row => {
            sheet.addRow({
                id: row.student_id,
                student_name: row.full_name,
                class_name: row.class_name,
                route_name: row.route_name,
                status: row.status === 'picked_up' ? 'Đã đón' : (row.status === 'dropped_off' ? 'Đã trả' : 'Chưa đón'),
                pickup_time: row.pickup_time ? new Date(row.pickup_time).toLocaleTimeString() : '',
                dropoff_time: row.dropoff_time ? new Date(row.dropoff_time).toLocaleTimeString() : ''
            });
        });

        // 5. Trả file về cho trình duyệt tải xuống
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=BaoCao_DiemDanh.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        next(err);
    }
};