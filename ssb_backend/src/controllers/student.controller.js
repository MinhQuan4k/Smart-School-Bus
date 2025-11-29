const studentModel = require("../models/student.model");

// Xem danh sách
exports.list = async (req, res, next) => {
    try {
        const data = await studentModel.getAllStudents();
        res.json({ success: true, data });
    } catch (err) { next(err); }
};

// Tạo mới
exports.create = async (req, res, next) => {
    try {
        const { parent_id, full_name, class_name, pickup_address } = req.body;
        // Kiểm tra dữ liệu cơ bản
        if (!parent_id || !full_name) {
            return res.status(400).json({ error: "Thiếu Parent ID hoặc Tên học sinh" });
        }

        const newId = await studentModel.createStudent(req.body);
        res.status(201).json({ success: true, message: "Thêm học sinh thành công", id: newId });
    } catch (err) { next(err); }
};

// Cập nhật
exports.update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const affected = await studentModel.updateStudent(id, req.body);
        if (affected === 0) return res.status(404).json({ error: "Không tìm thấy học sinh" });
        
        res.json({ success: true, message: "Cập nhật thành công" });
    } catch (err) { next(err); }
};

// Xóa
exports.delete = async (req, res, next) => {
    try {
        const { id } = req.params;
        const affected = await studentModel.deleteStudent(id);
        if (affected === 0) return res.status(404).json({ error: "Không tìm thấy học sinh" });

        res.json({ success: true, message: "Đã xóa học sinh" });
    } catch (err) { next(err); }
};