# AutoTrack API Documentation

Base URL: `http://localhost:5001/api`

---

## 1. System Health
- **GET** `/api/health`
  - Validates active server health and real MySQL connection via `ping()` and `SELECT 1 + 1`.
  - **Status 200 OK**:
    ```json
    {
      "status": "UP",
      "database": "CONNECTED",
      "timestamp": "2026-10-18T19:09:45.738Z",
      "details": "Database connection verified"
    }
    ```
  - **Status 503 Service Unavailable** (when MySQL is unreachable or degraded):
    ```json
    {
      "status": "DEGRADED",
      "database": "DISCONNECTED",
      "timestamp": "2026-10-18T19:01:15.471Z",
      "error": "Connection error details"
    }
    ```

---

## 2. Production Lines API (`/api/lines`)

Plant manufacturing and assembly lines information.

### A. List Production Lines
- **Endpoint**: `GET /api/lines`
- **Query Parameters**:
  - `factoryId` or `factory_id` (optional positive integer)
  - `status` (optional `'RUNNING'` | `'MAINTENANCE'` | `'STOPPED'`, case-insensitive)
- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "line_id": 1,
        "factory_id": 1,
        "factory_name": "Chennai Assembly Plant",
        "factory_location": "Chennai, India",
        "name": "Assembly Line A",
        "status": "RUNNING",
        "created_at": "2026-10-18 21:19:13"
      }
    ],
    "total": 6
  }
  ```

### B. Get Production Line by ID
- **Endpoint**: `GET /api/lines/:id`
- **Response (200 OK)**: Single production line object with joined factory details.
- **Error Responses**:
  - `400 Bad Request`: Non-numeric ID.
  - `404 Not Found`: Line ID does not exist.

---

## 3. Dashboard API (`/api/dashboard`)

Real-time aggregated manufacturing analytics and date-wise trends.

### A. Summary Metrics
- **Endpoint**: `GET /api/dashboard/summary`
- **Query Parameters**:
  - `from` or `startDate` (optional `YYYY-MM-DD`)
  - `to` or `endDate` (optional `YYYY-MM-DD`)
  - `lineId` (optional positive integer)
- **Calculation Details**:
  - `target_achievement_percentage`: $(\text{total\_produced} / \text{total\_target}) \times 100$
  - `defect_rate_percentage`: $(\text{total\_defects} / (\text{total\_produced} + \text{total\_defects})) \times 100$
  - `yield_percentage`: $(\text{total\_produced} / (\text{total\_produced} + \text{total\_defects})) \times 100$
- **Response (200 OK)**:
  ```json
  {
    "total_produced": 2390,
    "total_target": 2550,
    "target_achievement_percentage": 93.73,
    "total_defects": 71,
    "defect_rate_percentage": 2.89,
    "yield_percentage": 97.11,
    "total_downtime_minutes": 190,
    "total_records": 7,
    "active_quality_issues": 4,
    "lines_breakdown": {
      "total": 6,
      "running": 4,
      "maintenance": 1,
      "stopped": 1
    }
  }
  ```

### B. Production & Target Trends
- **Endpoint**: `GET /api/dashboard/trends`
- **Query Parameters**:
  - `from` or `startDate` (optional `YYYY-MM-DD`)
  - `to` or `endDate` (optional `YYYY-MM-DD`)
  - *Validation*: `from` must be $\le$ `to`.
- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "date": "2026-10-15",
        "target": 2550,
        "produced": 2390,
        "defects": 71,
        "downtime_minutes": 190,
        "achievement_rate": 93.73
      }
    ],
    "total": 1
  }
  ```

---

## 4. Production Records API (`/api/production`)

Shift logs and throughput records.

### A. List Production Records
- **Endpoint**: `GET /api/production`
- **Query Parameters**: `page`, `limit`, `startDate`, `endDate`, `lineId`, `shift`
- **Response (200 OK)**: Paginated production records enriched with `achievement_rate`, `scrap_rate`, and `yield_rate`.

### B. Get Production Record by ID
- **Endpoint**: `GET /api/production/:id`
- **Response (200 OK)**: Single production record.

### C. Create Production Record
- **Endpoint**: `POST /api/production`
- **Request Body**:
  ```json
  {
    "line_id": 1,
    "production_date": "2026-10-19",
    "shift": "MORNING",
    "target_quantity": 360,
    "produced_quantity": 350,
    "defect_count": 4,
    "downtime_minutes": 10
  }
  ```
- **Response (201 Created)**: Created record object.

### D. Update Production Record
- **Endpoint**: `PUT /api/production/:id`
- **Response (200 OK)**: Updated record object.

### E. Delete Production Record
- **Endpoint**: `DELETE /api/production/:id`
- **Response (200 OK)**: Confirmation of deletion.
- **Error (409 Conflict)**: Rejects deletion if child records in `quality_issues` reference this record.

---

## 5. Quality Issues API (`/api/quality-issues`)

Inspection defect logs and status workflow.

### A. List Quality Issues
- **Endpoint**: `GET /api/quality-issues`
- **Query Parameters**:
  - `status` (`'OPEN'`, `'IN_REVIEW'`, `'RESOLVED'`, case-insensitive)
  - `severity` (`'LOW'`, `'MEDIUM'`, `'HIGH'`, `'CRITICAL'`, case-insensitive)
  - `category` (`'PAINT'`, `'WELD'`, `'ASSEMBLY'`, `'ELECTRICAL'`, `'ALIGNMENT'`, `'TRIM'`, `'OTHER'`, case-insensitive)
  - `from` / `startDate` (`YYYY-MM-DD`)
  - `to` / `endDate` (`YYYY-MM-DD`)
  - `lineId` (positive integer)
  - `page` (positive integer, default `1`)
  - `limit` (integer $1-100$, default `10`)
- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "issue_id": 3,
        "record_id": 3,
        "line_id": 2,
        "line_name": "Paint Line A",
        "factory_id": 1,
        "factory_name": "Chennai Assembly Plant",
        "production_date": "2026-10-15",
        "shift": "MORNING",
        "category": "WELD",
        "severity": "CRITICAL",
        "status": "OPEN",
        "description": "Weld joint requires immediate reinspection",
        "created_at": "2026-10-18 21:19:29",
        "updated_at": "2026-10-18 21:19:29"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 4,
      "totalPages": 1
    }
  }
  ```

### B. Get Quality Issue by ID
- **Endpoint**: `GET /api/quality-issues/:id`
- **Response (200 OK)**: Single quality issue object with joined line and factory information.
- **Error Responses**:
  - `400 Bad Request`: Non-numeric ID.
  - `404 Not Found`: Issue does not exist.

### C. Update Quality Issue Status
- **Endpoint**: `PATCH /api/quality-issues/:id/status`
- **Request Body**:
  ```json
  {
    "status": "RESOLVED"
  }
  ```
  *(Supported values: `'OPEN'`, `'IN_REVIEW'`, `'RESOLVED'`, case-insensitive).*
- **Response (200 OK)**:
  ```json
  {
    "issue_id": 1,
    "record_id": 1,
    "line_id": 1,
    "line_name": "Assembly Line A",
    "factory_id": 1,
    "factory_name": "Chennai Assembly Plant",
    "production_date": "2026-10-15",
    "shift": "MORNING",
    "category": "ASSEMBLY",
    "severity": "MEDIUM",
    "status": "RESOLVED",
    "description": "Fastener alignment requires inspection",
    "created_at": "2026-10-18 21:19:29",
    "updated_at": "2026-10-19 01:00:51"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid status value.
  - `404 Not Found`: Issue ID not found.
