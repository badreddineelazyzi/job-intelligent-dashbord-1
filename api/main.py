import sys
import os



# Ajoute le dossier parent au path (racine du projet)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.middleware.logging_middleware import LoggingMiddleware

app = FastAPI(
    title="Job Intelligence Dashboard API",
    description="API for the Job Recommendation Engine",
    version="1.0.0",
    redirect_slashes=False,
)
app.router.redirect_slashes = True

# --- MIDDLEWARE ---
# Add Logging Middleware
app.add_middleware(LoggingMiddleware)

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware, 
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTES ---
from api.routes import auth, jobs, favorites, search_history
from api.routes import recommend


# main.py
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])
app.include_router(recommend.router, prefix="/recommend", tags=["Recommend"])
app.include_router(favorites.router, prefix="/favorites", tags=["Favorites"])
app.include_router(search_history.router, prefix="/search-history", tags=["History"])


@app.get("/", tags=["Root"])
def root():
    return {"message": "Welcome to the Job Intelligence Dashboard API. Visit /docs for the Swagger UI."}

# To run this file:
# uvicorn api.main:app --reload --host 0.0.0.0 --port 8000