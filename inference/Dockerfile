FROM python:3.12-slim
RUN useradd --create-home --uid 1000 app
WORKDIR /home/app
COPY requirements.txt .
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && pip install --no-cache-dir -r requirements.txt
USER app
ENV HF_HOME=/home/app/.cache/huggingface
COPY --chown=app:app app.py .
EXPOSE 7860
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860", "--workers", "1", "--limit-concurrency", "4", "--no-access-log"]
