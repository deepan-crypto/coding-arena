const Submission = require('../models/Submission');
const Question = require('../models/Question');
const Assessment = require('../models/Assessment');
const { asyncHandler } = require('../utils/asyncHandler');
const { ApiError } = require('../utils/ApiError');
const { getLanguageConfig } = require('../utils/languageMap');
const { compareOutput } = require('../utils/normalize');
const { runJudge0Submission } = require('../services/judge0Service');

async function evaluateQuestionCode(question, language, sourceCode, stdin = '') {
  const { judge0Id } = getLanguageConfig(language);
  const judge0Result = await runJudge0Submission({
    languageId: judge0Id,
    sourceCode,
    stdin
  });

  return judge0Result;
}

function buildTestResult(testCase, judge0Result, isHidden) {
  const stdout = judge0Result.stdout || '';
  const stderr = judge0Result.stderr || '';
  const compileOutput = judge0Result.compile_output || '';
  const statusDescription = judge0Result.status?.description || 'Unknown';
  const passed = !stderr && !compileOutput && compareOutput(stdout, testCase.output) && statusDescription.toLowerCase().includes('accepted');

  return {
    input: isHidden ? '' : testCase.input,
    expectedOutput: isHidden ? '' : testCase.output,
    actualOutput: isHidden ? '' : stdout,
    passed,
    isHidden,
    verdict: passed ? 'Accepted' : statusDescription
  };
}

const runCode = asyncHandler(async (req, res) => {
  const { questionId, language, sourceCode, stdin = '' } = req.body;
  const question = await Question.findById(questionId);

  if (!question) {
    throw new ApiError(404, 'Question not found');
  }

  const result = await evaluateQuestionCode(question, language, sourceCode, stdin);
  res.json({
    status: result.status?.description || 'Unknown',
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    compileOutput: result.compile_output || '',
    time: result.time || '',
    memory: result.memory || ''
  });
});

const submitCode = asyncHandler(async (req, res) => {
  const { assessmentId, questionId, language, sourceCode } = req.body;
  const question = await Question.findById(questionId);
  const assessment = await Assessment.findById(assessmentId);

  if (!question || !assessment) {
    throw new ApiError(404, 'Assessment or question not found');
  }

  const visibleResults = [];
  const hiddenResults = [];

  for (const testCase of question.visibleTestCases || []) {
    const judge0Result = await evaluateQuestionCode(question, language, sourceCode, testCase.input);
    visibleResults.push(buildTestResult(testCase, judge0Result, false));
  }

  for (const testCase of question.hiddenTestCases || []) {
    const judge0Result = await evaluateQuestionCode(question, language, sourceCode, testCase.input);
    hiddenResults.push(buildTestResult(testCase, judge0Result, true));
  }

  const allResults = [...visibleResults, ...hiddenResults];
  const passedCount = allResults.filter((item) => item.passed).length;
  const totalCount = allResults.length;
  const score = totalCount ? Math.round((passedCount / totalCount) * 100) : 0;
  const verdict = passedCount === totalCount ? 'Accepted' : 'Wrong Answer';

  const submission = await Submission.create({
    student: req.user._id,
    assessment: assessment._id,
    question: question._id,
    language,
    sourceCode,
    verdict,
    status: 'completed',
    passedCount,
    totalCount,
    score,
    testResults: allResults,
    stdout: visibleResults[0]?.actualOutput || '',
    compileOutput: ''
  });

  res.status(201).json({
    submission,
    passedCount,
    totalCount,
    score,
    verdict,
    visibleResults,
    hiddenSummary: hiddenResults.map((result, index) => ({
      testNumber: index + 1,
      passed: result.passed,
      verdict: result.verdict
    }))
  });
});

const listMySubmissions = asyncHandler(async (req, res) => {
  const submissions = await Submission.find({ student: req.user._id })
    .populate('question assessment')
    .sort({ createdAt: -1 });
  res.json({ submissions });
});

const getSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id).populate('question assessment student');
  if (!submission) {
    throw new ApiError(404, 'Submission not found');
  }
  if (req.user.role !== 'admin' && String(submission.student._id) !== String(req.user._id)) {
    throw new ApiError(403, 'Forbidden');
  }
  res.json({ submission });
});

const submissionsByAssessment = asyncHandler(async (req, res) => {
  const submissions = await Submission.find({ assessment: req.params.assessmentId }).populate('student question');
  res.json({ submissions });
});

module.exports = {
  runCode,
  submitCode,
  listMySubmissions,
  getSubmission,
  submissionsByAssessment
};
