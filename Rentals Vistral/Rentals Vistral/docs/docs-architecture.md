# Tech Spec: Document Management Architecture V2.1 (Client, Property & Tenant)

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

We need to align the `properties` table with the new structure.0

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
* `tenant_identity_doc_url`
* `tenant_custom_identity_documents`
* `tenant_custom_other_documents`
* `custom_insurance_documents`
* `custom_technical_documents` (Pluralized)
* `custom_legal_documents`
* `custom_supplies_documents`
* `property_custom_other_documents` (Renamed for consistency)
* `rental_custom_contractual_financial_documents` (Rental – contractual/financial other docs)
* `rental_custom_utilities_documents` (Rental – utilities other docs)
* `rental_custom_other_documents` (Rental – other docs)

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

**Important:** As of 2026-02-05, photo URLs are stored within the `technical_inspection_report` JSONB field in the database, not in individual columns. However, the field names listed below are still used by the API routes to determine the correct storage folder path.

#### 1. Marketing/Commercial Photos
*Used for property listings, advertisements, and marketing materials.*

| Field Name (API Mapping) | Folder Path | Database Storage | Description |
| :--- | :--- | :--- | :--- |
| `marketing_photos_common_areas` | `/{property_unique_id}/photos/marketing/common_areas/` | `technical_inspection_report.common_areas.marketing_photos[]` | Marketing photos - Common areas |
| `marketing_photos_entry_hallways` | `/{property_unique_id}/photos/marketing/entry_hallways/` | `technical_inspection_report.entry_hallways.marketing_photos[]` | Marketing photos - Entry and hallways |
| `marketing_photos_bedrooms` | `/{property_unique_id}/photos/marketing/bedrooms/` | `technical_inspection_report.bedrooms[].marketing_photos[]` | Marketing photos - Bedrooms (one array per bedroom) |
| `marketing_photos_living_room` | `/{property_unique_id}/photos/marketing/living_room/` | `technical_inspection_report.living_room.marketing_photos[]` | Marketing photos - Living room |
| `marketing_photos_bathrooms` | `/{property_unique_id}/photos/marketing/bathrooms/` | `technical_inspection_report.bathrooms[].marketing_photos[]` | Marketing photos - Bathrooms (one array per bathroom) |
| `marketing_photos_kitchen` | `/{property_unique_id}/photos/marketing/kitchen/` | `technical_inspection_report.kitchen.marketing_photos[]` | Marketing photos - Kitchen |
| `marketing_photos_exterior` | `/{property_unique_id}/photos/marketing/exterior/` | `technical_inspection_report.exterior.marketing_photos[]` | Marketing photos - Exterior |
| `marketing_photos_garage` | `/{property_unique_id}/photos/marketing/garage/` | `technical_inspection_report.garage.marketing_photos[]` | Marketing photos - Garage (conditional) |
| `marketing_photos_terrace` | `/{property_unique_id}/photos/marketing/terrace/` | `technical_inspection_report.terrace.marketing_photos[]` | Marketing photos - Terrace (conditional) |
| `marketing_photos_storage` | `/{property_unique_id}/photos/marketing/storage/` | `technical_inspection_report.storage.marketing_photos[]` | Marketing photos - Storage room (conditional) |

#### 2. Incident Photos
*Used to document damages, technical issues, or problems found during inspection.*

| Field Name (API Mapping) | Folder Path | Database Storage | Description |
| :--- | :--- | :--- | :--- |
| `incident_photos_common_areas` | `/{property_unique_id}/photos/incidents/common_areas/` | `technical_inspection_report.common_areas.incident_photos[]` | Incident photos - Common areas |
| `incident_photos_entry_hallways` | `/{property_unique_id}/photos/incidents/entry_hallways/` | `technical_inspection_report.entry_hallways.incident_photos[]` | Incident photos - Entry and hallways |
| `incident_photos_bedrooms` | `/{property_unique_id}/photos/incidents/bedrooms/` | `technical_inspection_report.bedrooms[].incident_photos[]` | Incident photos - Bedrooms (one array per bedroom) |
| `incident_photos_living_room` | `/{property_unique_id}/photos/incidents/living_room/` | `technical_inspection_report.living_room.incident_photos[]` | Incident photos - Living room |
| `incident_photos_bathrooms` | `/{property_unique_id}/photos/incidents/bathrooms/` | `technical_inspection_report.bathrooms[].incident_photos[]` | Incident photos - Bathrooms (one array per bathroom) |
| `incident_photos_kitchen` | `/{property_unique_id}/photos/incidents/kitchen/` | `technical_inspection_report.kitchen.incident_photos[]` | Incident photos - Kitchen |
| `incident_photos_exterior` | `/{property_unique_id}/photos/incidents/exterior/` | `technical_inspection_report.exterior.incident_photos[]` | Incident photos - Exterior |
| `incident_photos_garage` | `/{property_unique_id}/photos/incidents/garage/` | `technical_inspection_report.garage.incident_photos[]` | Incident photos - Garage (conditional) |
| `incident_photos_terrace` | `/{property_unique_id}/photos/incidents/terrace/` | `technical_inspection_report.terrace.incident_photos[]` | Incident photos - Terrace (conditional) |
| `incident_photos_storage` | `/{property_unique_id}/photos/incidents/storage/` | `technical_inspection_report.storage.incident_photos[]` | Incident photos - Storage room (conditional) |

**Notes:**
- **Bucket:** All photos are stored in `properties-public-docs` (public access)
- **Folder Structure:** Photos are organized by type (`marketing/` vs `incidents/`) and then by room/area
- **Database Storage:** Photo URLs are stored within the `technical_inspection_report` JSONB field, grouped by room
- **Field Name Mapping:** The field names (e.g., `marketing_photos_common_areas`) are used by API routes to determine the correct storage folder path, but the actual URLs are stored in the JSONB structure
- **Conditional Fields:** Garage, terrace, and storage photos are only used if the property has these features
- **Array Fields:** Bedrooms and bathrooms store photos as arrays within their respective room objects in the JSONB structure
- **Full Path Pattern:** `{property_unique_id}/photos/{type}/{estancia}/{filename}`
- **Migration:** See `SQL/migrate_technical_inspection_to_json.sql` for details on the migration from individual columns to JSONB

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

#### C. TENANT SECTION (Folder 1: `tenant`)

| Sub-Folder (Folder 2) | SQL Variable (DB) | Type | Full Storage Path |
| :--- | :--- | :--- | :--- |
| **identity** | `tenant_identity_doc_url` | TEXT (Fixed) | `/tenant/identity/` |
| **identity** | `tenant_custom_identity_documents` | JSONB (Custom) | `/tenant/identity/` |
| **other** | `tenant_custom_other_documents` | JSONB (Custom) | `/tenant/other/` |

#### D. RENTAL SECTION (Folder 1: `rental`)

*Documents related to rental contracts and lease agreements (Phase 4: Inquilino aceptado) and guarantee documents (Phase 5: Pendiente de trámites).*

**Structure:** `rental` (Folder 1) contains three subfolders (Folder 2): `contractual_financial`, `utilities`, and `other`.

**1. Contractual & Financial (Folder 2: `contractual_financial`)**

Documents are stored in sub-subfolders (Folder 3) as follows:

| Sub-Sub-Folder (Folder 3) | SQL Variable (DB) | Type | Full Storage Path |
| :--- | :--- | :--- | :--- |
| **lease_contract** | `signed_lease_contract_url` | TEXT (Fixed) | `/rental/contractual_financial/lease_contract/` |
| **non-payment_insurance** | `guarantee_file_url` | TEXT (Fixed) | `/rental/contractual_financial/non-payment_insurance/` |
| **deposit** | `deposit_receipt_file_url` | TEXT (Fixed) | `/rental/contractual_financial/deposit/` |
| **first_rent_payment** | `first_rent_payment_file_url` | TEXT (Fixed) | `/rental/contractual_financial/first_rent_payment/` |
| **other** | `rental_custom_contractual_financial_documents` | JSONB (Custom) | `/rental/contractual_financial/other/` |

**2. Utilities (Folder 2: `utilities`)**

| Sub-Folder (Folder 2) | SQL Variable (DB) | Type | Full Storage Path |
| :--- | :--- | :--- | :--- |
| **utilities** | `tenant_contract_electricity` | TEXT (Fixed) | `/rental/utilities/` |
| **utilities** | `tenant_contract_water` | TEXT (Fixed) | `/rental/utilities/` |
| **utilities** | `tenant_contract_gas` | TEXT (Fixed) | `/rental/utilities/` |
| **utilities** | `rental_custom_utilities_documents` | JSONB (Custom) | `/rental/utilities/` |

**3. Other (Folder 2: `other`)**

| Sub-Folder (Folder 2) | SQL Variable (DB) | Type | Full Storage Path |
| :--- | :--- | :--- | :--- |
| **other** | `rental_custom_other_documents` | JSONB (Custom) | `/rental/other/` |

**Notes:**
- The lease contract is a single document (TEXT field, not JSONB array)
- Only one contract can be uploaded at a time
- To replace the contract, the existing one must be deleted first
- The guarantee file (`guarantee_file_url`) stores the signed Finaer non-payment insurance document (Phase 5)
- **Deposit receipt** (Phase 5: Depósito de la fianza):
  - `deposit_receipt_file_url` stores the deposit receipt document (Resguardo del depósito de la fianza)
  - Only required when `deposit_responsible` is "Prophero"
  - Stored in `/rental/contractual_financial/deposit/`
- **Tenant utilities contracts** (Phase 5: Cambio de suministros):
  - `tenant_contract_electricity`, `tenant_contract_water`, `tenant_contract_gas` are single documents (TEXT fields)
  - `rental_custom_utilities_documents` is a JSONB array supporting multiple "other" supply contracts (internet, phone, etc.; sección "Otros" en la UI)
  - Structure for `rental_custom_utilities_documents`: `[{title: string, url: string, createdAt: string}]`
  - All tenant utility contracts and custom utilities documents are stored in `/rental/utilities/`
- **First rent payment transfer receipt** (Phase 5: Transferencia del mes en curso):
  - `first_rent_payment_file_url` stores the transfer receipt document (Comprobante de transferencia del mes en curso)
  - Required to complete the "Transferencia del mes en curso" section
  - Stored in `/rental/contractual_financial/first_rent_payment/`
- **Custom rental documents:** `rental_custom_contractual_financial_documents`, `rental_custom_utilities_documents`, and `rental_custom_other_documents` are JSONB arrays for additional documents in each category. Structure: `[{title: string, url: string, createdAt: string}]`
- Documents are stored in the `properties-restricted-docs` bucket

---

## 4. Implementation Rules for Cursor
1.  **Upload Logic:** When creating an upload function, ALWAYS check the target SQL variable name against this matrix to determine the destination Bucket and Folder.
2.  **Naming Convention:**
    * Files should be renamed upon upload to avoid conflicts.
    * Format: `[variable_name]_[timestamp].[ext]` (e.g., `doc_bill_electricity_17150022.pdf`).
3.  **Hybrid Model:** Support both Fixed (TEXT) and Custom (JSONB) document types according to the mapping matrix above.
4.  **Folder Hierarchy:** Always follow the strict folder structure: `{property_unique_id}/{Folder_1}/{Folder_2}/{Folder_3}/{filename}`.
5.  **Terminology:** Use "Client" terminology consistently instead of "Owner" or "Investor".