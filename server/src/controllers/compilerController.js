const axios = require('axios');
const Question = require('../models/Question');
const Submission = require('../models/Submission');

// Map languages to Judge0 CE language IDs
const languageIdMap = {
  cpp: 54,        // C++ (GCC 9.2.0)
  cpp17: 54,      // Map generic cpp to 54
  cpp20: 54,      // Map generic cpp to 54
  java: 62,       // Java (OpenJDK 13.0.1)
  python: 71,     // Python (3.8.1)
  javascript: 63, // Node.js (12.14.0)
};

// URL for the internal Judge0 instance
const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';

/**
 * Execute code directly without evaluating against test cases
 * POST /api/compiler/run
 */
exports.runCode = async (req, res, next) => {
  try {
    const { language, code, stdin = '' } = req.body;

    if (!language || !code) {
      return res.status(400).json({ error: 'Language and code are required' });
    }

    const languageId = languageIdMap[language.toLowerCase()];
    if (!languageId) {
      return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    const payload = {
      source_code: code,
      language_id: languageId,
      stdin,
      cpu_time_limit: 2,
      wall_time_limit: 5,
      memory_limit: 262144, // 256 MB in KB
    };

    // Send to Judge0 synchronously
    const response = await axios.post(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, payload);

    const { stdout, stderr, compile_output, status } = response.data;

    res.json({
      stdout,
      stderr,
      compile_output,
      status: status ? status.description : 'Unknown',
      time: response.data.time,
      memory: response.data.memory,
    });
  } catch (error) {
    console.error('Error running code:', error.message);
    if (error.response) {
      return res.status(error.response.status).json({ error: error.response.data });
    }
    res.status(500).json({ error: 'Failed to run code' });
  }
};

/**
 * Submit code, run against test cases, calculate score
 * POST /api/compiler/submit
 */
exports.submitCode = async (req, res, next) => {
  try {
    const { questionId, assessmentId, language, code } = req.body;
    const studentId = req.user.id;

    if (!questionId || !language || !code) {
      return res.status(400).json({ error: 'Question ID, language, and code are required' });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const languageId = languageIdMap[language.toLowerCase()];
    if (!languageId) {
      return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    // Combine visible and hidden test cases
    const testCases = [...question.visibleTestCases, ...question.hiddenTestCases];

    if (!testCases || testCases.length === 0) {
      return res.status(400).json({ error: 'No test cases found for this question' });
    }

    let passedCount = 0;
    const testResults = [];
    let firstErrorStatus = null;
    let firstCompileOutput = '';

    // Run against each test case sequentially (wait=true)
    // For a production system with many test cases, batch submissions are recommended.
    for (const testCase of testCases) {
      const payload = {
        source_code: code,
        language_id: languageId,
        stdin: testCase.input,
        expected_output: testCase.output,
        cpu_time_limit: question.timeLimit || 2,
        memory_limit: (question.memoryLimit || 256) * 1024,
      };

      try {
        const response = await axios.post(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, payload);
        const result = response.data;

        const statusDesc = result.status ? result.status.description : 'Unknown';
        const isPassed = result.status && result.status.id === 3; // 3 = Accepted in Judge0

        if (isPassed) {
          passedCount++;
        }

        if (!isPassed && !firstErrorStatus) {
          firstErrorStatus = statusDesc;
          firstCompileOutput = result.compile_output || '';
        }

        testResults.push({
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: result.stdout || result.stderr || '',
          passed: isPassed,
          isHidden: testCase.isSample === false,
          verdict: statusDesc
        });
      } catch (err) {
        testResults.push({
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: '',
          passed: false,
          isHidden: testCase.isSample === false,
          verdict: 'Judge0 API Error'
        });
      }
    }

    const totalCount = testCases.length;
    const score = totalCount === 0 ? 0 : Math.round((passedCount / totalCount) * 100);
    const overallVerdict = passedCount === totalCount ? 'Accepted' : (firstErrorStatus || 'Wrong Answer');

    // Save submission to DB
    const newSubmission = new Submission({
      student: studentId,
      assessment: assessmentId || null,
      question: questionId,
      language,
      sourceCode: code,
      status: 'evaluated',
      verdict: overallVerdict,
      compileOutput: firstCompileOutput,
      passedCount,
      totalCount,
      score,
      testResults
    });

    await newSubmission.save();

    res.json({
      submissionId: newSubmission._id,
      passed: passedCount,
      total: totalCount,
      score,
      verdict: overallVerdict,
      testResults: testResults.map(tr => ({
        // Hide actual input/output if it's a hidden test case to prevent cheating
        input: tr.isHidden ? 'Hidden Test Case' : tr.input,
        expectedOutput: tr.isHidden ? 'Hidden Test Case' : tr.expectedOutput,
        actualOutput: tr.isHidden ? 'Hidden Test Case' : tr.actualOutput,
        passed: tr.passed,
        verdict: tr.verdict
      }))
    });

  } catch (error) {
    console.error('Error submitting code:', error.message);
    res.status(500).json({ error: 'Failed to submit code' });
  }
};
