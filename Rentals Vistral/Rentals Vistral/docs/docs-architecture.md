# Tech Spec: Document Management Architecture V2.1 (Client & Property)

**Context:**
Refactoring document management to a "Hybrid Model" (Fixed + Custom) with strict folder hierarchy and unified naming ("Client" instead of Owner/Investor).

---

## 1. Storage Buckets Strategy

We use two distinct Supabase Storage buckets to enforce security policies.

### A. Bucket: `properties-public-docs`
* **Privacy:** PUBLIC (Accessible via public URL).
* **Content:** Marketing assets, gallery images.
* **Allowed Types:** Images (JPG, PNG, WEBP).

### B. Bucket: `properties-restricted-docs`
* **Privacy:** PRIVATE (Requires RLS Policy & Auth Token).
* **Content:** Sensitive legal contracts, invoices, personal IDs, financial certificates.
* **Allowed Types:** PDF, Images, DOCX.

---

## 2. Database Schema Refactor (Migration)

We need to align the `properties` table with the new structure.

### A. Fields to DELETE (Cleanup)
These fields are deprecated or replaced by the new structure.
* `custom_investor_documents` (Replaced by `client_custom_...`)
* `doc_contract_other` (Moved to generic supplies json)
* `doc_bill_other` (Moved to generic supplies json)
* `custom_property_documents` (Renamed if it existed previously)

### B. Fields to CREATE (New JSONB)
Type: `jsonb` | Default: `[]`
* `client_custom_identity_documents`
* `client_custom_financial_documents`
* `client_custom_other_documents`
* `custom_insurance_documents`
* `custom_technical_documents` (Pluralized)
* `custom_legal_documents`
* `custom_supplies_documents`
* `property_custom_other_documents` (Renamed for consistency)

---

## 3. Storage Mapping Matrix

**Root Path Pattern:**
`{bucket_name}/{property_unique_id}/{Folder_1}/{Folder_2}/{Folder_3}/{filename}`

### A. Public Assets (Bucket: `properties-public-docs`)

| SQL Variable (Supabase) | Folder Path | Description |
| :--- | :--- | :--- |
| `pics_urls` | `/{property_unique_id}/gallery/` | Main property marketing photos. |

### B. Property Photos - Phase 2 "Listo para Alquilar" (Bucket: `properties-public-docs`)

**Context:** Phase 2 requires two types of photos: Marketing/Commercial photos and Incident photos. These are stored separately to maintain clear organization.

#### 1. Marketing/Commercial Photos
*Used for property listings, advertisements, and marketing materials.*

| SQL Variable (Supabase) | Folder Path | Description |
| :--- | :--- | :--- |
| `marketing_photos_common_areas` | `/{property_unique_id}/photos/marketing/common_areas/` | Marketing photos - Common areas |
| `marketing_photos_entry_hallways` | `/{property_unique_id}/photos/marketing/entry_hallways/` | Marketing photos - Entry and hallways |
| `marketing_photos_bedrooms` | `/{property_unique_id}/photos/marketing/bedrooms/` | Marketing photos - Bedrooms (array of arrays, one per bedroom) |
| `marketing_photos_living_room` | `/{property_unique_id}/photos/marketing/living_room/` | Marketing photos - Living room |
| `marketing_photos_bathrooms` | `/{property_unique_id}/photos/marketing/bathrooms/` | Marketing photos - Bathrooms (array of arrays, one per bathroom) |
| `marketing_photos_kitchen` | `/{property_unique_id}/photos/marketing/kitchen/` | Marketing photos - Kitchen |
| `marketing_photos_exterior` | `/{property_unique_id}/photos/marketing/exterior/` | Marketing photos - Exterior |
| `marketing_photos_garage` | `/{property_unique_id}/photos/marketing/garage/` | Marketing photos - Garage (conditional) |
| `marketing_photos_terrace` | `/{property_unique_id}/photos/marketing/terrace/` | Marketing photos - Terrace (conditional) |
| `marketing_photos_storage` | `/{property_unique_id}/photos/marketing/storage/` | Marketing photos - Storage room (conditional) |

#### 2. Incident Photos
*Used to document damages, technical issues, or problems found during inspection.*

| SQL Variable (Supabase) | Folder Path | Description |
| :--- | :--- | :--- |
| `incident_photos_common_areas` | `/{property_unique_id}/photos/incidents/common_areas/` | Incident photos - Common areas |
| `incident_photos_entry_hallways` | `/{property_unique_id}/photos/incidents/entry_hallways/` | Incident photos - Entry and hallways |
| `incident_photos_bedrooms` | `/{property_unique_id}/photos/incidents/bedrooms/` | Incident photos - Bedrooms (array of arrays, one per bedroom) |
| `incident_photos_living_room` | `/{property_unique_id}/photos/incidents/living_room/` | Incident photos - Living room |
| `incident_photos_bathrooms` | `/{property_unique_id}/photos/incidents/bathrooms/` | Incident photos - Bathrooms (array of arrays, one per bathroom) |
| `incident_photos_kitchen` | `/{property_unique_id}/photos/incidents/kitchen/` | Incident photos - Kitchen |
| `incident_photos_exterior` | `/{property_unique_id}/photos/incidents/exterior/` | Incident photos - Exterior |
| `incident_photos_garage` | `/{property_unique_id}/photos/incidents/garage/` | Incident photos - Garage (conditional) |
| `incident_photos_terrace` | `/{property_unique_id}/photos/incidents/terrace/` | Incident photos - Terrace (conditional) |
| `incident_photos_storage` | `/{property_unique_id}/photos/incidents/storage/` | Incident photos - Storage room (conditional) |

**Notes:**
- **Bucket:** All photos are stored in `properties-public-docs` (public access)
- **Folder Structure:** Photos are organized by type (`marketing/` vs `incidents/`) and then by room/area
- **Conditional Fields:** Garage, terrace, and storage photos are only used if the property has these features
- **Array Fields:** Bedrooms and bathrooms use arrays of arrays to support multiple rooms
- **Full Path Pattern:** `{property_unique_id}/photos/{type}/{estancia}/{filename}`

### B. Restricted Documents (Bucket: `properties-restricted-docs`)

#### A. CLIENT SECTION (Folder 1: `client`)
*Standardized on "Client" terminology.*

| Sub-Folder (Folder 2) | SQL Variable (DB) | Type | Full Storage Path |
| :--- | :--- | :--- | :--- |
| **identity** | `client_identity_doc_url` | TEXT (Fixed) | `/client/identity/` |
| **identity** | `client_custom_identity_documents` | JSONB (Custom) | `/client/identity/` |
| **financial** | `client_bank_certificate_url` | TEXT (Fixed) | `/client/financial/` |
| **financial** | `client_custom_financial_documents` | JSONB (Custom) | `/client/financial/` |
| **other** | `client_custom_other_documents` | JSONB (Custom) | `/client/other/` |

#### B. PROPERTY SECTION (Folder 1: `property`)

**1. Insurance**
| Sub-Folder (Folder 2) | SQL Variable (DB) | Type | Full Storage Path |
| :--- | :--- | :--- | :--- |
| **insurance** | `home_insurance_policy_url` | TEXT (Fixed) | `/property/insurance/` |
| **insurance** | `custom_insurance_documents` | JSONB (Custom) | `/property/insurance/` |

**2. Technical**
| Sub-Folder (Folder 2) | SQL Variable (DB) | Type | Full Storage Path |
| :--- | :--- | :--- | :--- |
| **technical** | `doc_renovation_files` | TEXT (Fixed) | `/property/technical/renovation/` |
| **technical** | `doc_energy_cert` | TEXT (Fixed) | `/property/technical/energy_certificate/` |
| **technical** | `custom_technical_documents` | JSONB (Custom) | `/property/technical/custom/` |

**3. Legal**
| Sub-Folder (Folder 2) | SQL Variable (DB) | Type | Full Storage Path |
| :--- | :--- | :--- | :--- |
| **legal** | `doc_purchase_contract` | TEXT (Fixed) | `/property/legal/purchase_contract/` |
| **legal** | `doc_land_registry_note` | TEXT (Fixed) | `/property/legal/land_registry_note/` |
| **legal** | `property_management_plan_contract_url` | TEXT (Fixed) | `/property/legal/property_management_plan_contract/` |
| **legal** | `custom_legal_documents` | JSONB (Custom) | `/property/legal/custom/` |

**4. Supplies**
*Note: Folder 3 defines the specific supply type.*
| Sub-Folder (Folder 2/3) | SQL Variable (DB) | Type | Full Storage Path |
| :--- | :--- | :--- | :--- |
| **supplies/electricity** | `doc_contract_electricity` | TEXT (Fixed) | `/property/supplies/electricity/` |
| **supplies/electricity** | `doc_bill_electricity` | TEXT (Fixed) | `/property/supplies/electricity/` |
| **supplies/water** | `doc_contract_water` | TEXT (Fixed) | `/property/supplies/water/` |
| **supplies/water** | `doc_bill_water` | TEXT (Fixed) | `/property/supplies/water/` |
| **supplies/gas** | `doc_contract_gas` | TEXT (Fixed) | `/property/supplies/gas/` |
| **supplies/gas** | `doc_bill_gas` | TEXT (Fixed) | `/property/supplies/gas/` |
| **supplies/other** | `custom_supplies_documents` | JSONB (Custom) | `/property/supplies/other/` |

**5. Other**
| Sub-Folder (Folder 2) | SQL Variable (DB) | Type | Full Storage Path |
| :--- | :--- | :--- | :--- |
| **other** | `property_custom_other_documents` | JSONB (Custom) | `/property/other/` |

---

## 4. Implementation Rules for Cursor

1.  **Upload Logic:** When creating an upload function, ALWAYS check the target SQL variable name against this matrix to determine the destination Bucket and Folder.
2.  **Naming Convention:**
    * Files should be renamed upon upload to avoid conflicts.
    * Format: `[variable_name]_[timestamp].[ext]` (e.g., `doc_bill_electricity_17150022.pdf`).
3.  **Hybrid Model:** Support both Fixed (TEXT) and Custom (JSONB) document types according to the mapping matrix above.
4.  **Folder Hierarchy:** Always follow the strict folder structure: `{property_unique_id}/{Folder_1}/{Folder_2}/{Folder_3}/{filename}`.
5.  **Terminology:** Use "Client" terminology consistently instead of "Owner" or "Investor".