const express = require("express");
const mongoose = require("mongoose");
const Student = require("../models/Student");

const router = express.Router();

// Chỉ nhận các trường được phép, tránh ghi đè trường lạ từ req.body
const pickFields = (body = {}) => {
  const data = {};
  for (const key of ["studentId", "name", "email"]) {
    if (typeof body[key] === "string") data[key] = body[key];
  }
  return data;
};

const FIELD_LABELS = { studentId: "MSSV", email: "Email" };

// Chuyển lỗi Mongoose/Mongo thành HTTP status + thông điệp tiếng Việt
const handleError = (err, res, fallbackStatus = 500) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    return res.status(409).json({
      message: `${FIELD_LABELS[field] || "Giá trị"} đã tồn tại`,
    });
  }
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((e) => e.message).join(", ");
    return res.status(400).json({ message });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }
  console.error(err);
  return res.status(fallbackStatus).json({ message: "Lỗi máy chủ" });
};

const validateId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "ID không hợp lệ" });
  }
  next();
};

// GET /api/students
router.get("/", async (req, res) => {
  try {
    const students = await Student.find({}).sort({ createdAt: -1, _id: -1 });
    res.json(students);
  } catch (err) {
    handleError(err, res);
  }
});

// POST /api/students
router.post("/", async (req, res) => {
  try {
    const student = await Student.create(pickFields(req.body));
    res.status(201).json(student);
  } catch (err) {
    handleError(err, res);
  }
});

// PUT /api/students/:id
router.put("/:id", validateId, async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      pickFields(req.body),
      { new: true, runValidators: true }
    );
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }
    res.json(student);
  } catch (err) {
    handleError(err, res);
  }
});

// DELETE /api/students/:id
router.delete("/:id", validateId, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: "Không tìm thấy sinh viên" });
    }
    res.json({ message: "Đã xóa sinh viên thành công" });
  } catch (err) {
    handleError(err, res);
  }
});

module.exports = router;