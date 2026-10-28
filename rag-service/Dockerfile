FROM python:3.11-slim
WORKDIR /app
COPY public_demo/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir 'requests>=2.32,<3'
COPY public_demo /app/public_demo
COPY src /app/src
COPY runtime.py answer_policy.py /app/
RUN python -m public_demo.smoke_test
RUN useradd -m -u 1000 glf
USER glf
ENV PORT=7860
EXPOSE 7860
CMD ["gunicorn", "runtime:app", "--bind", "0.0.0.0:7860", "--workers", "1", "--threads", "4", "--timeout", "90"]
