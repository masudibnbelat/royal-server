// src/controllers/mcq.exam.controller.js

import MCQExam from "../models/mcq.exam.model.js";

export const createMCQExam = async (req, res) => {
  try {
    const { examDate, class: cls, subject, description } = req.body;

    const exam = await MCQExam.create({
      class: cls,
      subject,
      description,
      examDate: new Date(examDate),
      createdBy: req.user.id, // ✅ _id না, id
    });

    res.status(201).json({ success: true, data: exam });
  } catch (err) {
    console.error("createMCQExam error:", err);
    res.status(500).json({ success: false, message: "সার্ভার ত্রুটি" });
  }
};

export const getAllMCQExams = async (req, res) => {
  try {
    const exams = await MCQExam.find()
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: exams });
  } catch (err) {
    console.error("getAllMCQExams error:", err);
    res.status(500).json({ success: false, message: "সার্ভার ত্রুটি" });
  }
};

export const getMCQExam = async (req, res) => {
  try {
    const exam = await MCQExam.findById(req.params.id)
      .populate("createdBy", "name")
      .lean();

    if (!exam) {
      return res.status(404).json({ success: false, message: "পাওয়া যায়নি" });
    }

    res.json({ success: true, data: exam });
  } catch (err) {
    console.error("getMCQExam error:", err);
    res.status(500).json({ success: false, message: "সার্ভার ত্রুটি" });
  }
};

export const deleteMCQExam = async (req, res) => {
  try {
    await MCQExam.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "মুছে ফেলা হয়েছে" });
  } catch (err) {
    console.error("deleteMCQExam error:", err);
    res.status(500).json({ success: false, message: "সার্ভার ত্রুটি" });
  }
};
