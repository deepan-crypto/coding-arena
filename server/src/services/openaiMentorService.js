const OpenAIImport = require('openai');
const { openaiApiKey, openaiModel } = require('../config/env');

const OpenAI = OpenAIImport.default || OpenAIImport;
const openaiClient = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

function createFallbackMentorResponse(context) {
  const problemHint = context?.question?.title ? `For ${context.question.title}, think about the core data structure and the edge cases first.` : 'Start by identifying the input shape, constraints, and any repeated work you can eliminate.';

  return {
    mode: context.mode || 'hint',
    summary: 'AI mentor guidance generated without a live model key.',
    hints: [problemHint, 'Write down a small example and simulate it by hand.', 'Check loop boundaries, null cases, and duplicate handling.'],
    buggyExample: 'Intentional bug idea: use an off-by-one loop boundary or forget to update the lookup structure on every iteration.',
    bugLocation: 'Review boundary checks and state updates inside the main loop.',
    debuggingQuestions: ['What happens on the smallest valid input?', 'What happens when values repeat?', 'Which variable changes the answer for every iteration?'],
    nextStep: 'Try to isolate one failing test and compare your trace against the expected flow.'
  };
}

function sanitizeMentorPayload(payload) {
  return {
    mode: payload?.mode || 'hint',
    summary: String(payload?.summary || '').slice(0, 240),
    hints: Array.isArray(payload?.hints) ? payload.hints.slice(0, 4).map((hint) => String(hint).slice(0, 240)) : [],
    buggyExample: String(payload?.buggyExample || '').slice(0, 500),
    bugLocation: String(payload?.bugLocation || '').slice(0, 240),
    debuggingQuestions: Array.isArray(payload?.debuggingQuestions)
      ? payload.debuggingQuestions.slice(0, 4).map((question) => String(question).slice(0, 240))
      : [],
    nextStep: String(payload?.nextStep || '').slice(0, 240)
  };
}

async function generateMentorResponse(context) {
  if (!openaiClient) {
    return createFallbackMentorResponse(context);
  }

  const systemPrompt = [
    'You are an AI coding mentor for a programming assessment platform.',
    'Your job is to teach, not solve.',
    'Never provide a complete correct solution, a fully working code answer, or hidden test cases.',
    'Prefer hints, conceptual explanations, debugging questions, and intentionally buggy examples that help the student reason.',
    'If asked for code, provide at most a short intentionally buggy snippet or pseudocode, never a full solution.',
    'Respond only in JSON with these keys: mode, summary, hints, buggyExample, bugLocation, debuggingQuestions, nextStep.',
    'Keep each field concise and actionable.'
  ].join(' ');

  const userPrompt = JSON.stringify(
    {
      question: context.question,
      studentCode: context.studentCode,
      language: context.language,
      compilerError: context.compilerError || '',
      failedTestCases: context.failedTestCases || [],
      mode: context.mode || 'hint'
    },
    null,
    2
  );

  const completion = await openaiClient.chat.completions.create({
    model: openaiModel,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.4
  });

  const content = completion.choices?.[0]?.message?.content || '{}';
  try {
    return sanitizeMentorPayload(JSON.parse(content));
  } catch (error) {
    return createFallbackMentorResponse(context);
  }
}

/**
 * Chat-style mentor: accepts conversation history and returns a plain-text reply.
 * The mentor NEVER gives correct solutions — only hints, wrong-but-close code, and guiding questions.
 */
async function chatWithMentor({ messages, problemDescription, studentCode, language }) {
  const systemPrompt = [
    'You are a friendly AI coding mentor embedded in a coding assessment platform.',
    'The student is solving a coding problem and can ask you questions.',
    '',
    'STRICT RULES:',
    '1. NEVER provide a complete correct solution or fully working code.',
    '2. If the student asks for the answer, give them a WRONG answer that is close but has an intentional bug, and add a hint about where the bug is.',
    '3. You may provide pseudocode, partial code snippets, or intentionally buggy code.',
    '4. Guide with hints, leading questions, and conceptual explanations.',
    '5. Keep responses concise and conversational (2-4 short paragraphs max).',
    '6. Use markdown formatting for code blocks.',
    '7. If you give buggy code, always mention "⚠️ This code has an intentional bug — can you find it?"',
    '',
    'CONTEXT:',
    `Problem: ${problemDescription || 'Not provided'}`,
    `Language: ${language || 'javascript'}`,
    studentCode ? `Student's current code:\n\`\`\`${language}\n${studentCode}\n\`\`\`` : 'Student has not written code yet.'
  ].join('\n');

  if (!openaiClient) {
    // Fallback when no API key is configured
    const fallbackResponses = [
      "Great question! 🤔 Think about what data structure would let you look up values in O(1) time. That's the key insight here.",
      "Here's a hint: try working through a small example by hand first. What pattern do you notice?",
      "⚠️ Common mistake: make sure you're handling edge cases like empty input or duplicate values. What happens in those scenarios?",
      "Think about the time complexity of your current approach. Is there a way to avoid the inner loop?",
      "Try breaking the problem into smaller subproblems. What's the simplest version of this problem you could solve first?"
    ];
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }

  // Build the messages array: system + conversation history (capped at last 20 messages)
  const chatMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-20)
  ];

  const completion = await openaiClient.chat.completions.create({
    model: openaiModel,
    messages: chatMessages,
    temperature: 0.6,
    max_tokens: 500
  });

  return completion.choices?.[0]?.message?.content || "I'm having trouble responding right now. Try asking again!";
}

module.exports = { generateMentorResponse, chatWithMentor };
