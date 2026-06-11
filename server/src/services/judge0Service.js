const axios = require('axios');
const { judge0BaseUrl, judge0ApiKey, judge0ApiHost } = require('../config/env');
const { ApiError } = require('../utils/ApiError');

const judge0Client = axios.create({
  baseURL: judge0BaseUrl,
  headers: judge0ApiKey
    ? {
        'X-RapidAPI-Key': judge0ApiKey,
        'X-RapidAPI-Host': judge0ApiHost
      }
    : {}
});

async function runJudge0Submission({ languageId, sourceCode, stdin = '', expectedOutput = '' }) {
  if (!judge0BaseUrl) {
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
