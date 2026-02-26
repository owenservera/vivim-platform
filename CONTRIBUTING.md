# Contributing to VIVIM

Thank you for your interest in contributing to VIVIM! This document provides guidelines and instructions for contributing.

## 🌟 Mission

Remember our mission:
- **Own Your AI** – Users maintain control over their AI systems
- **Share Your AI** – Enables sharing of AI configurations/knowledge
- **Evolve Your AI** – Supports continuous improvement and adaptation

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone it
git clone https://github.com/YOUR_USERNAME/vivim-app.git
cd vivim-app
```

### 2. Set Up Development Environment

```bash
# Install dependencies
bun run setup:deps

# Set up environment variables
cp .env.example .env
```

### 3. Run the Project

```bash
# Run all services
bun run dev
```

## 📁 Project Structure

```
vivim-app/
├── github-frontend/    # GitHub-style frontend (Next.js 15)
├── pwa/                # React PWA frontend
├── server/             # Express.js API server
├── network/            # P2P network engine
├── admin-panel/        # Admin dashboard
└── vivim.docs.context/ # Documentation site
```

## 🎯 Where to Contribute

### GitHub Frontend

The `github-frontend` is built with:
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Radix UI

**Good first issues:**
- UI improvements
- Accessibility enhancements
- Theme customization
- Performance optimizations

### Core Application

**Areas to contribute:**
- PWA frontend (React)
- API server (Express.js)
- P2P networking engine
- Admin panel
- Documentation

## 📝 Contribution Guidelines

### Code Style

- Use TypeScript for all new code
- Follow existing code conventions
- Write meaningful comments for complex logic
- Use descriptive variable and function names

### Commits

Write clear, concise commit messages:

```bash
# Good
feat: add dark mode support for PWA
fix: resolve memory leak in network module
docs: update API documentation

# Avoid
fixed stuff
update code
changes
```

### Pull Requests

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit them

3. **Test your changes**:
   ```bash
   # Run the project
   bun run dev
   
   # Run tests (if applicable)
   bun run test
   ```

4. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Fill out the PR template** with:
   - Description of changes
   - Related issues
   - Testing done
   - Screenshots (for UI changes)

### Documentation

- Update documentation for new features
- Add comments for complex code
- Update README if necessary
- Include usage examples

## 🐛 Reporting Issues

### Bug Reports

When reporting a bug, include:
- **Description**: Clear description of the issue
- **Steps to Reproduce**: Detailed steps to reproduce
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: OS, Node/Bun version, browser
- **Screenshots**: If applicable

### Feature Requests

When requesting a feature, include:
- **Problem**: What problem does this solve?
- **Solution**: Proposed solution
- **Alternatives**: Alternative solutions considered
- **Use Cases**: Example use cases

## 🏷️ Issue Labels

- `bug` - Something isn't working
- `documentation` - Documentation improvements
- `enhancement` - New features or improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority` - High priority issues
- `question` - Further information needed

## 💻 Development Tips

### GitHub Frontend

```bash
cd github-frontend

# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Run linting
bun run lint
```

### Testing Changes

1. Make your changes
2. Run the development server
3. Test in both light and dark modes
4. Test on different screen sizes
5. Check console for errors

## 🌈 Community

- Be respectful and inclusive
- Provide constructive feedback
- Accept constructive criticism
- Focus on what's best for the community

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

### Our Standards

Examples of behavior that contributes to creating a positive environment:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

## 🎖️ Recognition

Contributors will be recognized in:
- The CONTRIBUTORS file
- Release notes (for significant contributions)
- The contributors page on the website

## ❓ Questions?

Feel free to open an issue with the `question` label, or reach out to the maintainers.

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to VIVIM! 🚀
