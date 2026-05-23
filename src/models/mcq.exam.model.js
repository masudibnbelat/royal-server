import mongoose from "mongoose";

const mcqExamSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    examDate: {
      type: Date,
      required: [true, "Exam date is required"],
    },
  },
  { timestamps: true },
);

mcqExamSchema.pre("save", async function () {
  if (!this.slug) {
    const count = await mongoose.models.MCQExam.countDocuments();
    this.slug = `mcq-exam-${count + 1}`;
  }
});

const MCQExam = mongoose.model("MCQExam", mcqExamSchema);

export default MCQExam;
