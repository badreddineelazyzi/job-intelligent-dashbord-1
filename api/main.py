from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.middleware.logging_middleware import LoggingMiddleware

app = FastAPI(
    title="Job Intelligence Dashboard API",
    description="API for the Job Recommendation Engine",
    version="1.0.0",
)

# --- MIDDLEWARE ---
# Add Logging Middleware
app.add_middleware(LoggingMiddleware)

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTES ---
from api.routes import jobs
from api.routes import recommend

app.include_router(jobs.router)
app.include_router(recommend.router)

@app.get("/", tags=["Root"])
def root():
    return {"message": "Welcome to the Job Intelligence Dashboard API. Visit /docs for the Swagger UI."}

# To run this file:
# uvicorn api.main:app --reload --host 0.0.0.0 --port 8000