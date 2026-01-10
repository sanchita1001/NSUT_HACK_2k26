# -*- coding: utf-8 -*-
"""
Production-Grade Fraud Detection Service - FastAPI Application
Modular architecture with separated concerns

GOVERNANCE RULES:
1. FraudEngine.predict() is the SINGLE DECISION AUTHORITY
2. No component may modify fraud_score, risk_score, is_anomaly, or reasons
3. All outputs are deterministic with fixed random seeds
4. Predictions stored once, profiles generated from stored data
5. fraud_score (ML) vs risk_score (rules) separation for defense layers
6. System never declares fraud - only identifies risk indicators
"""

import numpy as np
import pandas as pd
import os
import traceback
from typing import Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# Import from modular components
from config import MODEL_VERSION
from fraud_engine import FraudEngine
from ollama_integration import SummaryGenerator
from prediction_store import PredictionStore
from audit_logger import AuditLogger


# ==================== FASTAPI APPLICATION ====================
app = FastAPI(
    title="Government Fraud Detection Service - Full Production",
    version=MODEL_VERSION
)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for internal service
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

fraud_engine: Optional[FraudEngine] = None


# ==================== PYDANTIC MODELS ====================
class Transaction(BaseModel):
    amount: float
    agency: str
    vendor: str
    transaction_time: Optional[str] = None


# ==================== STARTUP ====================
@app.on_event("startup")
def load_and_train_model():
    """Train FraudEngine once at startup"""
    global fraud_engine
    
    print("=" * 60)
    print("INITIALIZING FRAUD DETECTION ENGINE (FULL VERSION)")
    print("=" * 60)
    
    fraud_engine = FraudEngine()
    
    try:
        csv_path = "government-procurement-via-gebiz.csv"
        
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            
            if df['awarded_amt'].dtype == object:
                df['awarded_amt'] = df['awarded_amt'].str.replace('$', '').str.replace(',', '').astype(float)
            
            fraud_engine.train(df)
            print("=" * 60)
            print("FRAUD DETECTION ENGINE READY")
            print("Features: Isolation Forest + Autoencoder + Supplier Stats")
            print("=" * 60)
            
        else:
            print(f"WARNING: Dataset not found")
            df_fallback = pd.DataFrame({
                "awarded_amt": [1000, 5000, 10000, 50000, 100000, 500000],
                "supplier_name": ["Vendor A", "Vendor B", "Vendor C", "Vendor D", "Vendor E", "Vendor F"],
                "agency": ["Agency 1", "Agency 2", "Agency 1", "Agency 3", "Agency 2", "Agency 1"],
                "award_date": pd.date_range("2024-01-01", periods=6)
            })
            fraud_engine.train(df_fallback)
            
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        traceback.print_exc()
        raise


# ==================== ROUTES ====================
@app.get("/")
def health():
    """Health check"""
    return {
        "status": "Active",
        "model_version": MODEL_VERSION,
        "trained_at": fraud_engine.trained_at if fraud_engine else None,
        "features": [
            "Isolation Forest",
            "Autoencoder (TensorFlow)",
            "Agency Statistics",
            "Supplier Statistics",
            "Benford's Law",
            "Time-Based Detection",
            "Ollama llama3:8b Profiling"
        ],
        "defense_layers": {
            "fraud_score": "ML signal (Isolation Forest + Autoencoder)",
            "risk_score": "Rule-based human judgment"
        }
    }


@app.post("/predict")
def predict_fraud(tx: Transaction):
    """
    Predict fraud risk using FraudEngine (single decision authority)
    
    Architecture: Store prediction once, profile later
    Returns: prediction with ID for later profiling
    """
    try:
        if fraud_engine is None:
            raise HTTPException(status_code=503, detail="Engine not initialized")
        
        tx_dict = {
            "amount": tx.amount,
            "agency": tx.agency,
            "vendor": tx.vendor,
            "transaction_time": tx.transaction_time
        }
        
        # SINGLE DECISION AUTHORITY
        prediction = fraud_engine.predict(tx_dict)
        
        # Generate basic summary
        summary = SummaryGenerator.generate_basic_summary(prediction)
        prediction["summary"] = summary
        
        # Store prediction for later profiling
        prediction_id = PredictionStore.save_prediction(tx_dict, prediction)
        prediction["prediction_id"] = prediction_id
        
        # Log to audit trail
        AuditLogger.log_prediction(tx_dict, prediction, prediction_id)
        
        return prediction
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Prediction Error: {e}")
        traceback.print_exc()
        return {
            "fraud_score": 0.5,
            "risk_score": 50,
            "is_anomaly": False,
            "reasons": ["Error - manual review required"],
            "summary": "System error. Requires manual investigation.",
            "model_version": MODEL_VERSION,
            "trained_at": fraud_engine.trained_at if fraud_engine else None
        }


@app.post("/generate-profile/{prediction_id}")
def generate_profile_by_id(prediction_id: str):
    """
    Generate vendor/agency profile from STORED prediction
    
    Architecture: Load stored prediction, generate profile (no recomputation)
    READ-ONLY: Does not recompute fraud scores
    """
    try:
        # Load stored prediction
        record = PredictionStore.load_prediction(prediction_id)
        
        if not record:
            raise HTTPException(status_code=404, detail="Prediction not found")
        
        tx_data = record["input"]
        prediction = record["output"]
        
        # Generate vendor/agency profile using Ollama
        profile = SummaryGenerator.generate_vendor_profile(tx_data, prediction)
        
        return {
            "prediction_id": prediction_id,
            "timestamp": record["timestamp"],
            "transaction": tx_data,
            "fraud_score": prediction.get("fraud_score"),
            "risk_score": prediction.get("risk_score"),
            "is_anomaly": prediction.get("is_anomaly"),
            "reasons": prediction.get("reasons", []),
            "vendor_profile": profile
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Profile Generation Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Profile generation failed")


@app.post("/generate-profile")
def generate_profile_direct(tx: Transaction):
    """
    Generate vendor/agency profile directly (for backward compatibility)
    
    Note: Prefer /generate-profile/{prediction_id} for production use
    Queries vendor historical data from predictions_store.jsonl
    """
    try:
        if fraud_engine is None:
            raise HTTPException(status_code=503, detail="Engine not initialized")
        
        tx_dict = {
            "amount": tx.amount,
            "agency": tx.agency,
            "vendor": tx.vendor,
            "transaction_time": tx.transaction_time
        }
        
        # Get fraud prediction
        prediction = fraud_engine.predict(tx_dict)
        
        # Query vendor historical data from JSONL file
        vendor_context = PredictionStore.get_vendor_history(tx.vendor)
        
        # Generate vendor/agency profile using Ollama with vendor context from JSONL
        profile = SummaryGenerator.generate_vendor_profile(tx_dict, prediction, vendor_context)
        
        return {
            **prediction,
            "vendor_profile": profile,
            "vendor_context": vendor_context
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Profile Generation Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Profile generation failed")


@app.get("/vendor-history/{vendor}")
def get_vendor_history(vendor: str):
    """
    Get vendor historical data from predictions_store.jsonl
    
    Returns statistics and recent transactions for the specified vendor
    """
    try:
        history = PredictionStore.get_vendor_history(vendor)
        return {
            "success": True,
            "vendor": vendor,
            "data": history
        }
    except Exception as e:
        print(f"Vendor History Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to fetch vendor history")


@app.post("/chat")
async def chat(request: dict):
    """
    Chat with PFMS Sahayak (Ollama backed)
    """
    try:
        message = request.get("message", "")
        if not message:
            raise HTTPException(status_code=400, detail="Message required")
            
        print(f"Chat Request: {message}")
        response_text = SummaryGenerator.chat_response(message)
        return {"response": response_text}
        
    except Exception as e:
        print(f"Chat Error: {e}")
        return {"response": "System Error: Unable to process chat request."}


# ==================== MAIN ====================
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
