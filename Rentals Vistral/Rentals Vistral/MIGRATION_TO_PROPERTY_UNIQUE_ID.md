# Migration to property_unique_id - Complete Guide

## ✅ What Was Fixed

This migration switches the application from using `property_id` (which was deleted) to `property_unique_id` as the primary identifier for property routing and references.

## 📋 Step-by-Step Instructions

### STEP 1: Run SQL Backfill Script (REQUIRED FIRST)

**⚠️ IMPORTANT: Run this SQL script in Supabase SQL Editor BEFORE testing the application.**

1. Open Supabase Dashboard → SQL Editor
2. Open the file: `SQL/BACKFILL_PROPERTY_UNIQUE_ID.sql`
3. Copy and paste the SQL into the editor
4. Run the script

This will:
- Generate unique IDs for all properties with NULL `property_unique_id` values
- Format: `PROP-{first 8 chars of UUID}` (e.g., `PROP-A1B2C3D4`)
- Verify that all properties now have valid `property_unique_id` values

**Verify the update:**
```sql
-- Check for any remaining NULL values (should return 0)
SELECT COUNT(*) as null_count
FROM properties
WHERE property_unique_id IS NULL OR property_unique_id = '';
```

### STEP 2: Code Changes (Already Applied ✅)

The following files have been updated:

#### 1. **Type Definitions** (`src/lib/supabase/types.ts`)
   - ✅ Added `property_unique_id: string` to `properties.Row`
   - ✅ Table `leads_properties` uses `properties_unique_id` (references `property_unique_id`)

#### 2. **Property Hook** (`src/hooks/use-property.ts`)
   - ✅ Changed search query from `id` or `property_ref_id` to `property_unique_id`
   - ✅ Now searches: `.eq("property_unique_id", propertyId)`

#### 3. **Mappers** (`src/lib/supabase/mappers.ts`)
   - ✅ Updated `mapPropertyFromSupabase` to prioritize `property_unique_id`
   - ✅ Maps: `property_ref_id: row.property_unique_id || row.property_ref_id || row.id`

#### 4. **Lead Properties Service** (`src/services/leads-sync.ts`)
   - ✅ Updated comments to clarify `property_id` parameter is `property_unique_id`
   - ✅ Functions now expect `property_unique_id` values

#### 5. **Navigation** (Already Working ✅)
   - ✅ Kanban board uses `mapPropertyFromSupabase` which returns `property_unique_id` as `property_ref_id`
   - ✅ All `router.push` calls use `property.property_ref_id` which now contains `property_unique_id`
   - ✅ Property detail page receives `property_unique_id` from URL params

## 🔄 How It Works Now

1. **URL Routing**: `/rentals/property/{property_unique_id}`
2. **Database Lookup**: Hook searches by `property_unique_id` column
3. **Navigation**: Kanban cards pass `property_unique_id` via `property_ref_id` field (mapped)
4. **Lead Associations**: `leads_properties.properties_unique_id` stores `property_unique_id` values

## ⚠️ Important Notes

### Database Schema
- The `leads_properties` table uses `leads_unique_id` and `properties_unique_id` columns
- Run `SQL/create_leads_properties_table.sql` to create the table or migrate from `lead_properties`

### Backward Compatibility
- The mapper includes fallbacks: `property_unique_id || property_ref_id || id`
- This ensures the app won't break if some properties still use old identifiers temporarily

## 🧪 Testing Checklist

After running the SQL script, test:

- [ ] Kanban board loads properties correctly
- [ ] Clicking a property card navigates to detail page
- [ ] Property detail page loads correctly
- [ ] Navigation back to kanban works
- [ ] Lead assignment to properties works (if using leads feature)
- [ ] Property search/filtering works

## 🐛 Troubleshooting

### Issue: Properties not loading
- **Check**: Verify SQL backfill ran successfully
- **Check**: Ensure `property_unique_id` column exists and has values
- **Check**: Browser console for Supabase errors

### Issue: 404 on property detail pages
- **Check**: Old URLs might use `property_ref_id` or `id` instead of `property_unique_id`
- **Solution**: Update bookmarks/links, or add temporary redirect logic

### Issue: Lead assignments broken
- **Check**: `leads_properties.properties_unique_id` values match `properties.property_unique_id`
- **Solution**: Run `SQL/create_leads_properties_table.sql` to create/migrate the table

---

**Migration completed on:** [Date]
**Status:** ✅ Code changes complete, SQL script ready to run
