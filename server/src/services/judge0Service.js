const axios = require('axios');
const { ApiError } = require('../utils/ApiError');

// Self-hosted Judge0 URL — no API keys needed
const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';

const judge0Client = axios.create({
  baseURL: JUDGE0_URL
});

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

async function runLocalFallback({ languageId, sourceCode, stdin = '' }) {
  const tmpDir = path.join('/tmp', crypto.randomBytes(16).toString('hex'));
  fs.mkdirSync(tmpDir, { recursive: true });
  
  let cmd, args, filename;
  
  // 63 = JS, 71 = Python, 54 = C++, 62 = Java
  if (languageId === 63 || languageId == '63') {
    filename = 'script.js';
    cmd = 'node';
    args = [filename];
  } else if (languageId === 71 || languageId == '71') {
    filename = 'script.py';
    cmd = 'python3';
    args = [filename];
  } else if (languageId === 54 || languageId == '54') {
    filename = 'main.cpp';
    fs.writeFileSync(path.join(tmpDir, filename), sourceCode);
    try {
      require('child_process').execSync(`g++ main.cpp -o main`, { cwd: tmpDir });
    } catch (err) {
      return { status: { description: 'Compilation Error' }, compile_output: err.stderr?.toString() };
    }
    cmd = './main';
    args = [];
  } else {
    // Unsupported fallback (e.g. Java missing)
    return { status: { description: 'Internal Error' }, stderr: 'Local fallback not supported for this language. Judge0 failed.' };
  }
  
  fs.writeFileSync(path.join(tmpDir, filename), sourceCode);
  
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { cwd: tmpDir, timeout: 5000 });
    let stdout = '', stderr = '';
    
    if (stdin) {
      proc.stdin.write(stdin);
      proc.stdin.end();
    }
    
    proc.stdout.on('data', (data) => stdout += data);
    proc.stderr.on('data', (data) => stderr += data);
    
    proc.on('close', (code) => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      if (code === null) {
        resolve({ status: { description: 'Time Limit Exceeded' } });
      } else if (code !== 0) {
        resolve({ status: { description: 'Runtime Error' }, stderr });
      } else {
        resolve({ status: { description: 'Accepted' }, stdout });
      }
    });
    
    proc.on('error', (err) => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      resolve({ status: { description: 'Internal Error' }, stderr: err.message });
    });
  });
}

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

  // Fallback for WSL2 cgroup issue ("No such file or directory @ rb_sysopen - /box/script.js")
  if (data?.status?.id === 13) {
    console.warn('Judge0 Internal Error detected (likely WSL2 isolate failure). Using local execution fallback.');
    return runLocalFallback({ languageId, sourceCode, stdin });
  }

  return data;
}

module.exports = { runJudge0Submission };
