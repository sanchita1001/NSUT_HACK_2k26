
import sys
import os
import traceback

print("1. Starting module check...")
try:
    import numpy as np
    print("   numpy imported")
    import pandas as pd
    print("   pandas imported")
    from fastapi import FastAPI
    print("   fastapi imported")
    import uvicorn
    print("   uvicorn imported")
    import ollama
    print("   ollama imported")
except Exception as e:
    print(f"CRITICAL: Import failure: {e}")
    traceback.print_exc()
    sys.exit(1)

print("2. Checking local modules...")
try:
    from config import MODEL_VERSION
    from fraud_engine import FraudEngine
    from ollama_integration import SummaryGenerator
    from prediction_store import PredictionStore
    from audit_logger import AuditLogger
    print("   Local modules imported")
except Exception as e:
    print(f"CRITICAL: Local module import failure: {e}")
    traceback.print_exc()
    sys.exit(1)

print("3. Initializing FraudEngine...")
try:
    fraud_engine = FraudEngine()
    print("   FraudEngine initialized")
except Exception as e:
    print(f"CRITICAL: Engine init failure: {e}")
    traceback.print_exc()
    sys.exit(1)

print("4. Checking CSV file...")
csv_path = "government-procurement-via-gebiz.csv"
if os.path.exists(csv_path):
    print(f"   CSV found at {csv_path}")
    try:
        print("   Reading CSV...")
        df = pd.read_csv(csv_path)
        print(f"   CSV read successfully, shape: {df.shape}")
        
        print("   Training engine...")
        fraud_engine.train(df)
        print("   Training complete")
    except Exception as e:
        print(f"CRITICAL: Data processing failure: {e}")
        traceback.print_exc()
else:
    print("   CSV NOT found (using fallback)")

print("5. Startup Check Complete - Success")
