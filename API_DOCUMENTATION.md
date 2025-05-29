# Pharma-Link API Documentation (v1)

This document provides details about the Pharma-Link API endpoints, request/response formats, and authentication requirements.

## Base URL

```
http://localhost:5000/api/v1
```

## API Versioning

The API uses URL-based versioning (e.g., `/api/v1/`). All endpoints are prefixed with the version number to ensure backward compatibility.

## Authentication

Most endpoints require authentication using a JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Error Responses

All API errors follow a standard format:

```json
{
  "success": false,
  "message": "Error message description",
  "errors": [/* Validation errors if applicable */]
}
```

## Endpoints

### Authentication

#### Register Pharmacist

- **URL**: `/auth/register/pharmacists`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:

```json
{
  "email": "pharmacist@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "bio": "Experienced pharmacist with 5 years in retail pharmacy",
  "experience": "5 years in retail pharmacy",
  "education": "PharmD from University of Example",
  "city": "Cairo",
  "area": "Nasr City"
}
```

- **Success Response**: `201 Created`

```json
{
  "message": "Pharmacist registered successfully",
  "token": "jwt_token_here"
}
```

#### Register Pharmacy Owner

- **URL**: `/auth/register/pharmacy-owners`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:

```json
{
  "email": "pharmacy@example.com",
  "password": "password123",
  "pharmacyName": "Example Pharmacy",
  "contactPerson": "Jane Smith",
  "phoneNumber": "+1234567890",
  "address": "123 Main St, City, Country",
  "city": "Cairo",
  "area": "Nasr City"
}
```

- **Success Response**: `201 Created`

```json
{
  "message": "Pharmacy owner registered successfully",
  "token": "jwt_token_here"
}
```

#### Login

- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Request Body**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

- **Success Response**: `200 OK`

```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "PHARMACIST" // or "PHARMACY_OWNER"
  }
}
```

### Pharmacist Endpoints

#### Get Pharmacist Profile

- **URL**: `/pharmacists/me`
- **Method**: `GET`
- **Auth Required**: Yes (Pharmacist only)
- **Success Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "pharmacist_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "pharmacist@example.com",
    "phoneNumber": "+1234567890",
    "bio": "Experienced pharmacist",
    "experience": "5 years in retail pharmacy",
    "education": "PharmD from University of Example",
    "city": "Cairo",
    "area": "Nasr City",
    "available": true,
    "cv": {
      "url": "http://localhost:5000/uploads/cvs/cv-1234567890.pdf",
      "uploadedAt": "2023-06-15T10:30:00Z"
    },
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-06-15T10:30:00.000Z"
  }
}
```

#### Update Pharmacist Profile

- **URL**: `/pharmacists/me`
- **Method**: `PUT`
- **Auth Required**: Yes (Pharmacist only)
- **Request Body**:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "bio": "Updated bio information",
  "experience": "6 years in retail pharmacy",
  "education": "PharmD from University of Example",
  "city": "Cairo",
  "area": "Nasr City",
  "available": true
}
```

- **Success Response**: `200 OK`

```json
{
  "message": "Profile updated successfully",
  "data": {
    "id": "profile_id",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890",
    "bio": "Updated bio information",
    "experience": "6 years in retail pharmacy",
    "education": "PharmD from University of Example",
    "city": "Cairo",
    "area": "Nasr City",
    "available": true,
    "cv": {
      "url": "http://localhost:5000/uploads/cvs/cv-1234567890.pdf",
      "uploadedAt": "2023-06-15T10:30:00Z"
    },
    "email": "pharmacist@example.com",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-06-15T10:30:00.000Z"
  }
}
```

#### Pharmacist CV Management

#### Upload/Update Pharmacist CV

- **URL**: `/pharmacists/me/cv`
- **Method**: `POST`
- **Auth Required**: Yes (Pharmacist only)
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `cv`: (File) The CV file to upload (PDF, DOC, or DOCX, max 5MB)

- **Success Response**: `200 OK`

```json
{
  "success": true,
  "message": "CV uploaded successfully",
  "data": {
    "cvUrl": "/uploads/cvs/cv-1234567890.pdf",
    "updatedAt": "2023-06-15T10:30:00Z"
  }
}
```

- **Error Responses**:
  - `400 Bad Request`: No file uploaded or invalid file type
  - `401 Unauthorized`: User not authenticated
  - `404 Not Found`: Pharmacist profile not found
  - `413 Payload Too Large`: File size exceeds 5MB
  - `500 Internal Server Error`: Error processing the file

#### Get Pharmacist CV

- **URL**: `/pharmacists/me/cv`
- **Method**: `GET`
- **Auth Required**: Yes (Pharmacist only)
- **Note**: This endpoint is maintained for backward compatibility. The CV information is now included in the pharmacist's profile response.

- **Success Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "url": "http://localhost:5000/uploads/cvs/cv-1234567890.pdf",
    "uploadedAt": "2023-06-15T10:30:00Z"
  }
}
```

- **Error Responses**:
  - `401 Unauthorized`: User not authenticated
  - `404 Not Found`: CV not found for the pharmacist
  - `500 Internal Server Error`: Error retrieving CV information

#### Search Pharmacists

- **URL**: `/pharmacists/search`
- **Method**: `GET`
- **Auth Required**: No
- **Query Parameters**:
  - `city` (required): Filter by city
  - `area` (optional): Filter by area within city
  - `available` (optional): `true` to show only available pharmacists
  - `page` (optional): Page number for pagination (default: 1)
  - `limit` (optional): Number of items per page (default: 10, max: 100)

- **Success Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "pharmacists": [
      {
        "id": "pharmacist_id",
        "firstName": "John",
        "lastName": "Doe",
        "email": "pharmacist@example.com",
        "phoneNumber": "+1234567890",
        "bio": "Experienced pharmacist",
        "experience": "5 years in retail pharmacy",
        "education": "PharmD from University of Example",
        "city": "Cairo",
        "area": "Nasr City",
        "available": true,
        "cv": {
          "url": "http://localhost:5000/uploads/cvs/cv-1234567890.pdf",
          "uploadedAt": "2023-06-15T10:30:00Z"
        },
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-06-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 10,
      "page": 1,
      "pages": 1
    },
    "filters": {
      "applied": {
        "city": "Cairo",
        "area": "Nasr City",
        "available": true
      }
    }
  }
}
```

### Pharmacy Owner Endpoints

#### Get Pharmacy Owner Profile

- **URL**: `/pharmacies/me`
- **Method**: `GET`
- **Auth Required**: Yes (Pharmacy Owner only)
- **Success Response**: `200 OK`

```json
{
  "id": "owner_id",
  "email": "owner@example.com",
  "pharmacyName": "Example Pharmacy",
  "contactPerson": "Jane Smith",
  "phoneNumber": "+1234567890",
  "address": "123 Main St, City, Country",
  "city": "Cairo",
  "area": "Nasr City",
  "subscriptionType": "PREMIUM",
  "subscriptionExpiresAt": "2024-12-31T23:59:59Z"
}
```

#### Update Pharmacy Owner Profile

- **URL**: `/pharmacies/me`
- **Method**: `PUT`
- **Auth Required**: Yes (Pharmacy Owner only)
- **Request Body**:

```json
{
  "pharmacyName": "Updated Pharmacy Name",
  "contactPerson": "Updated Name",
  "phoneNumber": "+1234567890",
  "address": "Updated Address",
  "city": "Cairo",
  "area": "New Area"
}
```

- **Success Response**: `200 OK`

```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "owner_id",
    "pharmacyName": "Updated Pharmacy Name",
    "contactPerson": "Updated Name",
    "phoneNumber": "+1234567890",
    "address": "Updated Address",
    "city": "Cairo",
    "area": "New Area"
  }
}
```

#### Update Subscription

- **URL**: `/pharmacies/me/subscription`
- **Method**: `POST`
- **Auth Required**: Yes (Pharmacy Owner only)
- **Request Body**:

```json
{
  "subscriptionType": "PREMIUM",
  "durationMonths": 12
}
```

- **Success Response**: `200 OK`

```json
{
  "message": "Subscription updated successfully",
  "subscription": {
    "type": "PREMIUM",
    "expiresAt": "2024-12-31T23:59:59Z"
  }
}
```

#### Update Pharmacy Owner Profile

- **URL**: `/pharmacy-owners/profile`
- **Method**: `PUT`
- **Auth Required**: Yes (Pharmacy Owner only)
- **Request Body**:

```json
{
  "pharmacyName": "Updated Pharmacy Name",
  "contactPerson": "Jane Smith",
  "phoneNumber": "+1234567890",
  "address": "123 Main St, City, Country",
  "city": "Cairo",
  "area": "Nasr City"
}
```

- **Success Response**: `200 OK`

```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "profile_id",
    "pharmacyName": "Updated Pharmacy Name",
    "contactPerson": "Jane Smith",
    "phoneNumber": "+1234567890",
    "address": "123 Main St, City, Country",
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```

#### Update Subscription

- **URL**: `/pharmacy-owners/subscription`
- **Method**: `PUT`
- **Auth Required**: Yes (Pharmacy Owner only)
- **Request Body**:

```json
{
  "planType": "premium" // "none", "basic", or "premium"
}
```

- **Success Response**: `200 OK`

```json
{
  "message": "Subscription updated successfully",
  "subscription": {
    "planType": "premium",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

### Store Endpoints

### Public Endpoints

#### Get All Products

- **URL**: `/store/products`
- **Method**: `GET`
- **Auth Required**: No
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10, max: 100)

- **Success Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "product_id",
        "name": "Paracetamol 500mg",
        "description": "Pain reliever and fever reducer",
        "price": 10.99,
        "quantity": 100,
        "pharmacyId": "pharmacy_id",
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

#### Search Products

- **URL**: `/store/products/search`
- **Method**: `GET`
- **Auth Required**: No
- **Query Parameters**:
  - `query` (required): Search query
  - `city` (optional): Filter by city
  - `area` (optional): Filter by area
  - `minPrice` (optional): Minimum price
  - `maxPrice` (optional): Maximum price
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10, max: 100)

- **Success Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "product_id",
        "name": "Paracetamol 500mg",
        "description": "Pain reliever and fever reducer",
        "price": 10.99,
        "pharmacyName": "Example Pharmacy",
        "pharmacyAddress": "123 Main St, City",
        "distance": 1.5,
        "createdAt": "2023-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

#### Get Product by ID

- **URL**: `/store/products/:id`
- **Method**: `GET`
- **Auth Required**: No
- **Success Response**: `200 OK`

```json
{
  "id": "product_id",
  "name": "Paracetamol 500mg",
  "description": "Pain reliever and fever reducer",
  "price": 10.99,
  "quantity": 100,
  "pharmacyId": "pharmacy_id",
  "pharmacyName": "Example Pharmacy",
  "pharmacyAddress": "123 Main St, City",
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z"
}
```

### Pharmacy Owner Endpoints

#### Create Product

- **URL**: `/store/products`
- **Method**: `POST`
- **Auth Required**: Yes (Pharmacy Owner only)
- **Request Body**:

```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 19.99,
  "stock": 50,
  "category": "MEDICATION"
}
```

- **Success Response**: `201 Created`

```json
{
  "message": "Product created successfully",
  "product": {
    "id": "new_product_id",
    "name": "New Product",
    "description": "Product description",
    "price": 19.99,
    "stock": 50,
    "category": "MEDICATION",
    "pharmacyId": "pharmacy_id",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### Get My Products

- **URL**: `/store/products/me`
- **Method**: `GET`
- **Auth Required**: Yes (Pharmacy Owner only)
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10, max: 100)
  - `category` (optional): Filter by category
  - `inStock` (optional): `true` to show only in-stock items

- **Success Response**: `200 OK`

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "product_id",
        "name": "Paracetamol 500mg",
        "description": "Pain reliever and fever reducer",
        "price": 10.99,
        "quantity": 100,
        "category": "MEDICATION",
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

#### Update Product

- **URL**: `/store/products/:id`
- **Method**: `PUT`
- **Auth Required**: Yes (Pharmacy Owner only)
- **Request Body**:

```json
{
  "name": "Updated Product Name",
  "description": "Updated description",
  "price": 15.99,
  "stock": 75,
  "category": "MEDICATION"
}
```

- **Success Response**: `200 OK`

```json
{
  "message": "Product updated successfully",
  "product": {
    "id": "product_id",
    "name": "Updated Product Name",
    "description": "Updated description",
    "price": 15.99,
    "stock": 75,
    "category": "MEDICATION",
    "pharmacyId": "pharmacy_id",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-02T00:00:00Z"
  }
}
```

#### Delete Product

- **URL**: `/store/products/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (Pharmacy Owner only)
- **Success Response**: `200 OK`

```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

#### Create Product

- **URL**: `/store/products`
- **Method**: `POST`
- **Auth Required**: Yes (Pharmacy Owner only)
- **Request Body**:

```json
{
  "name": "Paracetamol 500mg",
  "description": "Pain reliever and fever reducer",
  "price": 9.99,
  "category": "Pain Relief",
  "stock": 100,
  "isNearExpiry": false,
  "expiryDate": "2024-12-31T00:00:00Z",
  "imageUrl": "https://example.com/images/paracetamol.jpg"
}
```

- **Success Response**: `201 Created`

```json
{
  "message": "Product created successfully",
  "product": {
    "id": "product_id",
    "name": "Paracetamol 500mg",
    "description": "Pain reliever and fever reducer",
    "price": 9.99,
    "category": "Pain Relief",
    "stock": 100,
    "isNearExpiry": false,
    "expiryDate": "2024-12-31T00:00:00Z",
    "imageUrl": "https://example.com/images/paracetamol.jpg",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
}
```

#### Get My Products

- **URL**: `/store/products/my-products`
- **Method**: `GET`
- **Auth Required**: Yes (Pharmacy Owner only)

- **Success Response**: `200 OK`

```json
{
  "count": 1,
  "products": [
    {
      "id": "product_id",
      "name": "Paracetamol 500mg",
      "description": "Pain reliever and fever reducer",
      "price": 9.99,
      "category": "Pain Relief",
      "stock": 100,
      "isNearExpiry": false,
      "expiryDate": "2024-12-31T00:00:00Z",
      "imageUrl": "https://example.com/images/paracetamol.jpg",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
    // More products...
  ]
}
```

#### Get Product by ID

- **URL**: `/store/products/:id`
- **Method**: `GET`
- **Auth Required**: Yes

- **Success Response**: `200 OK`

```json
{
  "id": "product_id",
  "name": "Paracetamol 500mg",
  "description": "Pain reliever and fever reducer",
  "price": 9.99,
  "category": "Pain Relief",
  "stock": 100,
  "isNearExpiry": false,
  "expiryDate": "2024-12-31T00:00:00Z",
  "imageUrl": "https://example.com/images/paracetamol.jpg",
  "createdAt": "2023-01-01T00:00:00Z",
  "updatedAt": "2023-01-01T00:00:00Z",
  "pharmacyOwner": {
    "pharmacyName": "Example Pharmacy",
    "contactPerson": "Jane Smith",
    "phoneNumber": "+1234567890",
    "address": "123 Main St, City, Country",
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```

#### Update Product

- **URL**: `/store/products/:id`
- **Method**: `PUT`
- **Auth Required**: Yes (Pharmacy Owner only)
- **Request Body**:

```json
{
  "name": "Updated Product Name",
  "description": "Updated description",
  "price": 12.99,
  "category": "Pain Relief",
  "stock": 150,
  "isNearExpiry": true,
  "expiryDate": "2023-06-30T00:00:00Z",
  "imageUrl": "https://example.com/images/updated-product.jpg"
}
```

- **Success Response**: `200 OK`

```json
{
  "message": "Product updated successfully",
  "product": {
    "id": "product_id",
    "name": "Updated Product Name",
    "description": "Updated description",
    "price": 12.99,
    "category": "Pain Relief",
    "stock": 150,
    "isNearExpiry": true,
    "expiryDate": "2023-06-30T00:00:00Z",
    "imageUrl": "https://example.com/images/updated-product.jpg",
    "updatedAt": "2023-01-02T00:00:00Z"
  }
}
```

#### Delete Product

- **URL**: `/store/products/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (Pharmacy Owner only)

- **Success Response**: `200 OK`

```json
{
  "message": "Product deleted successfully"
}
```

#### Get All Products

- **URL**: `/store/products`
- **Method**: `GET`
- **Auth Required**: No
- **Query Parameters**:
  - `category` (optional): Filter by category
  - `nearExpiry` (optional): Filter by near expiry status (true/false)
  - `page` (optional): Page number for pagination (default: 1)
  - `limit` (optional): Number of items per page (default: 10)

- **Success Response**: `200 OK`

```json
{
  "products": [
    {
      "id": "product_id",
      "name": "Paracetamol 500mg",
      "description": "Pain reliever and fever reducer",
      "price": 9.99,
      "category": "Pain Relief",
      "stock": 100,
      "isNearExpiry": false,
      "expiryDate": "2024-12-31T00:00:00Z",
      "imageUrl": "https://example.com/images/paracetamol.jpg",
      "pharmacyOwner": {
        "pharmacyName": "Example Pharmacy",
        "contactPerson": "Jane Smith",
        "phoneNumber": "+1234567890",
        "address": "123 Main St, City, Country"
      }
    }
    // More products...
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

#### Search Products

- **URL**: `/store/products/search`
- **Method**: `GET`
- **Auth Required**: No
- **Query Parameters**:
  - `q` (optional): Search query for product name and description
  - `category` (optional): Filter by category
  - `nearExpiry` (optional): Filter by near expiry status (true/false)
  - `minPrice` (optional): Minimum price filter
  - `maxPrice` (optional): Maximum price filter
  - `page` (optional): Page number for pagination (default: 1)
  - `limit` (optional): Number of items per page (default: 10)

- **Success Response**: `200 OK`

```json
{
  "products": [
    {
      "id": "product_id",
      "name": "Paracetamol 500mg",
      "description": "Pain reliever and fever reducer",
      "price": 9.99,
      "category": "Pain Relief",
      "stock": 100,
      "isNearExpiry": false,
      "expiryDate": "2024-12-31T00:00:00Z",
      "imageUrl": "https://example.com/images/paracetamol.jpg",
      "pharmacyOwner": {
        "pharmacyName": "Example Pharmacy",
        "contactPerson": "Jane Smith",
        "phoneNumber": "+1234567890",
        "address": "123 Main St, City, Country",
        "latitude": 37.7749,
        "longitude": -122.4194
      }
    }
    // More products...
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

## Status Codes

- `200 OK`: The request was successful
- `201 Created`: A new resource was successfully created
- `400 Bad Request`: The request was invalid or cannot be served
- `401 Unauthorized`: Authentication is required or failed
- `403 Forbidden`: The authenticated user doesn't have permission
- `404 Not Found`: The requested resource doesn't exist
- `500 Internal Server Error`: An error occurred on the server