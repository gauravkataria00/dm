# Dairy Management System

A comprehensive web application for managing dairy farm operations, including client management, milk entry tracking, and financial reporting.

## Features

- **Client Management**: Add, view, and manage dairy farm clients
- **Milk Entry Tracking**: Record milk deliveries with quality parameters (FAT, SNF)
- **Real-time Dashboard**: View daily statistics and quick actions
- **Ledger View**: Comprehensive table of all milk entries with customer details
- **Settlement Management**: Create and manage 10-day settlement cycles
- **Payment Tracking**: Record and track all payments, advances, and outstanding balances
- **Advance Management**: Give advances to clients and track repayment status
- **Financial Reports**: View client payment summaries and outstanding amounts
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Backend
- **Node.js** with Express.js
- **SQLite** database for data persistence
- **CORS** enabled for cross-origin requests

### Frontend
- **React** with Vite for fast development
- **Tailwind CSS** for modern, responsive styling
- **React Router** for client-side navigation
- **Context API** for state management

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dairy-project
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   npm start
   ```
   The server will start on `http://localhost:3000`

3. **Setup Frontend** (in a new terminal)
   ```bash
   cd webapp
   npm install
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

## API Endpoints

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Add new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Milk Entries
- `GET /api/milk` - Get all milk entries with client names
- `POST /api/milk` - Add new milk entry

### Settlements
- `GET /api/settlements` - Get all settlements
- `GET /api/settlements/client/:clientId` - Get settlements for specific client
- `POST /api/settlements` - Create new settlement
- `PUT /api/settlements/:id` - Update settlement status

### Payments
- `GET /api/payments` - Get all payments
- `GET /api/payments/client/:clientId` - Get payments for specific client
- `POST /api/payments` - Record new payment
- `GET /api/payments/summary/:clientId` - Get client payment summary

### Advances
- `GET /api/advances` - Get all advances
- `GET /api/advances/client/:clientId` - Get advances for specific client
- `POST /api/advances` - Give new advance
- `PUT /api/advances/:id` - Update advance status

## Database Schema

### Clients Table
```sql
CREATE TABLE clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Milk Entries Table
```sql
CREATE TABLE milk_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clientId INTEGER NOT NULL,
  type TEXT NOT NULL,
  litres REAL NOT NULL,
  fat REAL,
  snf REAL,
  rate REAL NOT NULL,
  total REAL NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES clients (id)
);
```

### Settlements Table
```sql
CREATE TABLE settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clientId INTEGER NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE NOT NULL,
  totalLitres REAL NOT NULL DEFAULT 0,
  totalAmount REAL NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES clients (id)
);
```

### Payments Table
```sql
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clientId INTEGER NOT NULL,
  settlementId INTEGER,
  amount REAL NOT NULL,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES clients (id),
  FOREIGN KEY (settlementId) REFERENCES settlements (id)
);
```

### Advances Table
```sql
CREATE TABLE advances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clientId INTEGER NOT NULL,
  amount REAL NOT NULL,
  date DATE NOT NULL,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES clients (id)
);
```

## Project Structure

```
dairy-project/
├── server/                 # Backend Node.js application
│   ├── models/            # Database models
│   ├── routes/            # API route handlers
│   ├── server.js          # Main server file
│   └── package.json
└── webapp/                # Frontend React application
    ├── public/            # Static assets
    ├── src/
    │   ├── components/    # Reusable UI components
    │   ├── pages/         # Page components
    │   ├── routes/        # Routing configuration
    │   ├── services/      # API service functions
    │   └── context/       # React context providers
    └── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
