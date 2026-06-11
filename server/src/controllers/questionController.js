const Question = require('../models/Question');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { getSupportedLanguages } = require('../utils/languageMap');

function buildSlug(title) {
  return String(title)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const listQuestions = asyncHandler(async (req, res) => {
  const questions = await Question.find().sort({ createdAt: -1 });
  res.json({ questions });
});

const getQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    throw new ApiError(404, 'Question not found');
  }
  res.json({ question, supportedLanguages: getSupportedLanguages() });
});

const createQuestion = asyncHandler(async (req, res) => {
  const payload = req.body;
  if (!payload.title || !payload.description) {
    throw new ApiError(400, 'Title and description are required');
  }

  const slug = payload.slug || buildSlug(payload.title);
  const question = await Question.create({
    ...payload,
    slug,
    author: req.user?._id,
    starterCode: payload.starterCode || {}
  });

  res.status(201).json({ question });
});

const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!question) {
    throw new ApiError(404, 'Question not found');
  }
  res.json({ question });
});

const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findByIdAndDelete(req.params.id);
  if (!question) {
    throw new ApiError(404, 'Question not found');
  }
  res.json({ message: 'Question deleted' });
});

module.exports = { listQuestions, getQuestion, createQuestion, updateQuestion, deleteQuestion };
