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

### Interactive Analysis

The CLI provides extra options to dive deeper into your spending:

- ``--month YYYY-MM`` displays category totals for a specific month so you can
  investigate unusual savings rates.
- ``--yoy`` shows the average expenses for each calendar month across all
  years, highlighting seasonal trends.

### Web Application

A modern React TypeScript web application is available that provides a comprehensive dashboard for financial analysis. The web interface includes:

- 🔐 **Secure Authentication** - User registration, login, and password reset
- 📊 **Interactive Dashboard** - Visual overview of income, expenses, and savings
- 📈 **Data Visualization** - Interactive charts and graphs for financial insights
- 📤 **CSV Upload** - Drag-and-drop file upload with progress tracking
- 🔍 **Transaction Management** - Advanced filtering, sorting, and search capabilities
- 🎨 **Modern UI** - Clean, responsive design that works on desktop and mobile


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

Additional endpoints provide deeper analysis:

- `POST /month/{YYYY-MM}` returns category totals for the specified month.
- `POST /yoy` computes average expenses for each calendar month across years.

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
data as the HTTP endpoint. Two additional tools are available:

- `month_details` returns category totals for a specific month.
- `yoy_trends` reports average expenses for each calendar month.
LLM agents that support MCP can connect to this server and call the tool to
obtain financial summaries in JSON format.

### Running the Web Application

The web application provides a modern interface for financial analysis with authentication, dashboards, and interactive features.

#### 🚀 Easy Setup with Management Script

We provide a comprehensive management script that handles everything for you:

**Quick Start (Recommended):**
```bash
# Set up the environment (one-time setup)
./run.sh setup

# Start the entire application stack
./run.sh start

# Open the application in your browser
./run.sh open
```

**Management Commands:**
```bash
./run.sh status          # Check service status
./run.sh stop            # Stop all services
./run.sh restart         # Restart all services
./run.sh logs all        # View logs from all services
./run.sh logs frontend -f # Follow frontend logs
./run.sh health          # Check service health
./run.sh help            # Show all available commands
```

The script automatically:
- ✅ Downloads and configures PocketBase
- ✅ Sets up Python virtual environment
- ✅ Installs all dependencies
- ✅ Starts all services in the correct order
- ✅ Manages process lifecycle and logging
- ✅ Provides health checks and debugging tools

#### Manual Setup (Alternative)

If you prefer manual control:

**Prerequisites:**
- **Node.js 18+** and npm
- **Python 3.10+**
- **curl** and **unzip** (for PocketBase download)

**Quick Start:**
1. **Setup frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Access the application:**
   ```
   http://localhost:3000
   ```

**Full Stack Setup:**

1. **Backend setup:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   cd backend
   pip install -r requirements.txt
   uvicorn server:app --reload --port 8000
   ```

2. **PocketBase setup:**
   ```bash
   # Download PocketBase from https://pocketbase.io/docs/
   ./pocketbase serve --http 0.0.0.0:8090
   ```

3. **Frontend setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

#### 🎯 Application URLs

Once started, access these services:

- **🌐 Web Application:** http://localhost:3000
- **🔧 API Backend:** http://localhost:8000
- **📊 PocketBase Admin:** http://localhost:8090/_/

#### Production Build

```bash
cd frontend
npm run build
# Built files will be in frontend/dist/
```

#### Environment Configuration

The application automatically creates configuration files, but you can customize:

**Frontend (`.env.local`):**
```env
VITE_API_URL=http://localhost:8000
VITE_POCKETBASE_URL=http://localhost:8090
```

#### 🛠️ Debugging & Troubleshooting

**Service Management:**
```bash
./run.sh status          # Check which services are running
./run.sh health          # Test service connectivity
./run.sh logs all        # View recent logs from all services
./run.sh restart         # Restart all services
```

**Individual Service Control:**
```bash
./run.sh start frontend   # Start only frontend
./run.sh stop backend     # Stop only backend
./run.sh logs pocketbase -f  # Follow PocketBase logs
```

**Reset & Clean:**
```bash
./run.sh reset           # Reset all application data
./run.sh clean           # Clean dependencies and build files
```

**Common Issues:**
- **Port conflicts:** Stop other services using ports 3000, 8000, or 8090
- **Permission errors:** Ensure `run.sh` is executable (`chmod +x run.sh`)
- **Network issues:** Check firewall settings for local development ports

### Running Tests

Activate the project virtual environment and install dependencies:

```bash
uv venv .venv
source .venv/bin/activate
cd backend && uv pip install -e .[dev]
cd ..
```

Run linting:

```bash
ruff .
```

Run unit tests:

```bash
cd backend && uv run pytest
```

If you add new modules, place tests in the `backend/tests/` directory so `pytest` can discover them.

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

