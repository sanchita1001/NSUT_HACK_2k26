# -*- coding: utf-8 -*-
"""
Prediction Storage - Store predictions once, generate profiles later
Architecture: /predict → save prediction with ID, /generate-profile/{id} → load stored prediction
"""

import os
import json
from datetime import datetime
from typing import Dict, Any, Optional

from config import PREDICTIONS_STORE


class PredictionStore:
    """
    Store predictions once, generate profiles later
    
    Architecture:
    1. /predict → save prediction with ID
    2. /generate-profile/{id} → load stored prediction, generate profile
    """
    
    @staticmethod
    def save_prediction(tx_input: Dict[str, Any], prediction: Dict[str, Any]) -> str:
        """Save prediction to JSONL store, return prediction ID"""
        try:
            prediction_id = f"PRED-{datetime.utcnow().strftime('%Y%m%d%H%M%S%f')}"
            
            record = {
                "prediction_id": prediction_id,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "input": tx_input,
                "output": prediction
            }
            
            with open(PREDICTIONS_STORE, "a") as f:
                f.write(json.dumps(record) + "\n")
            
            return prediction_id
        except Exception as e:
            print(f"WARNING: Prediction storage failed: {e}")
            return "PRED-UNKNOWN"
    
    @staticmethod
    def load_prediction(prediction_id: str) -> Optional[Dict[str, Any]]:
        """Load stored prediction by ID"""
        try:
            if not os.path.exists(PREDICTIONS_STORE):
                return None
            
            with open(PREDICTIONS_STORE, "r") as f:
                for line in f:
                    record = json.loads(line)
                    if record.get("prediction_id") == prediction_id:
                        return record
            
            return None
        except Exception as e:
            print(f"WARNING: Prediction load failed: {e}")
            return None
