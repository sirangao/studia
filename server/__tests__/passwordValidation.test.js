// Unit tests for password and username validation rules
// These mirror the frontend validation in LoginScreen.js

function validatePassword(password) {
  return {
    long: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    noSpaces: !password.includes(' '),
  };
}

function validateUsername(username) {
  return {
    longEnough: username.length >= 3,
    noSpaces: !username.includes(' '),
  };
}

describe('password validation', () => {
  test('rejects password under 8 characters', () => {
    expect(validatePassword('Ab1!').long).toBe(false);
  });

  test('accepts password with 8+ characters', () => {
    expect(validatePassword('Abcdef1!').long).toBe(true);
  });

  test('rejects password with no number', () => {
    expect(validatePassword('Abcdefg!').hasNumber).toBe(false);
  });

  test('accepts password with a number', () => {
    expect(validatePassword('Abcdef1!').hasNumber).toBe(true);
  });

  test('rejects password with no special character', () => {
    expect(validatePassword('Abcdef12').hasSpecial).toBe(false);
  });

  test('accepts password with a special character', () => {
    expect(validatePassword('Abcdef1!').hasSpecial).toBe(true);
  });

  test('rejects password with spaces', () => {
    expect(validatePassword('Abc def1!').noSpaces).toBe(false);
  });

  test('accepts password with no spaces', () => {
    expect(validatePassword('Abcdef1!').noSpaces).toBe(true);
  });

  test('valid password passes all checks', () => {
    const result = validatePassword('Secure1!');
    expect(result.long).toBe(true);
    expect(result.hasNumber).toBe(true);
    expect(result.hasSpecial).toBe(true);
    expect(result.noSpaces).toBe(true);
  });
});

describe('username validation', () => {
  test('rejects username under 3 characters', () => {
    expect(validateUsername('ab').longEnough).toBe(false);
  });

  test('accepts username with 3+ characters', () => {
    expect(validateUsername('abc').longEnough).toBe(true);
  });

  test('rejects username with spaces', () => {
    expect(validateUsername('my username').noSpaces).toBe(false);
  });

  test('accepts username with no spaces', () => {
    expect(validateUsername('myusername').noSpaces).toBe(true);
  });
});
