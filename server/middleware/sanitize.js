// Allowlist validation: usernames may only contain letters, digits, underscores, and hyphens.
// This is a defense-in-depth measure against SQL injection — even though Supabase uses
// parameterized queries, we reject inputs containing SQL metacharacters at the boundary.
const USERNAME_RE = /^[a-zA-Z0-9_-]+$/;

function validateUsername(username) {
  return typeof username === 'string' && USERNAME_RE.test(username);
}

module.exports = { validateUsername };
