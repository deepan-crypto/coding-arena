const languageMap = {
  cpp: { label: 'C++', judge0Id: 54, extension: 'cpp' },
  cplusplus: { label: 'C++', judge0Id: 54, extension: 'cpp' },
  java: { label: 'Java', judge0Id: 62, extension: 'java' },
  python: { label: 'Python', judge0Id: 71, extension: 'py' },
  python3: { label: 'Python', judge0Id: 71, extension: 'py' },
  javascript: { label: 'JavaScript', judge0Id: 63, extension: 'js' },
  js: { label: 'JavaScript', judge0Id: 63, extension: 'js' }
};

function getLanguageConfig(language) {
  const key = String(language || '').toLowerCase();
  return languageMap[key] || languageMap.javascript;
}

function getSupportedLanguages() {
  return [
    { value: 'cpp', label: 'C++' },
    { value: 'java', label: 'Java' },
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' }
  ];
}

module.exports = { getLanguageConfig, getSupportedLanguages };
