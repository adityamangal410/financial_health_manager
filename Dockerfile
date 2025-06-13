FROM python:3.10-slim
WORKDIR /app
COPY . /app
RUN pip install uv
RUN uv pip install -e .[dev]
EXPOSE 8000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
