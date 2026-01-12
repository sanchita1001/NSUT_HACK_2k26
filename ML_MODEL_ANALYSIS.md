# ML Model & Architecture Analysis

This document provides a comprehensive technical breakdown of the "Real" Machine Learning model and core functionality powering the Fraud Detection System.

## 1. Core Architecture: The Hybrid Engine using `FraudEngine`
**File:** `ml-service/fraud_engine.py`

 The system does not rely on a single algorithm. Instead, it uses a **Hybrid Defense Architecture** that combines unsupervised Machine Learning (for unknown anomalies) with expert rule-based systems (for known fraud patterns). This ensures both **high detection rates** and **human-verified explainability**.

### Layer 1: The Machine Learning "Brain" (Anomaly Detection)
This layer detects *unknown* patterns and subtle deviations that human auditors might miss. It is purely mathematical and unsupervised.

#### A. Isolation Forest (Sklearn)
*   **Purpose:** Efficiently identifies outliers in high-dimensional datasets.
*   **Logic:** Randomly partitions data/features. Anomalies are easier to isolate (require fewer splits) than normal data points.
*   **Configuration:**
    *   `n_estimators=300`: Uses 300 randomized decision trees for robustness.
    *   `contamination=0.03`: Assumes approximately 3% of the data might be anomalous during training.
*   **Input Features:** `awarded_amt`, `log_amount`, `supplier_avg_amt`, `supplier_contract_count`, `agency_avg_amt`, `year`, `month`.

#### B. Autoencoder Neural Network (TensorFlow/Keras)
*   **Purpose:** Deep Learning for detecting non-linear, subtle anomalies.
*   **Architecture:**
    *   **Encoder:** Compresses input data from 8 dimensions $\rightarrow$ 32 neurons $\rightarrow$ 16 neurons (bottleneck).
    *   **Decoder:** Reconstructs data from 16 neurons $\rightarrow$ 32 neurons $\rightarrow$ 8 dimensions.
*   **Detection Logic:** The network learns to compress and reconstruct *normal* transactions perfectly. When a fraudulent/anomalous transaction is fed in, the network fails to reconstruct it accurately.
*   **Metric:** **Reconstruction Error (`MSE`)**. High error = High likelihood of fraud.

**$\rightarrow$ Result:** The "Fraud Score" (0.0 - 1.0) is a weighted combination of the Isolation Forest score and the Autoencoder reconstruction error.

---

### Layer 2: The Expert Rules "Judge" (Risk Scoring)
This layer applies forensic accounting principles to catch *known* methods of procurement fraud. It generates a **Risk Score (0-100)**.

1.  **Statistical Outliers (Z-Score):** Flags if an amount is $>3$ standard deviations above the specific *Agency's* average.
2.  **Vendor Behavior Analysis:** Flags if a transaction is $>3x$ higher than the *Vendor's* typical contract history.
3.  **Global Extremes:** Flags amounts in the top 1% of all government spending.
4.  **Benford's Law:** Checks the frequency of leading digits (1-9). Fraudulent numbers often violate the natural distribution of leading digits (e.g., humans pick numbers starting with 5-9 too often).
5.  **Forensic Heuristics:**
    *   **Round Numbers:** Large amounts divisible by 1000 or 10000 (rare in real procurement).
    *   **Time-of-Day:** Transactions occurring between 10 PM and 6 AM.
6.  **Payment Frequency:** Checks if a vendor typically paid "Quarterly" is suddenly receiving "Daily" payments.

---

## 2. Service Layer & API
**File:** `ml-service/ml_model.py`

This file orchestrates the entire system using **FastAPI**. It acts as the "Body" that holds the "Brain".

*   **Initialization (`startup`):**
    *   Loads the historical dataset (`government-procurement-via-gebiz.csv`).
    *   Trains the `FraudEngine` immediately upon server start.
    *   Pre-calculates statistics for every known Agency and Vendor (mean, std dev) for instant lookup during prediction.
*   **Endpoint `/predict`:**
    *   Accepts a transaction.
    *   Passes it to the `FraudEngine`.
    *   Saves the result to `prediction_store.py` (simulating a database).
    *   **Governance:** Enforces "Single Decision Authority"—only this endpoint can decide fraud scores.
*   **Endpoint `/generate-profile`:**
    *   Does **not** re-run calculations.
    *   Retrieves the *stored* prediction.
    *   Passes the data to the LLM (Ollama) to write a human-readable report.

---

## 3. Explainable AI (XAI)
**File:** `ml-service/ollama_integration.py`

This file bridges the gap between raw numbers and human understanding.

*   **Model:** Uses **Meta Llama 3 (8B parameters)** running locally via Ollama.
*   **Technique:** Prompt Engineering.
*   **Process:**
    1.  Takes the hard numbers (e.g., "Risk Score: 85", "Reason: Violates Benford's Law").
    2.  Takes Vendor History (from database).
    3.  Injects them into a "Persona Prompt" (e.g., "You are a government fraud investigation assistant...").
    4.  **Result:** A professional, paragraph-style text explaining *why* the transaction was flagged, differentiating between the ML finding and the Rule violation.

---

## 4. File-by-File Breakdown

| File Name | Core Functionality |
| :--- | :--- |
| **`fraud_engine.py`** | **The Core Brain.** Contains the class `FraudEngine`. Implements Isolation Forest, Autoencoder, and all 9 rule-based checks. Handles training and prediction logic. |
| **`ml_model.py`** | **The API Server.** FastAPI application. Handles HTTP requests, manages the model lifecycle (startup/shutdown), and routes data between the frontend and the engine. |
| **`ollama_integration.py`** | **The Linguist.** Interface for Llama 3. Converts data into text summaries and handles the "Chat with Data" feature. |
| **`prediction_store.py`** | **The Memory.** A lightweight persistence layer (using JSONL files) to save predictions so they can be retrieved later for profiling or audit trails. |
| **`audit_logger.py`** | **The Black Box.** Logs every decision made by the AI for legal/compliance auditing. Ensures no decision is untraceable. |
| **`config.py`** | **Settings.** Central configuration for constants like `RANDOM_SEED` (ensures reproducibility) and `MODEL_VERSION`. |
| **`ML_Model.ipynb`** | **The Lab.** A Jupyter Notebook used for initial research, data exploration, and prototyping the algorithms before they were moved to `fraud_engine.py`. |

## 5. Benefits of This Implementation

1.  **Defense in Depth:** If the ML misses a new fraud type, the Hard Rules might catch it. If the Rules are bypassed (smart fraud), the ML (Autoencoder) detects the subtle statistical anomaly.
2.  **Explainability:** Unlike "Black Box" AI systems, this system provides:
    *   **Specific Reasons:** "Violates Benford's Law", "Time Mismatch".
    *   **AI Narratives:** Llama 3 explains the context clearly to non-technical officers.
3.  **Auditability:** Every prediction is logged with a version number and timestamp. The model is deterministic (seeded), meaning it gives the same result for the same input every time.
4.  **Performance:**
    *   Heavy training happens *once* at startup.
    *   Prediction is instant (using pre-calculated statistical lookup tables).
