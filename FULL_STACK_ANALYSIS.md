# Full Stack Architecture Analysis

This document outlines the complete technology stack powering the Sahayak PFMS Fraud Detection System, divided into Frontend, Backend, and Infrastructure.

## 1. High-Level Architecture
The system follows a **Microservices-based Architecture**:
*   **Client:** A modern, responsive web application (Next.js).
*   **API Gateway:** A central Node.js/Express server that manages authentication, routes requests, and handles business logic.
*   **ML Service:** A specialized Python service for heavy data processing and AI (analyzed in `ML_MODEL_ANALYSIS.md`).
*   **Database:** MongoDB for persistent storage of users, transactions, and audit logs.
*   **Communication:** REST APIs for synchronous tasks.

---

## 2. Frontend Layer (The "Face")
**Location:** `client/` directory

The frontend is built for **speed, interactivity, and visualization**.

### Core Technologies:
*   **Framework:** [Next.js 16](https://nextjs.org/) (React Framework).
    *   Uses **Server-Side Rendering (SSR)** for dashboard performance.
    *   Uses **Client-Side Rendering (CSR)** for interactive graphs and maps.
*   **Language:** TypeScript (for type safety and reducing bugs).
*   **Styling:** [Tailwind CSS 4](https://tailwindcss.com/).
    *   Utility-first CSS for rapid UI development.
    *   Modern, clean, and responsive design.

### Key Libraries:
*   **Visualization:**
    *   `recharts`: For bar charts, line graphs, and pie charts (dashboard stats).
    *   `react-force-graph-2d`: For the interactive **Money Trail Network Graph**.
    *   `react-leaflet` + `leaflet.heat`: For **Geospatial Heatmaps** of vendor locations.
    *   `reactflow`: For node-based workflow or relationship diagrams.
*   **Icons:** `lucide-react` (Clean, standardized icon set).
*   **State/Data Fetching:** `axios` for API calls.

---

## 3. Backend Layer (The "Backbone")
**Location:** `api-gateway/` directory

The API Gateway acts as the orchestrator. It ensures security and data integrity before anything reaches the database or the AI model.

### Core Technologies:
*   **Runtime:** Node.js.
*   **Framework:** Express.js (Fast, unopinionated web framework).
*   **Language:** TypeScript.

### Key Modules:
*   **Security:**
    *   `helmet`: Sets secure HTTP headers to prevent attacks like XSS and Clickjacking.
    *   `express-mongo-sanitize`: Prevents NoSQL Injection attacks.
    *   `cors`: Manages Cross-Origin Resource Sharing.
    *   `jsonwebtoken`: For secure, stateless User Authentication (JWT).
    *   `bcryptjs`: For hashing user passwords (never stored in plain text).
*   **Data Validation:**
    *   `zod`: Strong schema validation. Ensures that incoming data (e.g., a new transaction) matches the expected format *exactly* before processing.
*   **Communication:**
    *   `kafkajs`: (Present in dependencies) Suggests capability for event-driven architecture/message queuing (Apache Kafka).
    *   `axios`: For talking to the internal ML Service.
    *   `nodemailer`: For sending email alerts (OTP, fraud notifications).
*   **Database Interface:**
    *   `mongoose`: Object Data Modeling (ODM) library for MongoDB.

---

## 4. Shared Utilities
**Location:** `common/` directory (referenced as `@fds/common`)

*   This enables code reuse between the Backend and Frontend (and potentially other services).
*   Likely contains shared **TypeScript Interfaces**, **Constants**, and **Utility Functions** to keep the codebase DRY (Don't Repeat Yourself).

---

## 5. Infrastructure & Deployment
*   **Docker:** Both `client`, `api-gateway`, and `ml-service` have `Dockerfile`s, meaning the entire stack is containerized.
*   **Docker Compose:** `docker-compose.yml` orchestrates all these containers to run them together with a single command.

---

## Summary of Data Flow
1.  **User** interacts with the **Next.js Client**.
2.  **Client** sends a secured request (with JWT) to the **API Gateway**.
3.  **API Gateway**:
    *   Validates the user token.
    *   Validates the input data (Zod).
    *   *If normal data:* Saves/Retrieves from **MongoDB**.
    *   *If fraud check:* Forwards data to the **ML Service**.
4.  **ML Service** processes the data and returns a Risk Score.
5.  **API Gateway** logs the result and sends it back to the **Client** for display.
