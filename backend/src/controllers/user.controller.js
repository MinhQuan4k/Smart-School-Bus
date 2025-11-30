const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");

// --- TÀI XẾ  ---
exports.getDrivers = async (req, res, next) => {
    try {
        const data = await userModel.getUsersByRole('driver');
        res.json({ success: true, data });
    } catch (err) { next(err); }
};

exports.createDriver = async (req, res, next) => {
    try {
        const { full_name, phone, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await userModel.createUser({ full_name, phone, password: hashedPassword, role: 'driver' });
        res.json({ success: true, message: "Tạo tài xế thành công" });
    } catch (err) { next(err); }
};

// --- PHỤ HUYNH ---
exports.getParents = async (req, res, next) => {
    try {
        const data = await userModel.getUsersByRole('parent');
        res.json({ success: true, data });
    } catch (err) { next(err); }
};

exports.createParent = async (req, res, next) => {
    try {
        const { full_name, phone, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Tạo user với role là 'parent'
        await userModel.createUser({ 
            full_name, phone, password: hashedPassword, role: 'parent' 
        });
        res.json({ success: true, message: "Tạo phụ huynh thành công" });
    } catch (err) { next(err); }
};


// --- CHUNG ---
exports.updateUser = async (req, res, next) => {
    try {
        const affected = await userModel.updateUser(req.params.id, req.body);
        if (affected === 0) return res.status(404).json({ error: "Không tìm thấy tài khoản" });
        res.json({ success: true, message: "Cập nhật thành công" });
    } catch (err) { next(err); }
};
exports.deleteUser = async (req, res, next) => {
    try {
        await userModel.deleteUser(req.params.id);
        res.json({ success: true, message: "Đã xóa tài khoản" });
    } catch (err) { next(err); }
};