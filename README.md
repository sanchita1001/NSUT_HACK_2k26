# Public Fraud & Anomaly Detection System (PFMS Intelligence)

A government-grade, production-ready web platform for monitoring financial transactions and surfacing early risk patterns. Built with strict auditability, role-based access control (RBAC), and officer discretion principles.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+ (for ML Service)
- Kafka (Optional for Dev, Mocked by default)

## Quick Start 🚀

The entire system (Frontend, Backend, ML Engine, Kafka) can be launched with **one command**:

```bash
npm run dev
```

This will concurrently start:
1.  **Client (Next.js)**: `http://localhost:3000`
2.  **API Gateway**: `http://localhost:8000`
3.  **ML Engine (Python)**: `http://localhost:5000`
4.  **Kafka (Docker)**: `localhost:9092` (Requires Docker Desktop)

*Note: If you don't have Docker, the system will automatically fall back to HTTP-only mode for resilience.*

## 🏗 System Architecture

### 1. Client (`/client`)
- **Tech**: Next.js 14 (App Router), TypeScript, Tailwind CSS.
- **Key Features**:
  - **Auth**: Mock JWT-based secure login (Officer/Supervisor/Admin).
  - **Dashboard**: Role-persistent layouts (Sidebar/Header).
  - **Investigation**: "Hero" Alert Detail page with Transaction Lifecycle visualization.
  - **Styles**: High-contrast "Government" aesthetic (No neon/gradients).

### 2. API Gateway (`/api-gateway`)
- **Tech**: Node.js, Express, TypeScript.
- **Key Features**:
  - **RBAC Middleware**: Enforces role boundaries on routes.
  - **Aggregator**: Consumes ML signals and serves standardized alerts.
  - **Mock Data**: Currently mocking Kafka/DB for prototype speed.

### 3. Shared (`/common`)
- **Tech**: TypeScript Shared Library.
- **Purpose**: Shares Types (UserRole, Alert, Transaction) between Frontend and Backend to ensure contract safety.

## 🔐 Default Access Credentials (Mock)

Select the role from the Login Dropdown. No password required for prototype mode.

- **Officer**: Standard investigation access.
- **Supervisor**: Access to approvals/reviews.
- **Admin**: System configuration (No transaction data visibility).

## 🛠 Project Structure

```
root/
├── client/          # Next.js Frontend
├── api-gateway/     # Node.js Backend Entry
├── ml-service/      # Python Analysis Engine
├── common/          # Shared Types
└── package.json     # Workspaces Config
```

## 📜 Compliance & Security
- **Disclaimer**: Every page contains the mandatory "Decision Support Only" legal disclaimer.
- **Audit**: All actions are designed to be logged (UI implemented, backend logs pending DB connection).
- **Privacy**: PII is masked by default in the architecture.

## 🧪 Development Status
- [x] **Core UI**: Completed (Dashboard, Alerts, Details).
- [x] **Auth Flow**: Completed (Context + Middleware).
- [x] **API Integration**: Completed (Live fetch from Gateway).
- [ ] **ML Connection**: Python service stubbed.
- [ ] **Database**: Running in-memory mock.
