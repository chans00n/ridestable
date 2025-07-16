# Admin API Testing Guide

## Authentication

### 1. Login as Super Admin

**Endpoint:** `POST http://localhost:8000/api/admin/auth/login`

**Request Body:**
```json
{
  "email": "super@stableride.com",
  "password": "Admin123!@#"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "accessToken": "YOUR_JWT_TOKEN",
    "admin": {
      "id": "...",
      "email": "super@stableride.com",
      "firstName": "Super",
      "lastName": "Admin",
      "role": "SUPER_ADMIN",
      "permissions": [...]
    }
  }
}
```

## Using the Access Token

Include the token in all subsequent requests:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Available Endpoints

### Dashboard Metrics
```
GET http://localhost:8000/api/admin/dashboard/metrics
Authorization: Bearer YOUR_JWT_TOKEN
```

### Revenue Analytics
```
GET http://localhost:8000/api/admin/dashboard/revenue
Authorization: Bearer YOUR_JWT_TOKEN
```

### Booking Management
```
GET http://localhost:8000/api/admin/bookings
Authorization: Bearer YOUR_JWT_TOKEN
```

### Customer Management
```
GET http://localhost:8000/api/admin/customers
Authorization: Bearer YOUR_JWT_TOKEN
```

## Testing with curl

### Login
```bash
curl -X POST http://localhost:8000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"super@stableride.com","password":"Admin123!@#"}'
```

### Get Dashboard Metrics (replace TOKEN with actual token)
```bash
curl http://localhost:8000/api/admin/dashboard/metrics \
  -H "Authorization: Bearer TOKEN"
```