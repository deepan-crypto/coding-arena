const User = require('../models/User');
const Question = require('../models/Question');
const Assessment = require('../models/Assessment');
const { connectDB } = require('../config/db');
const { adminEmail, adminPassword } = require('../config/env');

async function seedAdmin() {
  await connectDB();

  const existing = await User.findOne({ email: adminEmail.toLowerCase() });
  if (existing) {
    existing.passwordHash = await User.hashPassword(adminPassword);
    await existing.save();
    console.log('Admin password reset to match .env credentials');
  } else {
    const admin = await User.create({
      fullName: 'Platform Admin',
      email: adminEmail.toLowerCase(),
      passwordHash: await User.hashPassword(adminPassword),
      role: 'admin',
      batch: 'Administration'
    });

    console.log(`Created admin account: ${admin.email}`);
  }

  const demoQuestion = await Question.findOne({ slug: 'two-sum' });
  let question = demoQuestion;

  if (!question) {
    question = await Question.create({
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: 'Easy',
      description: 'Given an array of integers and a target, return the indices of the two numbers such that they add up to the target.',
      constraints: 'Use each input exactly once and assume there is exactly one valid answer.',
      tags: ['arrays', 'hashmap'],
      status: 'published',
      starterCode: {
        cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        return {};\n    }\n};',
        java: 'import java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n}',
        python: 'class Solution:\n    def twoSum(self, nums, target):\n        pass',
        javascript: 'class Solution {\n  twoSum(nums, target) {\n    return [];\n  }\n}'
      },
      visibleTestCases: [
        { input: '[2,7,11,15], 9', output: '[0,1]', explanation: 'Basic pair', isSample: true }
      ],
      hiddenTestCases: [
        { input: '[3,2,4], 6', output: '[1,2]', explanation: 'Middle pair', isSample: false },
        { input: '[3,3], 6', output: '[0,1]', explanation: 'Duplicate values', isSample: false }
      ]
    });
  }

  const existingAssessment = await Assessment.findOne({ title: 'DSA Round 1' });
  if (!existingAssessment && question) {
    await Assessment.create({
      title: 'DSA Round 1',
      description: 'Starter assessment with a demo coding question.',
      durationMinutes: 90,
      status: 'live',
      assignedBatches: ['General'],
      allowMentor: true,
      questions: [{ question: question._id, order: 1, points: 100 }]
    });
  }

  process.exit(0);
}

seedAdmin().catch((error) => {
  console.error('Seed failed', error);
  process.exit(1);
});
