function normalizeOutput(value = '') {
  return String(value)
    .replace(/\r/g, '')
    .trim()
    .split(/\s+/)
    .join(' ');
}

function compareOutput(actual, expected) {
  return normalizeOutput(actual) === normalizeOutput(expected);
}

module.exports = { normalizeOutput, compareOutput };
