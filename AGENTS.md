# AGENTS.md

## Quick Summary
Financial Health Manager is a python based application that performs financial health management for the user. Different data is provided to the app like bank account, credit card, investment account statements and the app parses them to compute expense rate, savings rate, etc. it also generates nice charts for the user to view their activity. In future, it can also help users identify areas of improvement in their finances like high expenses etc

## Setup
- Requires **Python 3.10** or newer
- Create a `uv` virtual environment (`uv venv .venv`) and activate it
- Install dependencies with `uv pip install -e .[dev]`

## Development
1. Format then lint the code using Ruff:
   ```bash
   ruff format .
   ruff .
   ```
2. Run tests with `pytest`
3. Add tests for new modules inside `tests/`

## Docker
- Build the container:
  ```bash
  docker build -t financial-health-manager .
  ```
- Run the app using a CSV file mounted at `/data`:
  ```bash
  docker run --rm -v $(pwd)/data:/data financial-health-manager \
    python app.py /data/transactions.csv
  ```

## Contribution Guidelines
- Follow PEP8 style
- Ensure unit tests pass before committing
- Keep the file concise and update as the project evolves

## Coding Guidelines

### 1. Pythonic Practices

- **Elegance and Readability:** Strive for elegant and Pythonic code that is easy to understand and maintain.
- **PEP 8 Compliance:** Adhere to PEP 8 guidelines for code style, with ruff as the primary formatter and linter.
- **Explicit over Implicit:** Favor explicit code that clearly communicates its intent over implicit, overly concise code.
- **Zen of Python:** Keep the Zen of Python in mind when making design decisions.

## 2. Modular Design

- **Single Responsibility Principle:** Each module/file should have a well-defined, single responsibility.
- **Reusable Components:** Develop reusable functions and classes, favoring composition over inheritance.
- **Package Structure:** Organize code into logical packages and modules.

## 3. Code Quality

- **Comprehensive Type Annotations:** All functions, methods, and class members must have type annotations, using the most specific types possible.
- **Detailed Docstrings:** All functions, methods, and classes must have Google-style docstrings, thoroughly explaining their purpose, parameters, return values, and any exceptions raised. Include usage examples where helpful.
- **Thorough Unit Testing:** Aim for high test coverage (90% or higher) using `pytest`. Test both common cases and edge cases.
- **Robust Exception Handling:** Use specific exception types, provide informative error messages, and handle exceptions gracefully. Implement custom exception classes when needed. Avoid bare `except` clauses.
- **Logging:** Employ the `logging` module judiciously to log important events, warnings, and errors.

