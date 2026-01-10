# -*- coding: utf-8 -*-
"""
Audit Logger - Append-only audit log for government compliance
"""

import json
from datetime import datetime
from typing import Dict, Any

from config import AUDIT_LOG_PATH


class AuditLogger:
    """Append-only audit log for government compliance"""
    
    @staticmethod
    def log_prediction(tx_input: Dict[str, Any], prediction: Dict[str, Any], prediction_id: str) -> None:
        """Log to immutable JSONL audit trail"""
        try:
            audit_entry = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "prediction_id": prediction_id,
                "input": tx_input,
                "output": prediction,
                "model_version": prediction.get("model_version"),
                "trained_at": prediction.get("trained_at")
            }
            
            with open(AUDIT_LOG_PATH, "a") as f:
                f.write(json.dumps(audit_entry) + "\n")
        except Exception as e:
            print(f"WARNING: Audit log write failed: {e}")
