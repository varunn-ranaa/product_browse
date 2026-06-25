# Product Browser 

A backend application built for browsing and filtering a large product dataset (~200,000 products) with fast and reliable pagination.

## Live Demo

Frontend:
https://product-browser-9.onrender.com

Backend API:
https://product-browser-g2nd.onrender.com

## Tech Stack

* Frontend: React
* Backend: Node.js, Express.js
* Database: PostgreSQL
* Database Hosting: Neon
* Deployment: Render

---

## Features

### Product Listing

* Fetch products sorted by newest first.
* Supports pagination for large datasets.

### Category Filtering

* Filter products by category.

Example:

```http
GET /products?category=Electronics
```

### Cursor (Keyset) Pagination

Supports efficient pagination using:

```sql
(updated_at, id)
```

Example:

```http
GET /products?updated_at=2026-06-25 15:26:20.493&id=199981
```

This approach prevents:

* Duplicate records
* Missing records
* Slow queries on large datasets

---

## Database Design

### Products Table

```sql
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

---

## Indexing

### Pagination Index

```sql
CREATE INDEX idx_products_updated_id
ON products(updated_at DESC, id DESC);
```

Used for:

```sql
ORDER BY updated_at DESC, id DESC
```

and cursor pagination.

### Category + Pagination Index

```sql
CREATE INDEX idx_products_category_updated_id
ON products(category, updated_at DESC, id DESC);
```

Used for:

```sql
WHERE category = ?
ORDER BY updated_at DESC, id DESC
```

This keeps category filtering fast even with large datasets.

---

## Data Generation - faker.js

A custom seed script generates:

* 200,000 products
* Random product names
* Random categories
* Random prices
* Sequential timestamps

Bulk inserts are performed in batches of 5000 rows for faster database seeding.

---

## API Endpoints

### Get Products

```http
GET /products
```

### Filter by Category

```http
GET /products?category=Books
```

### Next Page

```http
GET /products?updated_at=<timestamp>&id=<id>
```

---

## Key Learnings

Through this project I learned:

### Database Indexing

* How indexes improve query performance.
* Why composite indexes are useful for filtering and sorting.

### Offset vs Cursor Pagination

Offset Pagination:

```sql
LIMIT 20 OFFSET 100000
```

Issues:

* Slower on large datasets
* Can skip or duplicate records when data changes

Cursor Pagination:

```sql
WHERE (updated_at, id) < (...)
```

Benefits:

* Faster queries
* Better scalability
* Stable results while data changes

### PostgreSQL & Neon

* Working with PostgreSQL in production.
* Managing a cloud-hosted database using Neon.
* Connecting Node.js applications to PostgreSQL.

### Query Optimization

* Using indexes to avoid full table scans.
* Building dynamic SQL queries safely using parameterized queries.

---

## Future Improvements

* Base64 encoded cursors
* Adjustable page size
* Request validation
* Automated API tests
* Caching for frequently accessed queries

---

## Author

Built as part of the CodeVector Internship Backend Assignment.
