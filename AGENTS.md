# AGENTS.md

## Quick Summary
Financial Health Manager parses financial CSV data to calculate metrics like category totals and savings rate.

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
