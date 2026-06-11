const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String, default: '' },
    isSample: { type: Boolean, default: false }
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
    description: { type: String, required: true },
    constraints: { type: String, default: '' },
    examples: [{ type: String }],
    tags: [{ type: String }],
    starterCode: {
      cpp: { type: String, default: '' },
      java: { type: String, default: '' },
      python: { type: String, default: '' },
      javascript: { type: String, default: '' }
    },
    timeLimit: { type: Number, default: 2 },
    memoryLimit: { type: Number, default: 256 },
    visibleTestCases: [testCaseSchema],
    hiddenTestCases: [testCaseSchema],
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Question', questionSchema);
