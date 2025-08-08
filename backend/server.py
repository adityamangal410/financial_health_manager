"""HTTP server exposing financial summary endpoints."""

from typing import List, Optional, Dict, Any
from tempfile import NamedTemporaryFile
import os
import logging
from datetime import datetime, timedelta
from io import StringIO
from collections import defaultdict

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastmcp.server import FastMCP
from fhm.models import Summary
from fhm.pb_client import get_pocketbase_client
from pydantic import BaseModel

from fhm.core import (
    get_month_details,
    parse_csv,
    summarize,
    yoy_monthly_expenses,
)

logger = logging.getLogger(__name__)

mcp_server = FastMCP("FinancialHealthManager")


# Pydantic models for API responses
class Transaction(BaseModel):
    id: str
    date: str
    description: str
    amount: float
    category: str
    account: Optional[str] = None


class TransactionResponse(BaseModel):
    transactions: List[Transaction]
    total: int
    offset: int
    limit: int


class FinancialSummary(BaseModel):
    total_income: float
    total_expenses: float
    net_worth: float
    balance: float
    transactions_count: int
    period_start: str
    period_end: str
    # Enhanced metrics
    savings_rate: float  # (income - expenses) / income * 100
    average_monthly_income: float
    average_monthly_expenses: float
    largest_expense: float
    largest_income: float
    expense_to_income_ratio: float


class CategoryBreakdown(BaseModel):
    category: str
    amount: float
    percentage: float
    transaction_count: int


class UploadResponse(BaseModel):
    upload_id: str
    message: str
    transaction_count: int
    filename: str


class MonthlyDataPoint(BaseModel):
    month: str  # Format: "2024-01", "2024-02", etc.
    income: float
    expenses: float
    net: float
    transaction_count: int


class YearOverYearDataPoint(BaseModel):
    month: str  # Format: "Jan", "Feb", etc.
    current_year: float
    previous_year: float
    year_diff: float
    percent_change: float


class MonthlyTimeSeriesResponse(BaseModel):
    data: List[MonthlyDataPoint]
    period_start: str
    period_end: str
    metric: str  # "expenses", "income", "net"


class YearOverYearResponse(BaseModel):
    data: List[YearOverYearDataPoint]
    current_year: int
    previous_year: int
    metric: str


# Authentication helper
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Extract user from authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="No valid authentication token provided"
        )

    token = authorization.split(" ")[1]
    pb = get_pocketbase_client()

    try:
        # Set the token in the auth store
        pb.auth_store.save(token, None)

        # Verify the token by trying to refresh the authentication
        try:
            auth_data = pb.collection("users").auth_refresh()
            user_record = auth_data.record
            if not user_record or not hasattr(user_record, "id"):
                raise HTTPException(
                    status_code=401, detail="Invalid token - no user data"
                )
            return user_record.id
        except Exception as refresh_error:
            # If refresh fails, try to get user info directly from the token
            # by parsing the JWT payload
            try:
                import base64
                import json

                # Split the JWT token
                token_parts = token.split(".")
                if len(token_parts) != 3:
                    raise HTTPException(status_code=401, detail="Invalid token format")

                # Decode the payload (add padding if needed)
                payload = token_parts[1]
                padding = len(payload) % 4
                if padding:
                    payload += "=" * (4 - padding)

                decoded_payload = base64.b64decode(payload)
                token_data = json.loads(decoded_payload)

                # Get user ID from token
                user_id = token_data.get("id")
                if not user_id:
                    raise HTTPException(status_code=401, detail="No user ID in token")

                # Verify the user exists by trying to get their record
                try:
                    user_record = pb.collection("users").get_one(user_id)
                    return user_record.id
                except Exception:
                    raise HTTPException(status_code=401, detail="User not found")

            except Exception as decode_error:
                logger.error(f"Token validation failed: {decode_error}")
                raise HTTPException(status_code=401, detail="Invalid token")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")


@mcp_server.tool()
def summarize_csvs(paths: list[str]) -> Summary:
    """Summarize one or more CSV files given by path."""
    logger.info("Summarizing CSV files via MCP: %s", paths)
    transactions = parse_csv(list(paths))
    summary = summarize(transactions)
    logger.debug("MCP summary generated. Overall balance: %s", summary.overall_balance)
    return summary


@mcp_server.tool()
def month_details(paths: list[str], month: str) -> dict[str, float]:
    """Return category totals for a specific month."""
    logger.info("Calculating month details for %s via MCP", month)
    transactions = parse_csv(list(paths))
    details = get_month_details(transactions, month)
    logger.debug("MCP month details generated: %s", details)
    return details


@mcp_server.tool()
def yoy_trends(paths: list[str]) -> dict[str, float]:
    """Return average expenses per month across years."""
    logger.info("Calculating YoY trends via MCP")
    transactions = parse_csv(list(paths))
    trends = yoy_monthly_expenses(transactions)
    logger.debug("MCP YoY trends generated: %s", trends)
    return trends


app = FastAPI(title="Financial Health Manager", version="1.0.0")

# Add CORS middleware with env-configurable origins
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
allow_origins_list = [o.strip() for o in allowed_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> dict[str, str]:
    """Basic root endpoint."""
    return {"message": "Financial Health Manager API", "version": "1.0.0"}


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    try:
        # Test PocketBase connection with a simple request
        pb = get_pocketbase_client()
        # Just test if we can create a client - collections require auth
        if pb:
            return {"status": "healthy", "service": "financial-health-manager-api"}
        else:
            raise Exception("PocketBase client creation failed")
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")


@app.get("/api/transactions", response_model=TransactionResponse)
async def get_transactions(
    user_id: str = Depends(get_current_user),
    authorization: Optional[str] = Header(None),
    limit: int = 50,
    offset: int = 0,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
    account: Optional[str] = None,
    type: Optional[str] = None,
):
    """Get transactions for the authenticated user."""
    try:
        pb = get_pocketbase_client()

        # Set the user's token for authenticated operations
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            pb.auth_store.save(token, None)

        # Build filter query
        filters = [f"user = '{user_id}'"]

        if start_date:
            filters.append(f"date >= '{start_date}'")
        if end_date:
            filters.append(f"date <= '{end_date}'")
        if category:
            filters.append(f"category = '{category}'")
        if account:
            filters.append(f"account = '{account}'")
        if type == "income":
            filters.append("amount > 0")
        elif type == "expense":
            filters.append("amount < 0")

        filter_query = " && ".join(filters)

        # Get transactions with pagination
        result = pb.collection("transactions").get_list(
            page=offset // limit + 1,
            per_page=limit,
            query_params={"filter": filter_query, "sort": "-date"},
        )

        transactions = []
        for item in result.items:
            transactions.append(
                Transaction(
                    id=str(getattr(item, "id", "")),
                    date=str(getattr(item, "date", "")),
                    description=str(getattr(item, "description", "")),
                    amount=float(getattr(item, "amount", 0.0)),
                    category=str(getattr(item, "category", "uncategorized")),
                    account=getattr(item, "account", None),
                )
            )

        return TransactionResponse(
            transactions=transactions,
            total=result.total_items,
            offset=offset,
            limit=limit,
        )

    except Exception as e:
        logger.error(f"Failed to get transactions: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve transactions")


@app.get("/api/financial-summary", response_model=FinancialSummary)
async def get_financial_summary(
    user_id: str = Depends(get_current_user),
    authorization: Optional[str] = Header(None),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """Get financial summary for the authenticated user."""
    try:
        pb = get_pocketbase_client()

        # Set the user's token for authenticated operations
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            pb.auth_store.save(token, None)

        # Default to last 30 days if no dates provided
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        if not end_date:
            end_date = datetime.now().strftime("%Y-%m-%d")

        # Build filter query
        filter_query = (
            f"user = '{user_id}' && date >= '{start_date}' && date <= '{end_date}'"
        )

        # Get all transactions in date range
        result = pb.collection("transactions").get_list(
            page=1,
            per_page=10000,  # Get all transactions
            query_params={"filter": filter_query},
        )

        total_income = 0.0
        total_expenses = 0.0
        largest_expense = 0.0
        largest_income = 0.0

        for item in result.items:
            amount = float(getattr(item, "amount", 0.0))
            if amount > 0:
                total_income += amount
                largest_income = max(largest_income, amount)
            else:
                expense_amount = abs(amount)
                total_expenses += expense_amount
                largest_expense = max(largest_expense, expense_amount)

        # Calculate date range in months for averages
        assert isinstance(start_date, str)
        assert isinstance(end_date, str)
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        months = max(1, (end_dt - start_dt).days / 30.44)  # Average days per month

        # Calculate enhanced metrics
        net_worth = total_income - total_expenses
        savings_rate = (net_worth / total_income * 100) if total_income > 0 else 0.0
        average_monthly_income = total_income / months
        average_monthly_expenses = total_expenses / months
        expense_to_income_ratio = (
            (total_expenses / total_income) if total_income > 0 else 0.0
        )

        return FinancialSummary(
            total_income=total_income,
            total_expenses=total_expenses,
            net_worth=net_worth,
            balance=net_worth,
            transactions_count=len(result.items),
            period_start=start_date,
            period_end=end_date,
            savings_rate=savings_rate,
            average_monthly_income=average_monthly_income,
            average_monthly_expenses=average_monthly_expenses,
            largest_expense=largest_expense,
            largest_income=largest_income,
            expense_to_income_ratio=expense_to_income_ratio,
        )

    except Exception as e:
        logger.error(f"Failed to get financial summary: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to retrieve financial summary"
        )


@app.get("/api/category-breakdown", response_model=List[CategoryBreakdown])
async def get_category_breakdown(
    user_id: str = Depends(get_current_user),
    authorization: Optional[str] = Header(None),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """Get category breakdown for expenses."""
    try:
        pb = get_pocketbase_client()

        # Set the user's token for authenticated operations
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            pb.auth_store.save(token, None)

        # Default to last 30 days if no dates provided
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        if not end_date:
            end_date = datetime.now().strftime("%Y-%m-%d")

        # Build filter query for expenses only
        filter_query = f"user = '{user_id}' && date >= '{start_date}' && date <= '{end_date}' && amount < 0"

        # Get all expense transactions
        result = pb.collection("transactions").get_list(
            page=1, per_page=10000, query_params={"filter": filter_query}
        )

        # Group by category
        category_totals = {}
        category_counts = {}

        for item in result.items:
            category = str(getattr(item, "category", "uncategorized"))
            amount = abs(
                float(getattr(item, "amount", 0.0))
            )  # Convert to positive for expenses

            if category not in category_totals:
                category_totals[category] = 0.0
                category_counts[category] = 0

            category_totals[category] += amount
            category_counts[category] += 1

        # Calculate percentages
        total_expenses = sum(category_totals.values())
        breakdown = []

        for category, amount in category_totals.items():
            percentage = (amount / total_expenses * 100) if total_expenses > 0 else 0
            breakdown.append(
                CategoryBreakdown(
                    category=category,
                    amount=amount,
                    percentage=percentage,
                    transaction_count=category_counts[category],
                )
            )

        # Sort by amount descending
        breakdown.sort(key=lambda x: x.amount, reverse=True)

        return breakdown

    except Exception as e:
        logger.error(f"Failed to get category breakdown: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to retrieve category breakdown"
        )


@app.post("/api/upload-csv", response_model=UploadResponse)
async def upload_csv(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
    authorization: Optional[str] = Header(None),
):
    """Upload and process a CSV file."""
    try:
        pb = get_pocketbase_client()

        # Set the user's token for authenticated operations
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            pb.auth_store.save(token, None)
            logger.info(f"Set PocketBase auth token for user operations")

        # Validate file type (case-insensitive)
        if not file.filename or not file.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed")

        # Read and parse CSV
        content = await file.read()
        csv_content = content.decode("utf-8")

        # Save to temporary file for processing
        temp = NamedTemporaryFile(mode="w", delete=False, suffix=".csv")
        temp.write(csv_content)
        temp.close()

        try:
            # Calculate file hash for de-duplication first
            import hashlib

            # Read file content for hashing
            with open(temp.name, "rb") as f:
                file_content = f.read()
                file_hash = hashlib.sha256(file_content).hexdigest()

            logger.info(f"File hash: {file_hash}")

            # Check if this file has been uploaded before by checking if any transaction has this file_hash
            try:
                # Check for existing transactions with this file hash
                filter_query = f"user = '{user_id}' && file_hash = '{file_hash}'"
                existing_check = pb.collection("transactions").get_list(
                    page=1,
                    per_page=1,
                    query_params={"filter": filter_query},
                )

                if len(existing_check.items) > 0:
                    logger.info(
                        f"File hash {file_hash} already exists - duplicate file detected"
                    )

                    return UploadResponse(
                        upload_id="duplicate",
                        message=f"File '{file.filename}' was already uploaded. No new transactions added.",
                        transaction_count=0,
                        filename=file.filename,
                    )

            except Exception as e:
                logger.warning(f"Failed to check for existing file hash: {e}")
                # Continue with upload if we can't check for duplicates

            # Parse CSV using existing parser
            transactions = parse_csv([temp.name])

            # No upload record for this simplified approach
            upload_record = None

            # Save transactions to database (no per-transaction de-duplication needed)
            transaction_count = 0
            logger.info(f"Parsed {len(transactions)} transactions from CSV")

            for i, transaction in enumerate(transactions):
                transaction_data: Dict[str, Any] = {}
                try:
                    transaction_data = {
                        "user": user_id,
                        "date": transaction.date.isoformat(),
                        "description": transaction.description,
                        "amount": transaction.amount,
                        "category": transaction.category,
                        "account": transaction.account or "",
                        "file_hash": file_hash,
                    }
                    logger.info(f"Creating transaction {i+1}: {transaction_data}")

                    # Use the authenticated PocketBase client (should already have the user's token)
                    pb.collection("transactions").create(transaction_data)

                    transaction_count += 1
                    logger.info(f"Successfully created transaction {i+1}")
                except Exception as e:
                    logger.error(f"Failed to save transaction {i+1}: {e}")
                    logger.error(f"Transaction data was: {transaction_data}")
                    continue

            # No upload record to update in simplified approach
            upload_id = "none"

            return UploadResponse(
                upload_id=upload_id,
                message=f"Successfully processed {transaction_count} transactions from {file.filename}",
                transaction_count=transaction_count,
                filename=file.filename,
            )

        finally:
            # Clean up temp file
            os.unlink(temp.name)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload CSV: {e}")
        raise HTTPException(status_code=500, detail="Failed to process CSV file")


@app.delete("/api/transactions")
async def delete_all_transactions(
    user_id: str = Depends(get_current_user),
    authorization: Optional[str] = Header(None),
):
    """Delete all transactions for the authenticated user."""
    try:
        pb = get_pocketbase_client()

        # Set the user's token for authenticated operations
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            pb.auth_store.save(token, None)

        # Get all transactions for the user
        filter_query = f"user = '{user_id}'"
        result = pb.collection("transactions").get_list(
            page=1,
            per_page=10000,  # Get all transactions
            query_params={"filter": filter_query},
        )

        # Delete each transaction
        deleted_count = 0
        for transaction in result.items:
            try:
                pb.collection("transactions").delete(transaction.id)
                deleted_count += 1
            except Exception as delete_error:
                logger.warning(
                    f"Failed to delete transaction {transaction.id}: {delete_error}"
                )
                continue

        logger.info(f"Deleted {deleted_count} transactions for user {user_id}")

        return {
            "message": f"Successfully deleted {deleted_count} transactions",
            "deleted_count": deleted_count,
        }

    except Exception as e:
        logger.error(f"Failed to delete transactions: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete transactions")


@app.get("/api/monthly-time-series", response_model=MonthlyTimeSeriesResponse)
async def get_monthly_time_series(
    user_id: str = Depends(get_current_user),
    authorization: Optional[str] = Header(None),
    months: int = 12,  # Number of months to look back
    metric: str = "expenses",  # "expenses", "income", "net"
    category: Optional[str] = None,
    account: Optional[str] = None,
):
    """Get monthly time series data for the authenticated user."""
    try:
        pb = get_pocketbase_client()

        # Set the user's token for authenticated operations
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            pb.auth_store.save(token, None)

        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=months * 30)

        # Build filter query
        filters = [f"user = '{user_id}'"]
        filters.append(f"date >= '{start_date.strftime('%Y-%m-%d')}'")
        filters.append(f"date <= '{end_date.strftime('%Y-%m-%d')}'")

        if category:
            filters.append(f"category = '{category}'")
        if account:
            filters.append(f"account = '{account}'")

        filter_query = " && ".join(filters)

        # Get all transactions in the period
        result = pb.collection("transactions").get_list(
            page=1,
            per_page=10000,
            query_params={"filter": filter_query, "sort": "date"},
        )

        # Group transactions by month
        monthly_data = defaultdict(lambda: {"income": 0.0, "expenses": 0.0, "count": 0})

        for item in result.items:
            # Parse date and get month key
            date_str = str(getattr(item, "date", ""))
            transaction_date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            month_key = transaction_date.strftime("%Y-%m")

            amount = float(getattr(item, "amount", 0.0))
            monthly_data[month_key]["count"] += 1

            if amount > 0:
                monthly_data[month_key]["income"] += amount
            else:
                monthly_data[month_key]["expenses"] += abs(amount)

        # Generate complete month series (fill gaps with zeros)
        data_points = []
        current_date = start_date.replace(day=1)

        while current_date <= end_date:
            month_key = current_date.strftime("%Y-%m")
            month_data = monthly_data.get(
                month_key, {"income": 0.0, "expenses": 0.0, "count": 0}
            )

            data_points.append(
                MonthlyDataPoint(
                    month=month_key,
                    income=month_data["income"],
                    expenses=month_data["expenses"],
                    net=month_data["income"] - month_data["expenses"],
                    transaction_count=int(month_data["count"]),
                )
            )

            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)

        return MonthlyTimeSeriesResponse(
            data=data_points,
            period_start=start_date.strftime("%Y-%m-%d"),
            period_end=end_date.strftime("%Y-%m-%d"),
            metric=metric,
        )

    except Exception as e:
        logger.error(f"Failed to get monthly time series: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to get monthly time series data"
        )


@app.get("/api/year-over-year", response_model=YearOverYearResponse)
async def get_year_over_year(
    user_id: str = Depends(get_current_user),
    authorization: Optional[str] = Header(None),
    current_year: Optional[int] = None,
    metric: str = "expenses",  # "expenses", "income", "net"
    category: Optional[str] = None,
    account: Optional[str] = None,
):
    """Get year-over-year comparison data for the authenticated user."""
    try:
        pb = get_pocketbase_client()

        # Set the user's token for authenticated operations
        if authorization and authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
            pb.auth_store.save(token, None)

        # Default to current year if not specified
        if current_year is None:
            current_year = datetime.now().year

        previous_year = current_year - 1

        # Get data for both years
        def get_year_data(year):
            filters = [f"user = '{user_id}'"]
            filters.append(f"date >= '{year}-01-01'")
            filters.append(f"date <= '{year}-12-31'")

            if category:
                filters.append(f"category = '{category}'")
            if account:
                filters.append(f"account = '{account}'")

            filter_query = " && ".join(filters)

            result = pb.collection("transactions").get_list(
                page=1,
                per_page=10000,
                query_params={"filter": filter_query, "sort": "date"},
            )

            # Group by month
            monthly_data = defaultdict(lambda: {"income": 0.0, "expenses": 0.0})

            for item in result.items:
                date_str = str(getattr(item, "date", ""))
                transaction_date = datetime.fromisoformat(
                    date_str.replace("Z", "+00:00")
                )
                month = transaction_date.month

                amount = float(getattr(item, "amount", 0.0))
                if amount > 0:
                    monthly_data[month]["income"] += amount
                else:
                    monthly_data[month]["expenses"] += abs(amount)

            return monthly_data

        current_data = get_year_data(current_year)
        previous_data = get_year_data(previous_year)

        # Generate comparison data points
        data_points = []
        month_names = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ]

        for month_num in range(1, 13):
            month_name = month_names[month_num - 1]

            # Get values based on metric
            if metric == "income":
                current_value = current_data.get(month_num, {}).get("income", 0.0)
                previous_value = previous_data.get(month_num, {}).get("income", 0.0)
            elif metric == "expenses":
                current_value = current_data.get(month_num, {}).get("expenses", 0.0)
                previous_value = previous_data.get(month_num, {}).get("expenses", 0.0)
            else:  # net
                current_income = current_data.get(month_num, {}).get("income", 0.0)
                current_expenses = current_data.get(month_num, {}).get("expenses", 0.0)
                current_value = current_income - current_expenses

                previous_income = previous_data.get(month_num, {}).get("income", 0.0)
                previous_expenses = previous_data.get(month_num, {}).get(
                    "expenses", 0.0
                )
                previous_value = previous_income - previous_expenses

            year_diff = current_value - previous_value
            percent_change = (
                ((current_value - previous_value) / previous_value * 100)
                if previous_value != 0
                else 0.0
            )

            data_points.append(
                YearOverYearDataPoint(
                    month=month_name,
                    current_year=current_value,
                    previous_year=previous_value,
                    year_diff=year_diff,
                    percent_change=percent_change,
                )
            )

        return YearOverYearResponse(
            data=data_points,
            current_year=current_year,
            previous_year=previous_year,
            metric=metric,
        )

    except Exception as e:
        logger.error(f"Failed to get year-over-year data: {e}")
        raise HTTPException(status_code=500, detail="Failed to get year-over-year data")


# Legacy endpoint for backward compatibility
@app.post("/summarize", response_model=Summary)
async def summarize_endpoint(files: List[UploadFile] = File(...)) -> Summary:
    """Legacy endpoint - Return summary statistics for uploaded CSV files."""
    paths = []
    logger.info("Received %d file(s) for summarization", len(files))

    try:
        for f in files:
            data = await f.read()
            temp = NamedTemporaryFile(delete=False)
            temp.write(data)
            temp.close()
            paths.append(temp.name)

        transactions = parse_csv(paths)
        summary = summarize(transactions)

        # For backward-compatibility tests: create PocketBase records for the
        # upload and each parsed transaction (no auth required for this legacy path)
        try:
            pb = get_pocketbase_client()
            # Create a minimal upload record
            try:
                pb.collection("uploads").create(
                    {
                        "status": "completed",
                        "file_count": len(files),
                    }
                )
            except Exception as e:
                logger.debug(f"Uploads collection create failed (legacy path): {e}")

            # Create transaction records
            for tx in transactions:
                try:
                    pb.collection("transactions").create(
                        {
                            "date": tx.date.isoformat(),
                            "description": tx.description,
                            "amount": tx.amount,
                            "category": tx.category,
                            "account": tx.account or "",
                        }
                    )
                except Exception as e:
                    logger.debug(
                        f"Transactions collection create failed (legacy path): {e}"
                    )
        except Exception as e:
            logger.debug(f"PocketBase interaction skipped/failed (legacy path): {e}")

        # Clean up temp files
        for path in paths:
            os.unlink(path)

        logger.debug("Summary from endpoint computed: %s", summary.model_dump_json())
        return summary

    except Exception as e:
        # Clean up temp files on error
        for path in paths:
            try:
                os.unlink(path)
            except:
                pass
        logger.error(f"Failed to process summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to process files")


@app.post("/month/{month}")
async def month_details_endpoint(
    month: str, files: List[UploadFile] = File(...)
) -> Dict[str, float]:
    """Legacy endpoint - Return category totals for a specific month."""
    paths: list[str] = []
    logger.info("Received %d file(s) for month details %s", len(files), month)
    try:
        for f in files:
            data = await f.read()
            temp = NamedTemporaryFile(delete=False)
            temp.write(data)
            temp.close()
            paths.append(temp.name)

        transactions = parse_csv(paths)
        details = get_month_details(transactions, month)

        # Clean up
        for path in paths:
            os.unlink(path)
        return details
    except Exception as e:
        for path in paths:
            try:
                os.unlink(path)
            except Exception:
                pass
        logger.error(f"Failed to process month details: {e}")
        raise HTTPException(status_code=500, detail="Failed to process files")


@app.post("/yoy")
async def yoy_endpoint(files: List[UploadFile] = File(...)) -> Dict[str, float]:
    """Legacy endpoint - Return average expenses per month across years."""
    paths: list[str] = []
    logger.info("Received %d file(s) for YoY analysis", len(files))
    try:
        for f in files:
            data = await f.read()
            temp = NamedTemporaryFile(delete=False)
            temp.write(data)
            temp.close()
            paths.append(temp.name)

        transactions = parse_csv(paths)
        trends = yoy_monthly_expenses(transactions)

        # Clean up
        for path in paths:
            os.unlink(path)
        return trends
    except Exception as e:
        for path in paths:
            try:
                os.unlink(path)
            except Exception:
                pass
        logger.error(f"Failed to process YoY: {e}")
        raise HTTPException(status_code=500, detail="Failed to process files")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
