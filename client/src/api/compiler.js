import apiClient from './client'; // Assumes an axios instance configured with base URL

/**
 * Execute code directly without evaluating against test cases
 * @param {string} language - e.g., 'cpp', 'java', 'python', 'javascript'
 * @param {string} code - The source code to execute
 * @param {string} stdin - Optional standard input
 * @returns {Promise<Object>} Output and status
 */
export const runCode = async (language, code, stdin = '') => {
  try {
    const response = await apiClient.post('/compiler/run', {
      language,
      code,
      stdin
    });
    return response.data;
  } catch (error) {
    console.error('Error running code:', error);
    throw error.response?.data || error.message;
  }
};

/**
 * Submit code, run against test cases, calculate score
 * @param {string} questionId - ID of the question being solved
 * @param {string} assessmentId - ID of the assessment (optional)
 * @param {string} language - e.g., 'cpp', 'java', 'python', 'javascript'
 * @param {string} code - The source code to submit
 * @returns {Promise<Object>} Test results and score
 */
export const submitCode = async (questionId, assessmentId, language, code) => {
  try {
    const response = await apiClient.post('/compiler/submit', {
      questionId,
      assessmentId,
      language,
      code
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting code:', error);
    throw error.response?.data || error.message;
  }
};
