# Financial Health Manager

Financial Health Manager tracks your income and expenses from CSV files and computes metrics such as monthly or yearly savings rate. It produces summaries that help you understand where your money is going.

## Expected Inputs

The program reads transaction data from one or more CSV files. It accepts
standardized files exported from banks such as Chase or Amex, or brokerages like
Fidelity, without any manual editing. When a statement uses unfamiliar headers,
you can convert it to the minimal three-column format shown below.

The parser understands common column names like `Date`, `Description`, `Amount`,
`Credit`, and `Debit` so most statements work out of the box.

Each row must contain:

1. `date` - Transaction date in `YYYY-MM-DD` format
2. `category` - Category name such as `income`, `rent`, `groceries` or any custom label
3. `amount` - Positive numbers represent income and negative numbers represent expenses

A sample file might look like this:

```
2024-01-01,income,3000
2024-01-03,rent,-1200
2024-01-10,grocery,-150
```

You may pass multiple CSVs at once:

```bash
python app.py checking.csv credit_card.csv brokerage.csv
```

## Expected Output

Running the program generates a summary similar to:

```
Category   Total
=================
Income     $3000
Rent       -$1200
Grocery    -$150
-----------------
Balance    $1650
```

The exact layout of the report may differ, but it always shows totals grouped by category as well as your overall balance and savings rate.
### Additional Metrics

Along with savings rate, the following insights can help gauge your financial health:
- Average monthly income and spending
- Top expense categories
- Months of living expenses covered by savings
- Debt-to-income ratio

### Future Web Extension

The core calculations live in a standalone module so the CLI can later be replaced or augmented by a web interface.


## Development Setup

1. Install **Python 3.10** or higher.
2. Clone the repository and create a uv-managed virtual environment:

```bash
git clone https://github.com/yourname/financial_health_manager.git
cd financial_health_manager
uv venv .venv
source .venv/bin/activate
```

3. Install dependencies including ruff and pytest:

```bash
uv pip install -e .[dev]
```

4. Format and lint the code using ruff:

```bash
ruff format .
ruff .
```

5. Start developing! The entry point script is `app.py`.

### Running the Application

Provide one or more CSV files containing transactions:

```bash
python app.py data/transactions.csv data/credit.csv
```

You can pass any number of files. They will all be parsed and summarized
together.

The script prints the summary to standard output.

### Running the HTTP Service

Start the FastAPI server using uvicorn:

```bash
uvicorn server:app --reload
```

Send one or more CSV files using `curl`:

```bash
curl -F "files=@checking.csv" \
     -F "files=@credit.csv" \
     http://localhost:8000/summarize
```

You can integrate this endpoint with an LLM-based MCP client by issuing an HTTP
request containing the transaction CSVs and processing the JSON response.

### Running the MCP Server

The repository includes an experimental MCP server powered by **FastMCP**.
Launch it as a standalone process:

```bash
python server.py
```

Clients can then interact with the tool `summarize_csvs` using the MCP
protocol. Provide a list of file paths and the server returns the same summary
data as the HTTP endpoint.
LLM agents that support MCP can connect to this server and call the tool to
obtain financial summaries in JSON format.

### Running Tests

Run `ruff` to ensure formatting and linting pass before executing tests:

```bash
ruff .
pytest
```

If you add new modules, place tests in the `tests/` directory so `pytest` can discover them.

## Running with Docker

A basic `Dockerfile` is included for convenience. Build the image and run the container as follows:

```bash
# Build the image
docker build -t financial-health-manager .

# Run the HTTP server
# Expose port 8000 and mount a local directory with CSV files if needed

docker run --rm -p 8000:8000 financial-health-manager
```

This approach lets you run the program without installing Python locally.

## Contributing

Feel free to submit pull requests or open issues. When contributing code, please:

- Write unit tests for new functionality
- Follow `PEP8` style conventions
- Run `pytest` before committing

## License

This project is released under the MIT License.

