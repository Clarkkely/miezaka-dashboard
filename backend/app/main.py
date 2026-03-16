# Force reload - predictions fix
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.routes import rapport, analytics_advanced, predictions, recommendations
import time

print("🚀 BACKEND RELOADED - PREDICTIONS READY")
app = FastAPI(
    title="API MIEZAKA",
    description="API pour le tableau de bord MIEZAKA",
    version="1.0.0"
)

# Middleware de logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    formatted_process_time = "{0:.2f}ms".format(process_time)
    print(f"🔥 [{request.method}] {request.url.path} - Status: {response.status_code} - Time: {formatted_process_time}")
    return response

# Configurer CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure les routes
app.include_router(rapport.router, prefix="/api/rapport", tags=["Rapports"])
app.include_router(analytics_advanced.router, prefix="/api", tags=["Analytics Advanced"])
app.include_router(predictions.router, prefix="/api", tags=["Predictions"])
app.include_router(recommendations.router, prefix="/api", tags=["Recommendations"])

@app.get("/")
async def root():
    return {
        "message": "API MIEZAKA Dashboard",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}