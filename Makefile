.PHONY: install format lint test run-airflow run-api docker-up docker-down

install:
	pip install -r requirements.txt

format:
	black .
	isort .

lint:
	flake8 .
	black --check .
	isort --check-only .

test:
	pytest tests/

run-api:
	uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

run-airflow:
	airflow standalone

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down
