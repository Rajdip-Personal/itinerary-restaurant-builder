# Product Requirements Document

> **Project Name:** Calculator CLI
> **Author:** Robert Chang
> **Date:** 2026-02-28
> **Status:** Draft
> **Squad:** (your team name)

---

## 1. Product Overview

### Vision
A simple, fast CLI calculator that accepts a mathematical formula as input and returns the computed answer.

### Problem Statement
Developers and engineers frequently need to perform quick calculations without leaving the terminal. Switching to a GUI calculator or opening a browser breaks workflow. A CLI calculator that parses mathematical expressions directly from the command line solves this by keeping users in their terminal environment.

### Target Users
| Persona | Role | Key Need |
|---------|------|----------|
| Developer | Software engineer working in terminal | Quick math calculations without leaving the CLI |

---

## 2. Goals & Success Metrics

### Goals
1. Accept a mathematical formula as a command-line argument and return the correct answer
2. Support standard arithmetic operations (addition, subtraction, multiplication, division)
3. Provide clear error messages for invalid input

### Success Metrics
| Metric | Current State | Target | Measurement Method |
|--------|--------------|--------|-------------------|
| Correct calculation results | N/A | 100% accuracy for supported operations | Unit tests |
| Response time | N/A | < 100ms | Manual testing |
| User error clarity | N/A | All invalid inputs produce helpful error messages | Manual review |

---

## 3. Scope

### In Scope
- Parse and evaluate mathematical expressions from command-line arguments
- Support basic arithmetic: `+`, `-`, `*`, `/`, `^` (exponentiation)
- Support parentheses for grouping: `(`, `)`
- Support decimal numbers
- Support negative numbers
- Display the result to stdout
- Display clear error messages for invalid expressions

### Out of Scope
- Interactive REPL mode
- History of past calculations
- Variable assignment or symbolic math
- Graphing or visualization
- Configuration files or persistent settings
- Network or API functionality

### Future Considerations
- Support for additional math functions (sqrt, pow, sin, cos, etc.)
- Interactive mode with expression history

---

## 4. User Stories (High Level)

### Developer
- As a developer, I want to type a math expression on the command line, so that I get the answer instantly without leaving my terminal.
- As a developer, I want to use parentheses to group operations, so that I can control the order of evaluation.
- As a developer, I want clear error messages when I type an invalid expression, so that I can fix my input quickly.
- As a developer, I want to pipe expressions from other commands into the calculator, so that I can use it in shell pipelines.
- As a developer, I want to use the `^` operator for exponentiation, so that I can compute powers without leaving the terminal.

---

## 5. Functional Requirements

### Workflows

**Workflow 1: Basic Calculation**
1. User runs: `calculator-cli "2 + 3 * 4"`
2. Application parses the expression
3. Application evaluates respecting operator precedence
4. Application prints result: `14`

**Workflow 2: Error Handling**
1. User runs: `calculator-cli "2 + + 3"`
2. Application attempts to parse the expression
3. Application detects invalid syntax
4. Application prints error message: `Error: Invalid expression — unexpected '+' at position 4`

### Business Rules
- Standard mathematical operator precedence: parentheses > exponentiation > multiplication/division > addition/subtraction
- Division by zero should return a clear error message, not crash
- Empty input should display usage instructions

### Data Requirements
- No persistent data storage required
- Input: mathematical expression string from command-line argument OR stdin (if no argument provided)
- Output: computed numeric result to stdout, errors to stderr

---

## 6. Non-Functional Requirements

### Security
- No network access required
- No file system writes
- Input sanitization to prevent code injection (do NOT use `eval()` or equivalent)

### Performance
- Expression evaluation should complete in under 100ms for any supported expression
- Minimal startup time — should feel instant

### Observability
- Errors printed to stderr with plain, descriptive messages (no structured JSON logging — this is a simple CLI tool, not a service)
- Exit code 0 for success, non-zero for errors
- Note: Nordstrom structured logging standards do not apply to standalone CLI tools

---

## 7. Technical Constraints

### Existing Systems
- None — this is a standalone CLI tool

### Tech Stack
- **Language:** Python
- **Build Tool:** pip / pyproject.toml
- **Testing:** pytest

### Infrastructure
- **Local only** — installed and run on the developer's machine
- No server deployment, no containers, no CI/CD pipeline
- Installation via package manager or direct binary

---

## 8. Dependencies & Risks

### Dependencies
| Dependency | Owner | Status | Impact if Delayed |
|-----------|-------|--------|-------------------|
| Language/runtime selection | Team | Resolved | Python selected — no longer blocking |

### Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Expression parsing complexity | Low | Medium | Use well-known parsing techniques (recursive descent or Pratt parser) |
| Floating point precision issues | Medium | Low | Use standard floating point; document limitations |

---

## 9. Timeline & Milestones

| Milestone | Target Date | Description |
|-----------|------------|-------------|
| PRD Approved | Workshop Day 1 | Requirements finalized |
| Design Complete | Workshop Day 1 | Technical design and parser approach selected |
| Implementation Complete | Workshop Day 1 | Working CLI calculator with tests |

---

## 10. Open Questions

| # | Question | Owner | Status | Answer |
|---|----------|-------|--------|--------|
| 1 | What programming language should be used? | Team | Answered | Python — simple, fast to implement, built-in test framework (pytest) |
| 2 | Should the tool support reading expressions from stdin (piping)? | Team | Answered | Yes — read from stdin if no CLI argument provided |
| 3 | What level of floating point precision is acceptable? | Team | Answered | Standard Python float (64-bit double) |
| 4 | Should the tool support exponentiation (^ or **)? | Team | Answered | Yes — support `^` operator with higher precedence than `*` and `/` |
