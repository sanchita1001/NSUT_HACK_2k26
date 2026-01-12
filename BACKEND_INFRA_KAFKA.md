# Backend Infrastructure & Kafka Deep Dive

This document provides a technical deep dive into the backend infrastructure, focusing specifically on the **Event-Driven Architecture using Apache Kafka**.

## 1. Infrastructure Overview (Docker & Microservices)
The entire backend is orchestrated using **Docker Compose**, creating a self-contained private network (`pfms-net`).

### Services Map
| Service | Container Name | Internal Port | External Port | Function |
| :--- | :--- | :--- | :--- | :--- |
| **Zookeeper** | `zookeeper` | 2181 | - | Manages Kafka cluster state. |
| **Kafka Broker** | `broker` | 29092 | 9092 | The Event Bus. Handles message queues. |
| **Database** | `mongodb` | 27017 | 27017 | Persistent storage (NoSQL). |
| **API Gateway** | `api-gateway` | 4000 | 4000 | Main backend application (Node.js). |
| **ML Service** | `ml-service` | 8000 | 8000 | Python/FastAPI AI engine. |

---

## 2. Apache Kafka Implementation
**Apache Kafka** is used as a **Real-Time Event Notification Bus**. It decouples the core transaction processing from downstream systems (like analytics, third-party monitoring, or future SMS/Email services).

### A. Configuration
*   **Library:** `kafkajs` (Node.js client).
*   **Broker Version:** `confluentinc/cp-kafka:7.3.0`.
*   **Listeners:**
    *   `PLAINTEXT://localhost:9092`: For external access (e.g., developers debugging from their host machine).
    *   `PLAINTEXT_INTERNAL://broker:29092`: For internal Docker communication (used by `api-gateway`).

### B. The "Producer" (API Gateway)
The `AlertController` acts as a Kafka Producer.
*   **File:** `api-gateway/src/controllers/alert.controller.ts`
*   **Connection Logic:**
    *   On startup, it attempts to connect to the broker.
    *   It maintains a `isKafkaConnected` state flag to prevent server crashes if Kafka is down (Fail-safe design).

### C. The "Topic": `fraud-alerts`
The system publishes events to a single dedicated topic named **`fraud-alerts`**.

### D. The Payload (Message Structure)
Every time a **New Alert** is created (i.e., a transaction is flagged as risky), the following JSON message is broadcasted:

```json
{
  "alertId": "ALERT-1705048291234",
  "riskScore": 85,
  "riskLevel": "Critical",
  "amount": 500000,
  "vendor": "ABC Construction",
  "timestamp": "2024-01-12T03:15:00.000Z"
}
```

### E. Code Walkthrough
**Location:** `api-gateway/src/controllers/alert.controller.ts` (Line 411)

```typescript
// 1. Check connection
if (isKafkaConnected) {
    try {
        // 2. Send message to 'fraud-alerts' topic
        await producer.send({
            topic: 'fraud-alerts',
            messages: [{
                value: JSON.stringify({
                    alertId: newAlert.id,
                    riskScore: mlResult.riskScore, 
                    // ... other fields
                })
            }]
        });
    } catch (kafkaErr) {
        // 3. Graceful error handling (App continues even if Kafka fails)
        console.warn("Kafka send failed:", kafkaErr);
    }
}
```

---

## 3. Why Use Kafka? (Architectural Benefits)
1.  **Decoupling:** The `AlertController` doesn't need to know *who* is listening. It just shouts "Fraud Detected!" (publishes the message) and moves on.
2.  **Scalability:**
    *   You could attach a **Notification Microservice** that listens to `fraud-alerts` to send SMS to officers.
    *   You could attach a **Real-Time Dashboard** (WebSocket server) that consumes these events to update the admin UI instantly.
    *   You could attach a **Data Lake** consumer to archive high-risk events for long-term storage.
    *   *All of this can happen without changing a single line of code in the `api-gateway`.*
3.  **Reliability:** Kafka stores messages. If the "SMS Service" is down, Kafka holds the messages until it comes back online, ensuring no alerts are lost.

## 4. Current Status
*   **Enabled:** Yes.
*   **Producer:** Active (`api-gateway`).
*   **Consumers:** Currently, there are no *active* consumer services defined in the code. The system is **Broadcasting** events, ready for future services to subscribe.
