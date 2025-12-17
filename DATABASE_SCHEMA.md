# Mine-Sigma Database Schema

## Overview
The Mine-Sigma application uses **Neon DB** (PostgreSQL) as its primary database. All tables are created automatically on application startup using SQLAlchemy ORM.

---

## Database Tables

### 1. **users** Table
Stores user account information with role-based access control.

**Table Name:** `users`

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique user identifier (auto-generated) |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | User's email address (login credential) |
| `hashed_password` | VARCHAR(255) | NOT NULL | Bcrypt-hashed password (12 rounds) |
| `full_name` | VARCHAR(255) | NULLABLE | User's full name |
| `role` | ENUM (userrole) | NOT NULL, DEFAULT='officer' | User role: `admin` or `officer` |
| `is_active` | BOOLEAN | DEFAULT=True | Account activation status |
| `last_login` | TIMESTAMP WITH TIME ZONE | NULLABLE | Last login timestamp |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT=now(), NOT NULL | Account creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT=now(), NOT NULL | Last update timestamp |

**Enum Values:**
- `userrole`: `'admin'`, `'officer'`

**Indexes:**
- `ix_users_email` - Unique index on email column

**Sample Data:**
```
admin@mine-sigma.com | Admin User | admin | active
officer@mine-sigma.com | Officer User | officer | active
officer2@mine-sigma.com | Second Officer | officer | active
```

---

### 2. **alerts** Table
Stores mining compliance alerts and anomalies detected by the AI system.

**Table Name:** `alerts`

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique alert identifier |
| `title` | VARCHAR(255) | NOT NULL | Alert title/subject |
| `description` | TEXT | NULLABLE | Detailed alert description |
| `status` | ENUM (alertstatus) | NOT NULL | Alert status |
| `severity` | ENUM (alertseverity) | NOT NULL | Alert severity level |
| `location` | JSONB | NULLABLE | Geographic location data (JSON) |
| `coordinates` | JSONB | NULLABLE | GPS coordinates (JSON) |
| `extra_data` | JSONB | NULLABLE | Additional metadata (JSON) |
| `assigned_officer_id` | UUID | NULLABLE, FK | Assigned officer reference |
| `resolved_at` | TIMESTAMP WITH TIME ZONE | NULLABLE | Resolution timestamp |
| `due_date` | TIMESTAMP WITH TIME ZONE | NULLABLE | Alert due date |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT=now(), NOT NULL | Alert creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT=now(), NOT NULL | Last update timestamp |

**Enum Values:**
- `alertstatus`: `'OPEN'`, `'IN_PROGRESS'`, `'RESOLVED'`, `'REJECTED'`
- `alertseverity`: `'LOW'`, `'MEDIUM'`, `'HIGH'`, `'CRITICAL'`

**Foreign Keys:**
- `assigned_officer_id` → `users.id`

**Indexes:**
- Primary key on `id`
- Foreign key constraint on `assigned_officer_id`

---

### 3. **complaints** Table
Stores citizen complaints and reports about mining violations with blockchain support.

**Table Name:** `complaints`

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique complaint identifier |
| `title` | VARCHAR(255) | NOT NULL | Complaint title |
| `description` | TEXT | NOT NULL | Detailed complaint description |
| `status` | ENUM (complaintstatus) | NOT NULL | Complaint status |
| `location` | JSONB | NULLABLE | Complaint location (JSON) |
| `contact_info` | JSONB | NULLABLE | Complainant contact information (JSON) |
| `transaction_hash` | VARCHAR(255) | NULLABLE | Blockchain transaction hash |
| `block_number` | INTEGER | NULLABLE | Blockchain block number |
| `submitted_by` | VARCHAR(255) | NULLABLE | Complainant name/identifier |
| `assigned_officer_id` | UUID | NULLABLE, FK | Assigned officer reference |
| `resolution_notes` | TEXT | NULLABLE | Resolution notes |
| `resolved_at` | TIMESTAMP WITH TIME ZONE | NULLABLE | Resolution timestamp |
| `category` | VARCHAR(100) | NULLABLE | Complaint category |
| `tags` | JSONB | NULLABLE | Complaint tags (JSON array) |
| `is_verified` | BOOLEAN | NOT NULL | Verification status |
| `verification_notes` | TEXT | NULLABLE | Verification notes |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT=now(), NOT NULL | Submission timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT=now(), NOT NULL | Last update timestamp |

**Enum Values:**
- `complaintstatus`: `'SUBMITTED'`, `'UNDER_REVIEW'`, `'IN_PROGRESS'`, `'RESOLVED'`, `'REJECTED'`

**Foreign Keys:**
- `assigned_officer_id` → `users.id`

**Indexes:**
- Primary key on `id`
- Foreign key constraint on `assigned_officer_id`

---

## Relationships

```
users (1) ──────→ (N) alerts
  └─ assigned_officer_id

users (1) ──────→ (N) complaints
  └─ assigned_officer_id
```

---

## Timestamps

All tables include automatic timestamp management:
- **created_at**: Set to current timestamp on record creation
- **updated_at**: Set to current timestamp on record creation and updated on modifications

---

## Data Types

### UUID
- Used for all primary keys
- Auto-generated using Python's `uuid.uuid4()`
- Stored as PostgreSQL UUID type

### JSONB
- Used for flexible, nested data storage
- Supports full-text search and indexing
- Examples: location coordinates, metadata, contact info

### ENUM
- PostgreSQL native enum types
- Provides type safety and validation at database level
- Values defined in Python Enum classes

### Timestamps
- PostgreSQL `TIMESTAMP WITH TIME ZONE`
- Automatically managed by database defaults
- Supports timezone-aware operations

---

## Security Features

1. **Password Hashing**
   - Bcrypt with 12 rounds
   - Passwords never stored in plain text
   - Verification done using bcrypt.checkpw()

2. **Unique Constraints**
   - Email addresses are unique per user
   - Prevents duplicate account creation

3. **Foreign Keys**
   - Referential integrity maintained
   - Cascading operations configured

4. **Role-Based Access**
   - Users assigned as `admin` or `officer`
   - Enforced at application level

---

## Database Connection

**Connection String Format:**
```
postgresql://user:password@host/dbname
```

**Configuration:**
- Driver: asyncpg (async PostgreSQL driver)
- Pool: NullPool (for serverless environments)
- SSL: Enabled for Neon DB connections

---

## Initialization

Tables are automatically created on application startup via SQLAlchemy's `Base.metadata.create_all()`.

**Location:** `app/db.py` - `init_db()` function

**Seed Data:** `scripts/seed_users.py`
- Creates demo admin and officer users
- Hashes passwords with bcrypt
- Inserts into users table

---

## Example Queries

### Get all users
```sql
SELECT email, full_name, role FROM users WHERE is_active = true;
```

### Get active alerts
```sql
SELECT title, severity, status FROM alerts WHERE status != 'RESOLVED';
```

### Get complaints by officer
```sql
SELECT c.title, c.status, u.full_name 
FROM complaints c 
JOIN users u ON c.assigned_officer_id = u.id 
WHERE u.role = 'officer';
```

### Get user with alerts
```sql
SELECT u.email, COUNT(a.id) as alert_count
FROM users u
LEFT JOIN alerts a ON u.id = a.assigned_officer_id
GROUP BY u.id;
```

---

## Maintenance

### Backup
```bash
pg_dump postgresql://user:password@host/dbname > backup.sql
```

### Restore
```bash
psql postgresql://user:password@host/dbname < backup.sql
```

### Reset Database
```bash
python scripts/reset_db.py
```

---

## Environment Variables Required

```env
DATABASE_URL=postgresql://user:password@host/dbname
SECRET_KEY=your-secret-key-for-jwt
```

---

**Last Updated:** November 27, 2025
**Database Version:** PostgreSQL 12+
**ORM:** SQLAlchemy 2.0+
