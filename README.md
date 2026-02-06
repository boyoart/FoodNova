# FoodNova - Food Ordering Platform

A production-ready full-stack food ordering application with customer and admin portals.

## Features

### Customer Portal
- Browse products and bundle packs
- Category-based product filtering
- Shopping cart with quantity management
- User registration and authentication
- Checkout with delivery information
- Order tracking
- Receipt upload for payment verification

### Admin Portal
- Dashboard with order statistics and revenue
- Order management (view, update status)
- Receipt approval/rejection
- Product management (CRUD operations)
- Stock monitoring with low-stock alerts

## Tech Stack

- **Frontend**: React, Tailwind CSS, shadcn/ui components
- **Backend**: FastAPI, SQLAlchemy ORM
- **Database**: PostgreSQL (production) / SQLite (development)
- **Authentication**: JWT with access and refresh tokens

## Project Structure

```
/
├── backend/
│   ├── app/
│   │   ├── core/          # Config, security, CORS
│   │   ├── db/            # Database session, models
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── routes/        # API endpoints
│   │   └── services/      # Business logic
│   ├── uploads/           # Receipt storage
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # React components
│   │   ├── context/       # Auth and Cart context
│   │   └── pages/         # Page components
│   ├── package.json
│   └── .env.example
└── README.md
```

## Deployment

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your repository
3. Set root directory to: `backend`
4. Set build command: `pip install -r requirements.txt`
5. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
6. Add environment variables (see Backend Environment Variables)

### Frontend (Vercel)

1. Import your repository to Vercel
2. Set root directory to: `frontend`
3. Framework preset: Create React App
4. Build command: `npm run build` or `yarn build`
5. Output directory: `build`
6. Add environment variables (see Frontend Environment Variables)

## Environment Variables

### Backend (.env)

```env
# Database (PostgreSQL for production)
DATABASE_URL=postgresql+psycopg://user:password@host:5432/dbname

# JWT Configuration
JWT_SECRET=your_secure_secret_key_here
JWT_ACCESS_EXPIRES_MIN=30
JWT_REFRESH_EXPIRES_DAYS=7

# Admin Credentials (for initial seed)
ADMIN_EMAIL=admin@foodnova.com
ADMIN_PASSWORD=Admin123!

# CORS
FRONTEND_ORIGIN=https://your-frontend-domain.vercel.app

# File Uploads
UPLOAD_DRIVER=local
UPLOAD_DIR=./uploads
MAX_UPLOAD_MB=10
```

### Frontend (.env)

```env
VITE_API_BASE_URL=https://your-backend-domain.onrender.com
```

Or for Create React App:

```env
REACT_APP_BACKEND_URL=https://your-backend-domain.onrender.com
```

## API Endpoints

### Health Check
- `GET /health` - Health check

### Authentication
- `POST /api/auth/register` - Customer registration
- `POST /api/auth/login` - Login (returns JWT tokens)
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Public
- `GET /api/categories` - List categories
- `GET /api/products` - List products
- `GET /api/packs` - List bundle packs
- `GET /api/packs/{id}` - Get pack details

### Customer (Protected)
- `POST /api/orders` - Create order
- `GET /api/orders/my` - Get my orders
- `GET /api/orders/{id}` - Get order details
- `POST /api/orders/{id}/receipt` - Upload receipt
- `GET /api/orders/{id}/receipt` - Get order receipt

### Admin (Protected)
- `GET /api/admin/orders` - List all orders
- `GET /api/admin/orders/{id}` - Get order details
- `PATCH /api/admin/orders/{id}` - Update order status
- `GET /api/admin/products` - List all products
- `POST /api/admin/products` - Create product
- `PATCH /api/admin/products/{id}` - Update product
- `DELETE /api/admin/products/{id}` - Delete product
- `PATCH /api/admin/receipts/{id}` - Approve/reject receipt

## Default Admin Credentials

```
Email: admin@foodnova.com
Password: Admin123!
```

## Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

### Frontend

```bash
cd frontend
yarn install
yarn start
```

## Currency

All prices are in Nigerian Naira (₦). Format: ₦8,500

## License

MIT
