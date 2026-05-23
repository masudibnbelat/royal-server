import mongoose from "mongoose";

const mcqExamSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      unique: true,
      index: true,
    },

    class: {
      type: String,
      required: [true, "Class is required"],
      trim: true,
    },

    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
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

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
  },
  { timestamps: true },
);

mcqExamSchema.pre("save", async function () {
  if (!this.slug) {
    const base = [this.class, this.subject]
      .filter(Boolean)
      .join("-")
      .toLowerCase()
      .replace(/\s+/g, "-");

    // count existing exams
    const count = await mongoose.models.MCQExam.countDocuments({
      class: this.class,
      subject: this.subject,
    });

    this.slug = `${base}-${count + 1}`;
  }
});

const MCQExam = mongoose.model("MCQExam", mcqExamSchema);

export default MCQExam;
