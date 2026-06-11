const axios = require('axios');
const { ApiError } = require('../utils/ApiError');

// Self-hosted Judge0 URL — no API keys needed
const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';

const judge0Client = axios.create({
  baseURL: JUDGE0_URL
});

async function runJudge0Submission({ languageId, sourceCode, stdin = '', expectedOutput = '' }) {
  if (!JUDGE0_URL) {
    throw new ApiError(500, 'Judge0 is not configured');
  }

  const { data } = await judge0Client.post(
    '/submissions',
    {
      language_id: languageId,
      source_code: sourceCode,
      stdin,
      expected_output: expectedOutput || null
    },
    {
      params: {
        base64_encoded: false,
        wait: true,
        fields: '*'
      }
    }
  );

  return data;
}

module.exports = { runJudge0Submission };
