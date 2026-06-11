const mongoose = require('mongoose');

const aiInteractionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment' },
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    mode: { type: String, default: 'hint' },
    prompt: { type: String, default: '' },
    responsePreview: { type: String, default: '' },
    tokensEstimate: { type: Number, default: 0 }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AiInteraction', aiInteractionSchema);
