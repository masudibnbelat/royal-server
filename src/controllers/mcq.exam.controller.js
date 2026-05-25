// src/controllers/mcq.exam.controller.js
// src/controllers/mcq.exam.controller.js

import MCQExam from "../models/mcq.exam.model.js";
import User from "../models/user.model.js";
import { HARDCODED_ADMIN } from "../constants/admin.js";

const resolvePoster = async (reqUser) => {
  if (!reqUser)
    return { name: "অজানা", avatar: null, userId: null, role: null };

  if (reqUser.isHardcoded || reqUser.id === HARDCODED_ADMIN._id) {
    return {
      name: HARDCODED_ADMIN.name,
      avatar: HARDCODED_ADMIN.avatar?.url ?? null,
      userId: null,
      role: HARDCODED_ADMIN.role,
    };
  }

  try {
    const user = await User.findById(reqUser.id)
      .select("name avatar role")
      .lean();
    if (!user)
      return {
        name: "অজানা",
        avatar: null,
        userId: reqUser.id,
        role: reqUser.role,
      };
    return {
      name: user.name,
      avatar: user.avatar?.url ?? null,
      userId: user._id,
      role: user.role,
    };
  } catch {
    return { name: "অজানা", avatar: null, userId: null, role: null };
  }
};

// ── POST /api/mcq-exams ───────────────────────────────────────────────────────
export const createMCQExam = async (req, res) => {
  try {
    const { examDate, studentClass, subject, description } = req.body;

    if (!examDate || !studentClass || !subject) {
      return res.status(400).json({
        success: false,
        message: "examDate, studentClass এবং subject আবশ্যক",
      });
    }

    if (req.user?.role === "student") {
      return res.status(403).json({
        success: false,
        message: "শিক্ষার্থীরা MCQ পরীক্ষা তৈরি করতে পারবে না",
      });
    }

    const postedBy = await resolvePoster(req.user);

    const exam = await MCQExam.create({
      examDate: new Date(examDate),
      studentClass: studentClass.trim(),
      subject: subject.trim(),
      description: description?.trim() || "",
      postedBy,
    });

    res.status(201).json({
      success: true,
      message: "MCQ পরীক্ষা সফলভাবে তৈরি হয়েছে",
      data: exam,
    });
  } catch (err) {
    console.error(
      "CREATE MCQ EXAM ERROR:",
      JSON.stringify(
        {
          message: err.message,
          code: err.code,
          errors: err.errors,
          keyValue: err.keyValue,
        },
        null,
        2,
      ),
    );

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "আবার চেষ্টা করুন",
        error: err.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "ডাটাবেসে সেভ করতে সমস্যা হয়েছে",
      error: err.message,
    });
  }
};

// ── GET /api/mcq-exams ────────────────────────────────────────────────────────
export const getAllMCQExams = async (req, res) => {
  try {
    const exams = await MCQExam.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: exams });
  } catch (err) {
    console.error("getAllMCQExams error:", err);
    res.status(500).json({ success: false, message: "সার্ভার ত্রুটি" });
  }
};

// ── GET /api/mcq-exams/:id ────────────────────────────────────────────────────
export const getMCQExam = async (req, res) => {
  try {
    const exam = await MCQExam.findById(req.params.id).lean();
    if (!exam)
      return res.status(404).json({ success: false, message: "পাওয়া যায়নি" });
    res.json({ success: true, data: exam });
  } catch (err) {
    console.error("getMCQExam error:", err);
    res.status(500).json({ success: false, message: "সার্ভার ত্রুটি" });
  }
};

// ── DELETE /api/mcq-exams/:id ─────────────────────────────────────────────────
export const deleteMCQExam = async (req, res) => {
  try {
    await MCQExam.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "মুছে ফেলা হয়েছে" });
  } catch (err) {
    console.error("deleteMCQExam error:", err);
    res.status(500).json({ success: false, message: "সার্ভার ত্রুটি" });
  }
};
