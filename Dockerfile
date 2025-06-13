FROM python:3.10-slim
WORKDIR /app
COPY . /app
RUN pip install uv
RUN uv pip install -e .[dev]
CMD ["python", "app.py", "/data/transactions.csv"]
