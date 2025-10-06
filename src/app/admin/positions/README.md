# Admin Transactions CRUD System

A comprehensive transaction management system for administrators to create, read, update, and delete user transactions.

## Features

### 📊 **Transaction Management**

- **Create**: Add new transactions with full validation
- **Read**: View all transactions with filtering and pagination
- **Update**: Edit existing transaction details
- **Delete**: Remove transactions with confirmation

### 🔍 **Advanced Filtering**

- **Search**: Find transactions by description
- **Type Filter**: Filter by transaction type (BUY, SELL, DEPOSIT, etc.)
- **Status Filter**: Filter by transaction status (PENDING, COMPLETED, etc.)
- **User Filter**: Filter by specific user ID
- **Date Range**: Filter by creation date range

### 📈 **Statistics Dashboard**

- **Total Transactions**: Count of all transactions
- **Total Volume**: Sum of all transaction amounts
- **Total P&L**: Profit and loss calculations
- **Status Breakdown**: Completed, pending, and failed transaction counts

### 🎯 **Transaction Types**

- **BUY/SELL**: Trading transactions
- **DEPOSIT/WITHDRAWAL**: Account funding
- **TRANSFER_IN/TRANSFER_OUT**: Internal transfers
- **FEE**: Transaction fees
- **BONUS**: Bonus credits
- **REFUND**: Refund transactions

### 📋 **Transaction Status**

- **PENDING**: Awaiting processing
- **COMPLETED**: Successfully processed
- **FAILED**: Processing failed
- **CANCELLED**: Transaction cancelled
- **PROCESSING**: Currently being processed

## API Endpoints

### **GET** `/api/admin/transactions`

- List all transactions with filtering and pagination
- Query parameters: `page`, `limit`, `userId`, `type`, `status`, `marketId`, `search`

### **POST** `/api/admin/transactions`

- Create a new transaction
- Required fields: `userId`, `type`, `amount`

### **GET** `/api/admin/transactions/[id]`

- Get specific transaction details

### **PUT** `/api/admin/transactions/[id]`

- Update existing transaction

### **DELETE** `/api/admin/transactions/[id]`

- Delete transaction

### **GET** `/api/admin/transactions/stats`

- Get transaction statistics
- Query parameters: `userId`, `dateFrom`, `dateTo`

## Database Schema

The Transaction model includes:

- **Basic Info**: ID, user, type, status
- **Market Data**: Market reference, symbol, asset type
- **Financial Data**: Amount, quantity, P&L
- **Metadata**: Description, execution timestamp
- **Relations**: User and Market relationships

## Usage

1. **Navigate** to `/admin/transactions` (admin access required)
2. **View** transaction statistics at the top
3. **Filter** transactions using the filter panel
4. **Create** new transactions using the "Add Transaction" button
5. **Edit** transactions by clicking the edit icon
6. **Delete** transactions with confirmation dialog

## Security

- **Admin Only**: Requires ADMIN or SUPERADMIN role
- **Validation**: All inputs are validated server-side
- **Error Handling**: Comprehensive error messages
- **Confirmation**: Delete operations require confirmation

## Components

- **TransactionsView**: Main container component
- **TransactionsTable**: Data table with actions
- **TransactionForm**: Create/edit form modal
- **TransactionStats**: Statistics dashboard cards

## Future Enhancements

- **Bulk Operations**: Select multiple transactions for bulk actions
- **Export**: Export transaction data to CSV/Excel
- **Advanced Analytics**: Charts and graphs for transaction trends
- **Audit Trail**: Track who made changes to transactions
- **Real-time Updates**: WebSocket integration for live updates
