const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema(
  {
    input: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    actualOutput: { type: String, default: '' },
    passed: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    verdict: { type: String, default: '' }
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    language: { type: String, required: true },
    sourceCode: { type: String, required: true },
    judge0SubmissionId: { type: String, default: '' },
    status: { type: String, default: 'queued' },
    verdict: { type: String, default: 'Pending' },
    stdout: { type: String, default: '' },
    stderr: { type: String, default: '' },
    compileOutput: { type: String, default: '' },
    time: { type: String, default: '' },
    memory: { type: String, default: '' },
    passedCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    testResults: [testResultSchema],
    aiHintsUsed: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Submission', submissionSchema);
