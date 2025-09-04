# 🧠 Copilot Instructions for autodevelop-v2

Welcome, Copilot. This repository powers the backend logic and modular architecture for [autodevelop.ai](https://autodevelop.ai)—a subscription-based automation platform built for creators, developers, and small businesses. Your job is to help us build scalable, secure, and user-friendly systems that reflect our core values: autonomy, privacy, and empowerment.

---

## 📦 Repo Purpose

This repo contains the core logic for the Autodev Bot, including:
- Modular automation workflows and plugin architecture
- Secure user authentication and subscription handling
- Scalable task orchestration and error recovery
- Admin tools for managing users, tiers, and usage limits

---

## ✅ What to Prioritize

When generating code, focus on:

- **Modularity**: Use clean, reusable components. Favor composition over inheritance.
- **Security**: Never expose secrets, tokens, or user data. Use environment variables and encrypted storage.
- **Scalability**: Design for async execution, queueing, and horizontal scaling.
- **Clarity**: Write readable, well-documented code. Use descriptive names and inline comments.
- **Extensibility**: Make it easy to add new plugins, workflows, or UI modules.
- **Privacy**: Respect user boundaries. Avoid tracking or logging sensitive data unless explicitly required.

---

## 🚫 What to Avoid

Please do not generate:

- Hardcoded credentials or API keys
- Monolithic functions with unclear responsibilities
- Excessive dependencies or bloated packages
- Unvalidated user input or insecure endpoints
- Code that assumes a specific cloud provider or deployment method
- Logic that bypasses subscription checks or usage limits

---

## 🧩 Preferred Patterns

Use these patterns when applicable:

- `async/await` for non-blocking operations
- Dependency injection for testability
- Event-driven architecture for workflow triggers
- JSON schema validation for user inputs
- Feature flags for experimental modules
- Modular folder structure: `plugins/`, `workflows/`, `auth/`, `utils/`, `subscriptions/`

---

## 🔐 Subscription Logic

All subscription-related logic should:

- Use secure token-based authentication (JWT or OAuth2)
- Support tiered access (Free, Pro, Enterprise)
- Enforce usage limits via middleware or queue throttling
- Integrate with Stripe or Paddle for billing (via webhook listeners)
- Store subscription metadata securely (e.g., in PostgreSQL or DynamoDB)
- Be easy to audit and update without breaking existing users

Example modules:
- `subscriptions/planManager.ts`: Handles tier logic and upgrades
- `subscriptions/webhooks.ts`: Listens for billing events
- `auth/sessionManager.ts`: Manages login, logout, and token refresh
- `middleware/checkSubscription.ts`: Enforces access control

---

## 🧪 Testing & Validation

All generated code should include:

- Unit tests for core logic (use Jest or Vitest)
- Input validation using Zod or Joi
- Error handling with clear messages and fallback logic
- Logging via a centralized logger (e.g., `utils/logger.ts`)

---

## 🗣️ Tone & Naming Conventions

- Use clear, descriptive names: `createUserSession`, not `doThing`
- Avoid abbreviations unless industry-standard
- Keep comments concise but helpful
- Favor positive, empowering language in user-facing messages

---

## 🛠️ Example Modules

Here are examples of modules Copilot can help generate:

- `plugins/github.ts`: Automates repo setup and issue triage
- `workflows/onboarding.ts`: Guides new users through setup
- `utils/validateInput.ts`: Sanitizes and validates user data
- `auth/sessionManager.ts`: Handles login, logout, and token refresh
- `subscriptions/planManager.ts`: Manages subscription tiers and limits

---

## 🙌 Final Notes

Copilot, you’re part of the build team. Help us create a platform that’s fast, flexible, and future-proof. When in doubt, prioritize safety, clarity, and user control. Every line of code should reflect our mission: to empower users with automation they can trust.
