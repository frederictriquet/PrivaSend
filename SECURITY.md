# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.4.x   | :white_check_mark: |
| < 0.4   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in PrivaSend, please report it by:

1. **Do NOT** open a public GitHub issue
2. Email: [your-email] or use GitHub Security Advisories
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work on a fix.

## Security Features

### Implemented (v0.4.0)

- ✅ **HTTPS Enforcement** - Automatic redirect in production
- ✅ **Security Headers** - CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- ✅ **Input Sanitization** - XSS protection with recursive sanitization
- ✅ **Filename Validation** - Path traversal protection
- ✅ **File Type Validation** - Dangerous extension blocking
- ✅ **Rate Limiting** - DoS protection (upload/download/API)
- ✅ **MIME Type Validation** - Configurable whitelist
- ✅ **SQL Injection Protection** - Prepared statements (SQLite)

### Planned (Phase 3)

- ⏳ **Password Protection** - Optional link passwords
- ⏳ **File Encryption** - AES-256 at rest
- ⏳ **End-to-End Encryption** - Client-side encryption
- ⏳ **IP Whitelisting** - Access control
- ⏳ **Audit Logging** - Complete access logs

## Security Best Practices

### For Administrators

1. **Use HTTPS** - Always deploy with valid SSL/TLS certificates
2. **Configure Firewall** - Restrict access to trusted networks
3. **Regular Updates** - Keep dependencies up to date
4. **Monitor Logs** - Watch for suspicious activity
5. **Limit File Types** - Set ALLOWED_MIME_TYPES if needed
6. **Backup Database** - Regular SQLite database backups

### For Developers

1. **Follow Conventional Commits** - Security fixes use `security:` type
2. **Run Security Scans** - Use `npm audit` before committing
3. **Test Security Features** - Add tests for sanitization/validation
4. **Review Dependencies** - Check for known vulnerabilities
5. **Code Review** - All security-related changes require review

## Known Limitations (v0.4.0)

- ⚠️ **No Encryption** - Files stored unencrypted (Phase 3.2)
- ⚠️ **No Authentication** - No user system yet (Phase 3.1)
- ⚠️ **Rate Limit In-Memory** - Resets on restart (use Redis for production scale)
- ⚠️ **Dev Dependencies** - Some dev-only vulnerabilities (esbuild, vite)

## Security Scans

This project uses:

- **CodeQL** - Static analysis (JavaScript/TypeScript)
- **Trivy** - Container and filesystem vulnerability scanning
- **Hadolint** - Dockerfile security linting
- **npm audit** - Dependency vulnerability checking

All scans run automatically on every push and weekly.

## Disclosure Policy

- We follow responsible disclosure practices
- Security fixes are released as soon as possible
- CVEs are published for major vulnerabilities
- Users are notified via GitHub Security Advisories

## Security Contact

For security concerns: Create a GitHub Security Advisory or contact maintainers directly.

---

**Last Updated**: 2025-11-30
**Version**: 0.4.0
