# 📡 API ENDPOINT DOCUMENTATION

## Base URL
```
http://localhost:5000/api/v1  (production should use versioned endpoints)
```

---

## 🔐 **Authentication Endpoints**

### POST `/auth/login`
Login with credentials
```
Method: POST
URL: /api/auth/login
Body: {
  "email": "admin@dairyfarm.com",
  "password": "yourpassword"
}

Success Response (200):
{
  "success": true,
  "token": "admin-auth-token",
  "message": "Login successful"
}

Error Response (401):
{
  "success": false,
  "message": "Invalid email or password"
}
```

### POST `/auth/logout`
Logout user
```
Method: POST
URL: /api/auth/logout

Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET `/health`
Health check
```
Method: GET
URL: /api/health

Response (200):
{
  "status": "ok",
  "timestamp": "2024-03-20T10:30:45.123Z"
}
```

---

## 👥 **Client Endpoints**

### GET `/clients`
Get all clients with pagination
```
Method: GET
URL: /api/clients?page=1&limit=10
Headers: Authorization: Bearer {token}

Query Parameters:
  - page (default: 1)
  - limit (default: 10)

Success Response (200):
{
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Raj Kumar",
      "phone": "9876543210",
      "address": "Main Street",
      "createdAt": "2024-03-20T10:30:45Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}

Error Response (500):
{
  "error": "Failed to fetch clients",
  "details": "Database connection error"
}
```

### GET `/clients/:id`
Get single client
```
Method: GET
URL: /api/clients/507f1f77bcf86cd799439011

Response (200): { client object }
Response (404): { "error": "Client not found" }
```

### POST `/clients`
Create new client
```
Method: POST
URL: /api/clients
Body: {
  "name": "New Client",
  "phone": "9876543210",
  "address": "Optional address"
}

Validation:
  - name: required, min 2 chars
  - phone: required, 10 digits
  - address: optional

Response (201): { created client }

Response (400):
{
  "error": "Client name must be at least 2 characters"
}
```

### PUT `/clients/:id`
Update client
```
Method: PUT
URL: /api/clients/507f1f77bcf86cd799439011
Body: {
  "name": "Updated Name",
  "phone": "9876543210"
}

Response (200): { updated client }
Response (404): { "error": "Client not found" }
```

### DELETE `/clients/:id`
Delete client
```
Method: DELETE
URL: /api/clients/507f1f77bcf86cd799439011

Response (200): { "success": true, "message": "Client deleted" }
Response (404): { "error": "Client not found" }
```

---

## 🥛 **Milk Entry Endpoints**

### GET `/milk`
Get all milk entries with pagination
```
Method: GET
URL: /api/milk?page=1&limit=20&clientId=optional
Headers: Authorization: Bearer {token}

Query Parameters:
  - page (default: 1)
  - limit (default: 20)
  - clientId (optional: filter by client)

Response (200):
{
  "data": [
    {
      "id": "507f1f77bcf86cd799439012",
      "clientId": "507f1f77bcf86cd799439011",
      "litres": 10.5,
      "fat": 3.5,
      "snf": 8.0,
      "rate": 50,
      "total": 525,
      "type": "Standard",
      "shift": "morning",
      "createdAt": "2024-03-20T10:30:45Z",
      "client": {
        "name": "Raj Kumar",
        "phone": "9876543210"
      }
    }
  ],
  "pagination": { ... }
}
```

### POST `/milk`
Create milk entry
```
Method: POST
URL: /api/milk
Body: {
  "clientId": "507f1f77bcf86cd799439011",
  "type": "Standard",
  "litres": 10.5,
  "fat": 3.5,
  "snf": 8.0,
  "rate": 50,
  "shift": "morning"
}

Validation:
  - clientId: required, must exist
  - litres: > 0
  - fat: 0-8
  - snf: 0-10
  - rate: > 0

Response (201): { created entry }

Response (400):
{
  "error": "Litres must be greater than 0"
}
```

### DELETE `/milk/:id`
Delete milk entry
```
Method: DELETE
URL: /api/milk/507f1f77bcf86cd799439012

Response (200): { "success": true, "message": "Entry deleted" }
Response (404): { "error": "Milk entry not found" }
```

---

## 📋 **Settlement Endpoints**

### GET `/settlements`
Get all settlements
```
Method: GET
URL: /api/settlements?page=1&limit=10

Response includes pagination with settlement list
```

### GET `/settlements/client/:clientId`
Get settlements for specific client
```
Method: GET
URL: /api/settlements/client/507f1f77bcf86cd799439011

Returns: [{ settlement objects }]
```

### POST `/settlements`
Create settlement
```
Method: POST
URL: /api/settlements
Body: {
  "clientId": "507f1f77bcf86cd799439011",
  "startDate": "2024-03-01",
  "endDate": "2024-03-10",
  "totalLitres": 150,
  "totalAmount": 7500
}

Validation:
  - clientId: required, must exist
  - startDate: required
  - endDate: required, must be after startDate
  - totalLitres: >= 0
  - totalAmount: >= 0

Response (201): { created settlement }
```

### PUT `/settlements/:id`
Update settlement status
```
Method: PUT
URL: /api/settlements/507f1f77bcf86cd799439013
Body: {
  "status": "completed"
}

Allowed statuses: pending, completed, cancelled
```

---

## 💳 **Payment Endpoints**

### GET `/payments`
Get all payments
```
Method: GET
URL: /api/payments?page=1&limit=20

Returns paginated list of payments
```

### GET `/payments/client/:clientId`
Get payments for client
```
Method: GET
URL: /api/payments/client/507f1f77bcf86cd799439011

Returns: [{ payment objects }]
```

### POST `/payments`
Create payment
```
Method: POST
URL: /api/payments
Body: {
  "clientId": "507f1f77bcf86cd799439011",
  "settlementId": "optional",
  "amount": 5000,
  "type": "settlement_payment",
  "date": "2024-03-20",
  "notes": "Payment received"
}

Validation:
  - clientId: required
  - amount: > 0
  - type: required (enum)
  - date: required

Valid types:
  - settlement_payment
  - advance_given
  - advance_repaid
  - adjustment

Response (201): { created payment }
```

### GET `/payments/summary/:clientId`
Get payment summary for client
```
Method: GET
URL: /api/payments/summary/507f1f77bcf86cd799439011

Response (200):
{
  "totalPayments": 15,
  "totalPaid": 50000,
  "netBalance": -3000
}
```

---

## 💰 **Advance Endpoints**

### GET `/advances`
Get all advances
```
Method: GET
URL: /api/advances?page=1&limit=10

Returns paginated list with client details
```

### GET `/advances/client/:clientId`
Get advances for client
```
Method: GET
URL: /api/advances/client/507f1f77bcf86cd799439011

Returns: [{ advance objects }]
```

### POST `/advances`
Give advance to client
```
Method: POST
URL: /api/advances
Body: {
  "clientId": "507f1f77bcf86cd799439011",
  "amount": 5000,
  "date": "2024-03-20",
  "purpose": "Feed costs"
}

Validation:
  - clientId: required
  - amount: > 0
  - date: required

Response (201): { created advance }
```

### PUT `/advances/:id`
Update advance status
```
Method: PUT
URL: /api/advances/507f1f77bcf86cd799439014
Body: {
  "status": "completed"
}

Allowed statuses: active, completed, cancelled
```

---

## 🛒 **Consumer Endpoints**

### GET `/consumers`
List all consumers
```
Method: GET
URL: /api/consumers?page=1&limit=10
Response: Paginated consumer list
```

### POST `/consumers`
Create consumer
```
Method: POST
URL: /api/consumers
Body: {
  "name": "Retail Shop",
  "phone": "9876543210",
  "address": "Market Street",
  "type": "regular",
  "credit_limit": 10000
}

Consumer types: regular, wholesale, restaurant, dairy
```

---

## 🥛 **Consumer Sales Endpoints**

### GET `/consumer-sales`
Get consumer sales
```
Method: GET
URL: /api/consumer-sales?page=1&limit=20&consumerId=optional
Response: Paginated sales list with consumer details
```

### POST `/consumer-sales`
Create consumer sale
```
Method: POST
URL: /api/consumer-sales
Body: {
  "consumerId": "507f1f77bcf86cd799439015",
  "type": "milk",
  "litres": 10,
  "rate": 50,
  "payment_status": "pending"
}

Product types: milk, ghee, paneer, curd, other
Payment status: pending, paid, partial, cancelled
```

---

## 💵 **Consumer Payment Endpoints**

### GET `/consumer-payments`
Get all consumer payments
```
Method: GET
URL: /api/consumer-payments?page=1&limit=20
Response: Paginated payment list
```

### POST `/consumer-payments`
Record consumer payment
```
Method: POST
URL: /api/consumer-payments
Body: {
  "consumerId": "507f1f77bcf86cd799439015",
  "amount": 500,
  "date": "2024-03-20",
  "payment_method": "cash",
  "notes": "Partial payment"
}

Payment methods: cash, check, transfer, online, credit
```

---

## 📦 **Inventory Endpoints**

### GET `/inventory`
Get inventory records
```
Method: GET
URL: /api/inventory?page=1&date=2024-03-20
Response: Paginated inventory list
```

### POST `/inventory`
Create inventory record
```
Method: POST
URL: /api/inventory
Body: {
  "type": "cow_milk",
  "opening_stock": 100,
  "received": 50,
  "sold": 30,
  "date": "2024-03-20"
}

Inventory types: cow_milk, buffalo_milk, ghee, paneer
Note: closing_stock calculated automatically
```

---

## 🔄 **Response Format Standards**

### Success Response
```json
{
  "id": "...",
  "data": ...,
  "message": "Operation successful",
  "timestamp": "2024-03-20T10:30:45Z"
}
```

### Pagination Response
```json
{
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Detailed explanation",
  "code": "ERROR_CODE"
}
```

---

## 🚨 **HTTP Status Codes**

- **200 OK** - Request successful
- **201 Created** - Resource created successfully
- **400 Bad Request** - Validation error or invalid input
- **401 Unauthorized** - Authentication required
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error
- **503 Service Unavailable** - Server temporarily down

---

## 🔑 **Common Error Messages**

| Error | Cause | Solution |
|-------|-------|----------|
| "Client not found" | Invalid clientId | Use existing client ID |
| "Phone must be a valid 10-digit number" | Invalid phone | Enter 10 digits |
| "Amount must be greater than 0" | Zero/negative amount | Enter positive value |
| "End date must be after start date" | Invalid date range | Fix date order |
| "clientId is required" | Missing field | Include clientId in request |

---

**Version:** 1.0
**Last Updated:** March 20, 2026
**Maintained By:** Development Team
