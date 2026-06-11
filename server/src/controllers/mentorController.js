const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { generateMentorResponse, chatWithMentor } = require('../services/openaiMentorService');
const AiInteraction = require('../models/AiInteraction');

const askMentor = asyncHandler(async (req, res) => {
  const { question, studentCode = '', language = 'javascript', compilerError = '', failedTestCases = [], mode = 'hint', assessmentId = null, questionId = null } = req.body;

  if (!question) {
    throw new ApiError(400, 'Question context is required');
  }

  const mentorResponse = await generateMentorResponse({
    question,
    studentCode,
    language,
    compilerError,
    failedTestCases,
    mode
  });

  await AiInteraction.create({
    user: req.user._id,
    assessment: assessmentId,
    question: questionId,
    mode,
    prompt: JSON.stringify({ question, studentCode, language, compilerError, failedTestCases }, null, 2),
    responsePreview: mentorResponse.summary,
    tokensEstimate: Math.ceil((JSON.stringify(question).length + studentCode.length) / 4)
  });

  res.json({ mentorResponse });
});

/**
 * Chat-style endpoint: receives conversation history and returns a plain-text reply.
 */
const chatMentor = asyncHandler(async (req, res) => {
  const { messages, problemDescription, studentCode = '', language = 'javascript', assessmentId = null, questionId = null } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new ApiError(400, 'Messages array is required');
  }

  // Validate message format
  for (const msg of messages) {
    if (!msg.role || !msg.content) {
      throw new ApiError(400, 'Each message must have role and content');
    }
    if (!['user', 'assistant'].includes(msg.role)) {
      throw new ApiError(400, 'Message role must be "user" or "assistant"');
    }
  }

  const reply = await chatWithMentor({
    messages,
    problemDescription,
    studentCode,
    language
  });

  // Log the interaction
  const lastUserMsg = messages.filter(m => m.role === 'user').pop();
  await AiInteraction.create({
    user: req.user._id,
    assessment: assessmentId,
    question: questionId,
    mode: 'chat',
    prompt: lastUserMsg?.content || '',
    responsePreview: reply.slice(0, 200),
    tokensEstimate: Math.ceil((messages.map(m => m.content).join('').length) / 4)
  });

  res.json({ reply });
});

module.exports = { askMentor, chatMentor };
