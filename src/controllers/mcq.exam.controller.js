import MCQExam from "../models/mcq.exam.model.js";

export const createMCQExam = async (req, res) => {
  try {
    const { examDate, description } = req.body;

    if (!examDate) {
      return res.status(400).json({
        success: false,
        message: "examDate আবশ্যক",
      });
    }

    const exam = await MCQExam.create({
      description: description || "",
      examDate: new Date(examDate),
    });

    res.status(201).json({
      success: true,
      message: "MCQ পরীক্ষা সফলভাবে তৈরি হয়েছে",
      data: exam,
    });
  } catch (err) {
    console.error("CREATE MCQ EXAM ERROR:", err.message);
    res.status(500).json({
      success: false,
      message: "ডাটাবেসে সেভ করতে সমস্যা হয়েছে",
      error: err.message,
    });
  }
};

export const getAllMCQExams = async (req, res) => {
  try {
    const exams = await MCQExam.find().sort({ createdAt: -1 }).lean();

    res.json({ success: true, data: exams });
  } catch (err) {
    console.error("getAllMCQExams error:", err);
    res.status(500).json({ success: false, message: "সার্ভার ত্রুটি" });
  }
};

export const getMCQExam = async (req, res) => {
  try {
    const exam = await MCQExam.findById(req.params.id).lean();

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
