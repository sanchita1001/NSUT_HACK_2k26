# -*- coding: utf-8 -*-
"""
Fraud Detection Engine - ML/DL Models
Isolation Forest + Autoencoder for anomaly detection
"""

import numpy as np
import pandas as pd
import os
from datetime import datetime
from typing import Dict, Any, Optional

from config import RANDOM_SEED, MODEL_VERSION


class FraudEngine:
    """
    Single Decision Authority for Fraud Detection
    
    FULL PRODUCTION VERSION:
    - Isolation Forest + Autoencoder (hybrid ML)
    - Agency AND Supplier statistics
    - fraud_score (ML signal) vs risk_score (human judgment)
    - Deterministic, reproducible, audit-ready
    """
    
    def __init__(self):
        self.if_model = None
        self.ae_model = None
        self.scaler = None
        self.mm_scaler = None
        self.stats = {}
        self.trained_at = None
        self.model_version = MODEL_VERSION
        
    def train(self, df: pd.DataFrame) -> None:
        """Train once at startup - NEVER during inference"""
        # Lazy import heavy libraries only when training
        from sklearn.preprocessing import StandardScaler, MinMaxScaler
        from sklearn.ensemble import IsolationForest
        
        self.use_autoencoder = False
        try:
            os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
            import tensorflow as tf
            from tensorflow.keras import layers, models
            tf.random.set_seed(RANDOM_SEED)
            tf.get_logger().setLevel('ERROR')
            self.use_autoencoder = True
            print("[INFO] TensorFlow available - Autoencoder enabled")
        except ImportError as e:
            print(f"[WARNING] TensorFlow not available: {e}. Autoencoder disabled.")
            self.use_autoencoder = False
        except Exception as e:
            print(f"[WARNING] TensorFlow initialization failed: {e}. Autoencoder disabled.")
            self.use_autoencoder = False
            
        self.trained_at = datetime.utcnow().isoformat() + "Z"
        df = df.copy()

        # Memory optimization: Sample large datasets
        original_size = len(df)
        if len(df) > 10000:
            print(f"[MEMORY OPT] Dataset has {len(df)} records, sampling 10000 for training")
            df = df.sample(n=10000, random_state=RANDOM_SEED)
        print(f"[TRAINING] Using {len(df)} records (original: {original_size})")

        # Preprocessing
        df["awarded_amt"] = df["awarded_amt"].astype(float)
        df["supplier_name"] = df["supplier_name"].fillna("UNKNOWN")
        df["agency"] = df["agency"].fillna("UNKNOWN")
        df["award_date"] = pd.to_datetime(df["award_date"], errors="coerce")
        df["log_amount"] = np.log1p(df["awarded_amt"])

        # Supplier statistics (vendor-centric fraud patterns)
        supplier_stats = df.groupby("supplier_name")["awarded_amt"].agg(["mean", "count"]).reset_index()
        supplier_stats.columns = ["supplier_name", "supplier_avg_amt", "supplier_contract_count"]
        df = df.merge(supplier_stats, on="supplier_name", how="left")

        # Agency statistics (agency-centric patterns)
        agency_stats = df.groupby("agency")["awarded_amt"].agg(["mean", "std", "count"]).reset_index()
        agency_stats.columns = ["agency", "agency_avg_amt", "agency_std", "agency_contract_count"]
        df = df.merge(agency_stats, on="agency", how="left")

        df["year"] = df["award_date"].dt.year
        df["month"] = df["award_date"].dt.month

        # Feature engineering
        features = [
            "awarded_amt", "log_amount",
            "supplier_avg_amt", "supplier_contract_count",
            "agency_avg_amt", "agency_contract_count",
            "year", "month"
        ]
        X = df[features].fillna(0)

        # Scaling (deterministic)
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        # Isolation Forest (anomaly detection)
        self.if_model = IsolationForest(
            n_estimators=300, 
            contamination=0.03, 
            random_state=RANDOM_SEED
        )
        self.if_model.fit(X_scaled)

        # Autoencoder (subtle anomaly detection - silent but powerful)
        if self.use_autoencoder:
            try:
                input_dim = X_scaled.shape[1]
                input_layer = layers.Input(shape=(input_dim,))
                encoded = layers.Dense(32, activation="relu", kernel_initializer=tf.keras.initializers.GlorotUniform(seed=RANDOM_SEED))(input_layer)
                encoded = layers.Dense(16, activation="relu", kernel_initializer=tf.keras.initializers.GlorotUniform(seed=RANDOM_SEED))(encoded)
                decoded = layers.Dense(32, activation="relu", kernel_initializer=tf.keras.initializers.GlorotUniform(seed=RANDOM_SEED))(encoded)
                decoded = layers.Dense(input_dim, kernel_initializer=tf.keras.initializers.GlorotUniform(seed=RANDOM_SEED))(decoded)

                self.ae_model = models.Model(input_layer, decoded)
                self.ae_model.compile(optimizer="adam", loss="mse")
                self.ae_model.fit(X_scaled, X_scaled, epochs=30, batch_size=64, shuffle=True, verbose=0)
                
                # Pre-calculate reconstruction errors for normalization
                recon = self.ae_model.predict(X_scaled, verbose=0)
                ae_score = np.mean(np.square(X_scaled - recon), axis=1)
            except Exception as e:
                print(f"[WARNING] Autoencoder training failed: {e}. Disabling.")
                self.use_autoencoder = False

        # Hybrid score normalization
        if_score = -self.if_model.score_samples(X_scaled)
        
        self.mm_scaler = MinMaxScaler()
        if self.use_autoencoder:
             self.mm_scaler.fit(np.vstack([if_score, ae_score]).T)
        else:
             self.mm_scaler.fit(if_score.reshape(-1, 1))

        # Global statistics
        self.stats["global_99th"] = df["awarded_amt"].quantile(0.99)
        self.stats["global_mean"] = df["awarded_amt"].mean()
        self.stats["agency_stats"] = agency_stats.set_index("agency").to_dict("index")
        self.stats["supplier_stats"] = supplier_stats.set_index("supplier_name").to_dict("index")

        print(f"[OK] Fraud Engine trained: {len(df)} records, {len(agency_stats)} agencies, {len(supplier_stats)} suppliers")

    def benford_check(self, amount: float) -> tuple:
        """Benford's Law analysis"""
        if amount < 10:
            return 0, None
        first_digit = int(str(int(amount))[0])
        if first_digit >= 8:
            return 15, f"First digit {first_digit} violates Benford's Law"
        return 0, None

    def time_check(self, transaction_time: Optional[str]) -> tuple:
        """Time-based anomaly detection"""
        if not transaction_time:
            return 0, None
        try:
            hour = int(transaction_time.split(":")[0])
            if hour < 6 or hour >= 22:
                return 20, "Transaction at unusual hours (10 PM - 6 AM)"
            if hour >= 18:
                return 10, "Transaction during late evening"
        except:
            pass
        return 0, None

    def predict(self, tx: Dict[str, Any]) -> Dict[str, Any]:
        """
        SINGLE DECISION AUTHORITY - deterministic fraud detection
        
        Returns:
            fraud_score: ML-based anomaly score (0.0 - 1.0)
            risk_score: Rule-based risk assessment (0 - 99)
            is_anomaly: Binary classification
            reasons: Transparent explanations
        """
        amount = tx["amount"]
        agency = tx["agency"]
        vendor = tx.get("vendor", "UNKNOWN")
        time = tx.get("transaction_time")

        # Feature vector construction
        agency_data = self.stats["agency_stats"].get(agency, {})
        agency_avg = agency_data.get("agency_avg_amt", 0)
        agency_std = agency_data.get("agency_std", 0)

        supplier_data = self.stats["supplier_stats"].get(vendor, {})
        supplier_avg = supplier_data.get("supplier_avg_amt", 0)
        supplier_count = supplier_data.get("supplier_contract_count", 0)

        X = np.array([[
            amount,
            np.log1p(amount),
            supplier_avg,
            supplier_count,
            agency_avg,
            0,  # agency_contract_count (not used in inference)
            2024,  # year
            1  # month
        ]])
        X_scaled = self.scaler.transform(X)

        # ===== FRAUD SCORE (ML Signal) =====
        if_score = -self.if_model.score_samples(X_scaled)[0]
        
        if self.use_autoencoder and self.ae_model:
            try:
                recon = self.ae_model.predict(X_scaled, verbose=0)[0]
                ae_score = np.mean(np.square(X_scaled[0] - recon))
                if_norm, ae_norm = self.mm_scaler.transform([[if_score, ae_score]])[0]
                fraud_score = 0.6 * if_norm + 0.4 * ae_norm  # Weighted hybrid
            except:
                # Fallback if prediction fails
                 fraud_score = self.mm_scaler.transform([[if_score]])[0][0]
        else:
             # Pure Isolation Forest score if Autoencoder disabled
             if hasattr(self.mm_scaler, 'n_features_in_') and self.mm_scaler.n_features_in_ == 2:
                  # If scaler was somehow fit with 2 dims but we only have 1 now (should handle in init)
                  # Re-fit scaler for 1 dim logic on the fly or just use raw normalization
                  fraud_score = (if_score - self.mm_scaler.data_min_[0]) / (self.mm_scaler.data_max_[0] - self.mm_scaler.data_min_[0])
             else:
                  fraud_score = self.mm_scaler.transform([[if_score]])[0][0]

        # Ensure valid range
        fraud_score = max(0.0, min(1.0, fraud_score))

        # ===== RISK SCORE (Human Judgment Layer) =====
        risk_score = 10
        reasons = []

        # Layer 1: Agency statistical outlier
        if agency_std and agency_std > 0:
            z = (amount - agency_avg) / agency_std
            if z > 3:
                risk_score += 40
                reasons.append(f"Amount is {z:.1f} std devs above {agency} average")

        # Layer 2: Supplier pattern deviation
        if supplier_avg > 0 and amount > supplier_avg * 3:
            risk_score += 25
            reasons.append(f"Amount 3x higher than {vendor} typical contracts")

        # Layer 3: Global extreme
        if amount > self.stats["global_99th"]:
            risk_score += 30
            reasons.append("Amount in global top 1%")

        # Layer 4: AI anomaly (Isolation Forest)
        if self.if_model.predict(X_scaled)[0] == -1:
            risk_score += 25
            reasons.append("AI detected unusual pattern (Isolation Forest)")

        # Layer 5: Autoencoder anomaly (silent but powerful)
        if self.use_autoencoder and 'ae_score' in locals() and ae_score > 0.5:  # High reconstruction error
            risk_score += 20
            reasons.append("Deep learning detected subtle anomaly (Autoencoder)")

        # Layer 6: Forensic heuristics
        if amount > 10000 and amount % 1000 == 0:
            risk_score += 15
            reasons.append("Suspiciously round amount")

        if amount > 5_000_000:
            risk_score += 10
            reasons.append("High value contract")

        # Layer 7: Benford's Law
        b_score, b_reason = self.benford_check(amount)
        if b_score:
            risk_score += b_score
            reasons.append(b_reason)

        # Layer 8: Time-based
        t_score, t_reason = self.time_check(time)
        if t_score:
            risk_score += t_score
            reasons.append(t_reason)

        # Enforce constraints
        risk_score = min(99, max(0, risk_score))
        fraud_score = round(float(fraud_score), 3)
        is_anomaly = risk_score > 70

        return {
            "fraud_score": fraud_score,  # ML signal
            "risk_score": int(risk_score),  # Human judgment
            "is_anomaly": is_anomaly,
            "reasons": reasons,
            "model_version": self.model_version,
            "trained_at": self.trained_at
        }
