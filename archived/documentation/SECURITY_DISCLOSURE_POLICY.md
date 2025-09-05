# Security Disclosure Policy

**Effective Date:** January 2025

AutoDevelop.ai takes security seriously. We appreciate the security research community's efforts to help keep our platform safe and secure. This policy describes how to report security vulnerabilities and how we handle security reports.

## Scope

This policy applies to security vulnerabilities in:

- **AutoDevelop.ai Platform**: Our main web application and API endpoints
- **AI Chat Services**: Our AI-powered development assistance features  
- **Authentication Systems**: User login, session management, and access controls
- **Data Processing**: How we handle and protect user data
- **Infrastructure**: Our hosting, databases, and supporting services

## Reporting Security Vulnerabilities

### Contact Information

To report a security vulnerability:

- **Primary Contact**: security@autodevelop.ai
- **Alternative**: Use our [contact form](https://autodevelop.ai/contact) with "Security Vulnerability" as the subject
- **Emergency**: For critical vulnerabilities, include "URGENT SECURITY" in the subject line

### Report Requirements

Please include the following information in your report:

- **Summary**: Brief description of the vulnerability
- **Impact**: Potential consequences and severity assessment
- **Steps to Reproduce**: Detailed instructions to replicate the issue
- **Proof of Concept**: Screenshots, code snippets, or demonstration (if safe)
- **Suggested Fix**: Recommendations for remediation (optional)
- **Contact Information**: How we can reach you for follow-up questions

### Report Format Example

```
Subject: Security Vulnerability - [Brief Description]

Vulnerability Summary:
[Description of the issue]

Affected Systems:
[Which parts of the platform are affected]

Impact Assessment:
[What could an attacker accomplish with this vulnerability]

Steps to Reproduce:
1. [First step]
2. [Second step]
3. [etc.]

Evidence:
[Screenshots, logs, or other proof]

Suggested Remediation:
[Your recommendations, if any]

Contact Information:
[Your preferred method of contact]
```

## Responsible Disclosure Guidelines

### What We Ask of Researchers

- **Act in Good Faith**: Only test against systems you're authorized to access
- **Don't Cause Harm**: Avoid degrading our services or accessing/modifying user data
- **Respect Privacy**: Don't access, modify, or retain user information beyond what's necessary to demonstrate the vulnerability
- **Be Patient**: Allow reasonable time for us to investigate and fix issues before public disclosure
- **Keep it Confidential**: Don't publicly disclose vulnerabilities until we've had time to address them

### Safe Harbor

We will not pursue legal action against researchers who:
- Follow this responsible disclosure policy
- Act in good faith and avoid harm to our users and systems
- Report vulnerabilities directly to us before disclosing publicly
- Don't access or retain user data beyond what's necessary to demonstrate the vulnerability

## What We Promise

### Response Timeline

- **Initial Response**: We aim to respond within 2 business days
- **Status Updates**: We'll provide updates every 5-7 business days during investigation
- **Resolution Timeline**: We'll work to resolve issues based on severity:
  - **Critical**: Within 24-48 hours
  - **High**: Within 1 week
  - **Medium**: Within 2 weeks
  - **Low**: Within 30 days

### Communication

- We'll acknowledge receipt of your report promptly
- We'll keep you informed of our progress throughout the investigation
- We'll notify you when the vulnerability is resolved
- We'll discuss coordinated disclosure timelines if requested

### Recognition

With your permission, we may:
- Publicly acknowledge your contribution to our security
- Include you in our security acknowledgments page
- Provide reference letters for responsible disclosure efforts

## Vulnerability Severity Classification

### Critical (9.0-10.0 CVSS)
- Remote code execution
- SQL injection with data access
- Authentication bypass for admin accounts
- Privilege escalation to system administrator

### High (7.0-8.9 CVSS)  
- Cross-site scripting (XSS) that can compromise accounts
- SQL injection without direct data access
- Authentication bypass for regular user accounts
- Sensitive data exposure

### Medium (4.0-6.9 CVSS)
- Cross-site request forgery (CSRF)
- Information disclosure with limited impact
- Business logic flaws
- Configuration issues

### Low (0.1-3.9 CVSS)
- Minor information disclosure
- Issues requiring significant user interaction
- Theoretical attacks with minimal impact

## Out of Scope

The following are generally outside the scope of our security program:

### Excluded Vulnerabilities
- Social engineering attacks against our staff
- Physical attacks against our infrastructure
- Denial of service attacks
- Vulnerabilities in third-party applications or services
- Issues affecting outdated browsers or software
- Theoretical vulnerabilities without proof of concept

### Third-Party Services
- Vulnerabilities in OpenAI's APIs or services
- Issues with Vercel's hosting platform
- Problems with external libraries or dependencies (unless we can directly fix them)

### Non-Security Issues
- Feature requests or usability issues
- Performance issues that don't have security implications
- Business logic that works as intended
- Issues requiring access to victim's device or account

## Legal Considerations

### Safe Testing
- Only test against accounts you own and control
- Don't test against production systems with real user data
- Use test accounts and sandbox environments when possible
- Don't attempt to access other users' data or accounts

### Data Handling
- Don't retain any user data obtained during testing
- Immediately delete any accidentally accessed user information
- Report data exposure without downloading or copying the data

## Public Disclosure

### Coordinated Disclosure
We prefer coordinated disclosure and will work with you to:
- Determine appropriate disclosure timelines
- Coordinate public announcements
- Ensure users are protected before vulnerabilities are made public

### Disclosure Timeline
- We aim to fix vulnerabilities before public disclosure
- Standard disclosure timeline is 90 days from initial report
- We may request extensions for complex issues
- We'll work with you on disclosure timing that protects users

## Security Acknowledgments

We maintain a list of security researchers who have helped improve our security. With your permission, we'll include your name and the general nature of the issue you reported (without specific technical details that could help attackers).

## Contact and Questions

For questions about this security disclosure policy:

- **Security Team**: security@autodevelop.ai
- **General Support**: support@autodevelop.ai
- **Legal Questions**: legal@autodevelop.ai

## Updates to This Policy

We may update this policy to reflect changes in our security practices or legal requirements. Updates will be posted on our website and communicated to known security researchers.

---

**Last Updated:** January 2025

Thank you for helping us maintain a secure platform for all users. We appreciate the security community's efforts to keep AutoDevelop.ai safe and secure.
