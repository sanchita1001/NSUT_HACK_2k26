# Public Fraud & Anomaly Detection System (PFMS-Enhanced)

## 📖 Executive Summary
The **Public Fraud & Anomaly Detection System** is a next-generation enterprise application designed to monitor, analyze, and detect fraudulent activities in government procurement and welfare distribution schemes. 

This system leverages a **Microservices Architecture** to integrate real-time transaction monitoring, an **AI-driven Anomaly Detection Engine**, and **Event-Driven Messaging** via Kafka. It provides a comprehensive dashboard for officials to visualize financial flows, identify high-risk vendors, and conduct forensic simulations.

## 🏗 System Architecture

The application is built on a modern, scalable stack:

- **Frontend**: Next.js 14 (React) with TypeScript & Tailwind CSS for a responsive, high-performance UI.
- **API Gateway**: Node.js/Express acting as the central orchestrator, managing authentication, request routing, and database interactions.
- **ML Engine**: Python (FastAPI) service running an **Isolation Forest** algorithms for unsupervised anomaly detection.
- **Database**: MongoDB (NoSQL) for flexible storage of Schemes, Vendors, and flexible Audit Logs.
- **Event Bus**: Apache Kafka for asynchronous communication between the Transaction Processor and the ML Inference Engine.
- **Infrastructure**: Docker for containerized deployment of Kafka services.

## 📂 Project Structure & File Guide

This repository functions as a **Monorepo**, housing multiple services in a single codebase. Below is a detailed explanation of each component and its critical files.

### 1. Root Directory
- **`package.json`**: The root configuration file. It manages the workspace (monorepo) structure and defines global scripts.
  - `npm run dev`: The master command that concurrently starts the Client, API Gateway, ML Service, and Kafka containers.
- **`docker-compose.yml`**: Infrastructure-as-Code definition. It defines the Docker services for **Zookeeper** and **Kafka**.
- **`start_ml.bat`**: A utility script for Windows environments to bootstrap the Python ML service.

### 2. Client Service (`/client`)
Built with **Next.js**, serving as the presentation layer.

- **`src/app/`**: The App Router directory containing page routes.
  - **`page.tsx`**: The landing/login page.
  - **`dashboard/layout.tsx`**: Defines the persistent layout (Sidebar, Header, Chatbot) for authenticated users.
  - **`dashboard/simulator/page.tsx`**: The "Red Team" tool allows users to inject synthetic transaction data to test the system's response.
  - **`dashboard/network/page.tsx`**: Renders the Dynamic Link Analysis Graph using React Flow.
  - **`dashboard/schemes/page.tsx`**: Scheme Registry with CRUD functionality for managing government schemes.
  - **`dashboard/vendors/page.tsx`**: Vendor Intelligence module with search and risk profiling.
- **`src/components/`**: Reusable UI components.
  - **`SahayakBot.tsx`**: The "PFMS Sahayak" AI chatbot widget that provides natural language assistance.
  - **`layout/Sidebar.tsx`**: The main navigation testing harness.

### 3. API Gateway (`/api-gateway`)
The Backend-for-Frontend (BFF) built with **Express.js**.

- **`src/index.ts`**: The application entry point. It initializes the Express server, connects to MongoDB, sets up the Kafka Producer, and defines all REST API endpoints.
- **`src/models/index.ts`**: Mongoose schema definitions (ORM) for:
  - `Scheme`: Government scheme metadata and budgets.
  - `Vendor`: Entity profiles including calculated risk scores.
  - `Alert`: Generated fraud alerts linked to specific transactions.
  - `AuditLog`: Immutable record of all system actions for compliance.

### 4. ML Service (`/ml-service`)
The Intelligence Layer built with **Python & FastAPI**.

- **`service.py`**: The core application logic.
  - **Startup**: Loads historical procurement data (`government-procurement-via-gebiz.csv`), encodes categorical features (Agency names), and trains the Isolation Forest model.
  - **`/predict` Endpoint**: Accepts transaction details, runs them through the trained model, applies forensic heuristics (e.g., Benford's Law checks), and returns a Risk Score (0-100).
- **`requirements.txt`**: List of Python dependencies (pandas, scikit-learn, fastapi, uvicorn).
- **`government-procurement-via-gebiz.csv`**: The training dataset containing historical procurement records used to establish baseline "normal" behavior.

### 5. Common Library (`/common`)
- **`src/index.ts`**: Shared TypeScript interfaces/types (DTOs) used by both the Client and API Gateway to ensure type safety across the network boundary.

## � Quick Start Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Docker Desktop (Optional, for full Kafka support)

### Installation
1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
    This command installs packages for the root, client, and api-gateway workspaces.

### Launching the Application
Execute the unified development command:

```bash
npm run dev
```

This single command performs the following actions in parallel:
1.  Starts **Next.js Frontend** at `http://localhost:3000`.
2.  Starts **API Gateway** at `http://localhost:8000`.
3.  Launches the **ML Python Service** at `http://localhost:5000` (automatically installing dependencies if needed).
4.  Spins up **Kafka/Zookeeper** via Docker (if available) at `localhost:9092`.

*Note: The system includes resilience logic. If Docker is not running, the API Gateway will log a warning and fallback to a direct HTTP-to-ML connection mode, bypassing the Event Bus.*

## 🛡️ Security & Compliance
- **Audit Logging**: Every write operation (Create/Update/Simulate) creates a cryptographically-linkable audit log entry.
- **Context-Aware Analysis**: The ML model respects agency-specific spending patterns to reduce false positives.
- **Forensic Validation**: Implements deterministic checks for suspicious "round number" transfers.

---
