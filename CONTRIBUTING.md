# Contributing to BloodBuddy

Welcome, and thank you for your interest in contributing to **BloodBuddy**! BloodBuddy is a community-driven blood-donor coordination platform designed to make blood donation coordination fast, transparent, and privacy-respecting.

Whether you are fixing a typo, adding tests, improving accessibility, or building a new AI provider backend, your contributions are welcome.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Hacktoberfest & Open Source Events](#hacktoberfest--open-source-events)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Running with Docker](#running-with-docker)
- [Development Workflow](#development-workflow)
  - [Branch Naming Guidelines](#branch-naming-guidelines)
  - [Commit Message Guidelines](#commit-message-guidelines)
- [Testing & Quality Checks](#testing--quality-checks)
  - [Backend Tests](#backend-tests)
  - [Frontend Tests & Linting](#frontend-tests--linting)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Project Documentation References](#project-documentation-references)

---

## Code of Conduct

BloodBuddy is an inclusive, respectful, and safe community for everyone.
- Treat fellow contributors and community members with kindness and empathy.
- Provide constructive feedback during code reviews.
- Focus on what is best for the community and patients in need of emergency coordination.
- Zero tolerance for harassment, hate speech, or derogatory comments.

---

## Hacktoberfest & Open Source Events

BloodBuddy proudly participates in **Hacktoberfest** and campus hack days (including Hack Day Gwalior x ITM University).

- **Good First Issues**: Check our repository [Issues](https://github.com/PranjalManhgaye/bloodbuddy/issues) labeled `good first issue` or `hacktoberfest`.
- **Quality Over Quantity**: Submit thoughtful, well-tested pull requests. Automated spam PRs (e.g. whitespace changes, random comma modifications) will be closed and labeled as `spam` / `invalid`.
- **Discuss First**: For major architectural changes or new third-party dependencies, open an issue to discuss your plan before writing code.

---

## Getting Started

### Prerequisites

- **Python**: 3.12 or newer
- **Node.js**: 20.x or newer (with `npm`)
- **Git**: 2.30+
- *(Optional)* **Ollama**: For local open-weight multimodal inference (`qwen2.5vl:3b`)
- *(Optional)* **Docker & Docker Compose**: For containerized runs

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # On macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate

   # On Windows (Command Prompt or PowerShell):
   python -m venv venv
   .\venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   ```bash
   cp ../.env.example .env
   ```

5. Ensure the data directory exists:
   ```bash
   mkdir -p data
   ```

6. Start the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   API interactive documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The client application will be running at [http://localhost:5173](http://localhost:5173).

### Running with Docker

You can also run both the backend and frontend using Docker Compose:

```bash
docker compose up --build
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:8000](http://localhost:8000)
- Interactive Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Development Workflow

### Branch Naming Guidelines

Branch names should be descriptive, lowercased, and hyphen-separated. Prefix the branch with the category of change:

| Prefix | Usage | Example |
|--------|-------|---------|
| `feature/` | New user-facing feature or enhancement | `feature/whatsapp-notification-mock` |
| `fix/` | Bug fix | `fix/donor-distance-calculation` |
| `docs/` | Documentation additions or updates | `docs/architecture-mermaid-diagram` |
| `test/` | Adding or updating tests | `test/invitation-lifecycle` |
| `refactor/`| Code refactoring without changing behavior | `refactor/ai-provider-interface` |
| `chore/` | Tooling, dependencies, or repository maintenance | `chore/update-oxlint-rules` |

If your branch addresses a specific issue, include the issue number:
```bash
git checkout -b docs/issue-10-project-documentation
```

### Commit Message Guidelines

Write concise, descriptive commit messages in the imperative mood (e.g. "Add...", "Fix...", "Update..."):
- `Add CONTRIBUTING and SECURITY documentation`
- `Fix matching query for rare blood groups`
- `Update AI prompt template to mitigate injection attempts`

---

## Testing & Quality Checks

Before submitting a Pull Request, verify that all backend tests, frontend tests, and linters pass.

### Backend Tests

Run the test suite using `pytest`:
```bash
cd backend
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
PYTHONPATH=. pytest -v
```

### Frontend Tests & Linting

Run unit tests and linter in the frontend directory:
```bash
cd frontend

# Run unit tests
npm test

# Run linter
npm run lint

# Verify TypeScript build
npm run build
```

---

## Submitting a Pull Request

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/bloodbuddy.git
   cd bloodbuddy
   ```
3. **Create a branch** matching the naming convention:
   ```bash
   git checkout -b feature/my-new-feature
   ```
4. **Make your changes**, keeping them focused on a single concern.
5. **Run all tests and linters** to ensure nothing is broken.
6. **Commit and push** to your fork:
   ```bash
   git add .
   git commit -m "Add descriptive commit message"
   git push origin feature/my-new-feature
   ```
7. **Open a Pull Request** against the `main` branch of the upstream repository:
   - Provide a clear summary of changes in the PR description.
   - Reference the related issue (e.g., `Closes #10` or `Fixes #12`).
   - Include screenshots or terminal output if your change modifies the UI or API responses.
   - Check the PR checklist before requesting review.

---

## Project Documentation References

- [Architecture & Overview](README.md)
- [Security & Privacy Policy](SECURITY.md)
- [5-Minute Demo Script](docs/DEMO_SCRIPT.md)
- [Frontend Documentation](frontend/README.md)
- [MIT License](LICENSE)
