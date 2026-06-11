const mongoose = require('mongoose');

const assessmentQuestionSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    order: { type: Number, default: 0 },
    points: { type: Number, default: 100 }
  },
  { _id: false }
);

const assessmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    durationMinutes: { type: Number, default: 90 },
    questions: [assessmentQuestionSchema],
    assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    assignedBatches: [{ type: String }],
    startAt: { type: Date },
    endAt: { type: Date },
    status: { type: String, enum: ['draft', 'scheduled', 'live', 'completed'], default: 'draft' },
    allowMentor: { type: Boolean, default: true },
    showResultsAfterSubmission: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Assessment', assessmentSchema);
