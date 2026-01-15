# Collections Database Setup - Summary

## Overview
Successfully created the database schema for the Collections feature, allowing users to save and organize leads into custom collections.

## Database Tables Created

### 1. collections Table
**Purpose**: Stores user-created collections of leads

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | Primary Key, Default: `gen_random_uuid()` | Unique collection identifier |
| `user_id` | TEXT | NOT NULL | Clerk User ID (for user isolation) |
| `name` | TEXT | NOT NULL | Collection name (e.g., "Sydney Mechanics") |
| `created_at` | TIMESTAMPTZ | Default: `now()` | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Default: `now()` | Last update timestamp |

**Indexes**:
- `idx_collections_user_id` on `user_id` for fast user-based queries

**RLS**: ✅ Enabled

### 2. collection_items Table
**Purpose**: Junction table linking companies to collections

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | Primary Key, Default: `gen_random_uuid()` | Unique item identifier |
| `collection_id` | UUID | NOT NULL, FK → `collections.id` | References parent collection |
| `company_id` | TEXT | NOT NULL, FK → `companyInfo.id` | References company from leads |
| `created_at` | TIMESTAMPTZ | Default: `now()` | When company was added |

**Constraints**:
- `UNIQUE(collection_id, company_id)` - Prevents duplicate companies in same collection
- `ON DELETE CASCADE` - Deleting collection removes all its items

**Indexes**:
- `idx_collection_items_collection_id` on `collection_id`
- `idx_collection_items_company_id` on `company_id`

**RLS**: ✅ Enabled

## Row Level Security (RLS) Policies

### collections Table Policies

**1. SELECT Policy**: "Users can view their own collections"
```sql
auth.uid()::text = user_id
```

**2. INSERT Policy**: "Users can insert their own collections"
```sql
auth.uid()::text = user_id
```

**3. UPDATE Policy**: "Users can update their own collections"
```sql
auth.uid()::text = user_id
```

**4. DELETE Policy**: "Users can delete their own collections"
```sql
auth.uid()::text = user_id
```

### collection_items Table Policies

**1. SELECT Policy**: "Users can view items in their own collections"
```sql
EXISTS (
    SELECT 1 FROM collections
    WHERE collections.id = collection_items.collection_id
    AND collections.user_id = auth.uid()::text
)
```

**2. INSERT Policy**: "Users can insert items to their own collections"
```sql
EXISTS (
    SELECT 1 FROM collections
    WHERE collections.id = collection_items.collection_id
    AND collections.user_id = auth.uid()::text
)
```

**3. DELETE Policy**: "Users can delete items from their own collections"
```sql
EXISTS (
    SELECT 1 FROM collections
    WHERE collections.id = collection_items.collection_id
    AND collections.user_id = auth.uid()::text
)
```

## Database Relationships

```
collections (1) ←→ (∞) collection_items (∞) ←→ (1) companyInfo
    ↑                        ↑
    |                        |
 user_id                 company_id
```

**Key Points**:
- One user can have many collections
- One collection can have many companies
- One company can be in many collections (via different items)
- A company can only appear once per collection (UNIQUE constraint)

## Security Model

### User Isolation
- **User ID Source**: Clerk authentication
- **Storage**: `user_id` field in `collections` table
- **Matching**: `auth.uid()::text = user_id`
- **Access Control**: RLS policies enforce user-only access

### Data Integrity
- **Foreign Keys**: Ensure referential integrity
- **Cascade Delete**: Clean up items when collection is deleted
- **Unique Constraint**: Prevent duplicate companies in collections
- **Indexes**: Optimize query performance

## Example Usage Scenarios

### Scenario 1: Create a Collection
```sql
INSERT INTO collections (user_id, name)
VALUES ('user_123', 'Sydney Mechanics');
```

### Scenario 2: Add Company to Collection
```sql
INSERT INTO collection_items (collection_id, company_id)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'company_123'
);
```

### Scenario 3: View User's Collections
```sql
SELECT c.*, COUNT(ci.id) as item_count
FROM collections c
LEFT JOIN collection_items ci ON c.id = ci.collection_id
WHERE c.user_id = 'user_123'
GROUP BY c.id;
```

### Scenario 4: Get Companies in a Collection
```sql
SELECT ci.*, companyInfo.*
FROM collection_items ci
JOIN companyInfo ON ci.company_id = companyInfo.id
WHERE ci.collection_id = '550e8400-e29b-41d4-a716-446655440000';
```

## Next Steps for Application Development

### 1. Authentication Integration
- Ensure Clerk user IDs are properly retrieved
- Pass authenticated user ID to Supabase queries
- Handle `auth.uid()` in server components

### 2. API Endpoints (if needed)
Consider creating serverless functions for:
- `POST /api/collections` - Create new collection
- `GET /api/collections` - List user's collections
- `POST /api/collections/[id]/items` - Add company to collection
- `DELETE /api/collections/[id]/items/[companyId]` - Remove from collection

### 3. Client Components
- Collections page to view/edit collections
- "Save to Collection" button on leads page
- Collection selector/modal component
- Drag-and-drop functionality for organizing companies

## Database Status
✅ **Fully Configured**
- Project: `ai_email_platform` (ctdrapmcjefjqhhdyalg)
- Tables Created: 2 (collections, collection_items)
- RLS Enabled: Both tables
- Policies Applied: 7 total policies
- Foreign Keys: Properly configured
- Indexes: Performance optimized

## Migrations Applied

1. **create_collections_tables**
   - Created `collections` table
   - Created `collection_items` junction table
   - Added indexes
   - Enabled RLS

2. **create_collections_rls_policies**
   - Applied 4 policies to `collections` table
   - Applied 3 policies to `collection_items` table

---
*Database setup completed on 2025-12-19*
