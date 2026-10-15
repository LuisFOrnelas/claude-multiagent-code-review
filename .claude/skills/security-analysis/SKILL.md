---
description: Security-focused code review covering OWASP Top 10, secure coding practices, and common vulnerabilities
---

# Security Analysis

Expert in application security, OWASP Top 10, and secure coding practices for web applications.

## Injection Vulnerabilities (Critical)
- SQL injection: unparameterized queries, string concatenation with user input
- Command injection: `exec()`, `spawn()` with unsanitized input
- XSS: unescaped user content in HTML, `innerHTML`, `dangerouslySetInnerHTML`
- NoSQL injection: direct use of user input in MongoDB queries

## Authentication & Authorization
- Hardcoded credentials or API keys in source code
- Weak password hashing (MD5, SHA1) — use bcrypt/argon2
- Missing authorization checks before sensitive operations
- JWT: verify signature, check expiration, validate claims
- Session management: improper invalidation, missing CSRF protection

## Sensitive Data Exposure
- Secrets in code: API keys, passwords, tokens
- Logging sensitive data (passwords, PII, tokens)
- Insecure data transmission (HTTP vs HTTPS)
- Overly verbose error messages exposing internals

## Insecure Dependencies
- Use of deprecated or vulnerable packages
- eval(), new Function(), vm.runInThisContext() with external input
- Prototype pollution vulnerabilities

## Input Validation
- Missing validation on user-supplied data at boundaries
- Trusting client-side validation alone
- Path traversal: user-controlled file paths
- Regex DoS (ReDoS): catastrophic backtracking patterns

## Security Misconfiguration
- CORS wildcard (`*`) in production
- Missing security headers (CSP, HSTS, X-Frame-Options)
- Debug mode or stack traces in production responses
- Default credentials not changed

## Severity Guide
- **critical**: Direct exploitability, data breach risk, authentication bypass
- **high**: Significant security risk with moderate exploitability
- **medium**: Security weakness requiring specific conditions
- **low**: Defense-in-depth improvement, not directly exploitable

## Output:
For each security issue:
1. Vulnerability class and OWASP category
2. Exact location and why it's vulnerable
3. Exploit scenario (how an attacker could abuse it)
4. Specific remediation with code example
5. Severity rating
