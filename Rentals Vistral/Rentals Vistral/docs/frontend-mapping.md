# Frontend vs Backend Mapping
*This document acts as the Single Source of Truth for connecting UI components to Supabase variables.*

> **Note:** All document fields use the `SmartDocumentField` component with View/Edit/Upload functionality. See `docs/component-behaviors.md` for detailed behavior documentation.

## 1. Tab: Resumen Propiedad (`PropertySummaryTab`)
*Variables related to the physical and legal status of the asset.*

| Visual Block | Sub-Section | UI Label (Spanish) | Supabase Variable |
| :--- | :--- | :--- | :--- |
| **Visual & Map** | Gallery (Left) | Fotos de la propiedad | `pics_urls` |
| **Visual & Map** | Gallery (Left) | *Filmstrip Navigation* | *Left/Right arrows outside thumbnail strip, centered active thumbnail* |
| **Visual & Map** | Location (Right) | Mapa (Google Maps) | *(Componente)* |
| **Asset Data** | Identity | Dirección | `address` |
| **Asset Data** | Identity | Ciudad | `city` |
| **Asset Data** | Identity | ID Propiedad | `property_unique_id` |
| **Asset Data** | Identity | Cluster/Zona | `area_cluster` |
| **Asset Data** | Identity | Tipo de Activo | `property_asset_type` |
| **Technical Specs** | A. Distribution | Superficie (m²) | `square_meters` |
| **Technical Specs** | A. Distribution | Habitaciones | `bedrooms` |
| **Technical Specs** | A. Distribution | Baños | `bathrooms` |
| **Technical Specs** | A. Distribution | Piso | `floor_number` |
| **Technical Specs** | B. Building & Exterior | Año de construcción | `construction_year` |
| **Technical Specs** | B. Building & Exterior | Orientación | `orientation` |
| **Technical Specs** | B. Building & Exterior | Garaje | `garage` |
| **Technical Specs** | B. Building & Exterior | Ascensor | `has_elevator` |
| **Technical Specs** | B. Building & Exterior | Terraza/Balcón | `has_terrace` |
| **Logistics** | Logistics | Localización de Llaves | `keys_location` |
| **Logistics** | Logistics | Administrador | `admin_name` |
| **Legal Status** | Payments/Status | Pagos Comunidad | `community_fees_paid` |
| **Legal Status** | Payments/Status | Pagos IBI/Impuestos | `taxes_paid` |
| **Legal Status** | Payments/Status | Inspección (ITV / ITE) | `itv_passed` |
| **Documentation** | Filter: Legal | Contrato Compraventa | `doc_purchase_contract` |
| **Documentation** | Filter: Legal | Nota Simple | `doc_land_registry_note` |
| **Documentation** | Filter: Legal | Certificado de eficiencia energética | `doc_energy_cert` |
| **Documentation** | Filter: Legal | Documentos de reforma | `doc_renovation_files` |
| **Documentation** | Filter: Insurance | Póliza de seguro | `home_insurance_policy_url` |
| **Documentation** | Filter: Insurance | Seguro del Hogar | `home_insurance_type` *(Styled as standard grid item)* |
| **Documentation** | Filter: Supplies | Electricidad (Contrato) | `doc_contract_electricity` |
| **Documentation** | Filter: Supplies | Electricidad (Factura) | `doc_bill_electricity` |
| **Documentation** | Filter: Supplies | Agua (Contrato) | `doc_contract_water` |
| **Documentation** | Filter: Supplies | Agua (Factura) | `doc_bill_water` |
| **Documentation** | Filter: Supplies | Gas (Contrato) | `doc_contract_gas` |
| **Documentation** | Filter: Supplies | Gas (Factura) | `doc_bill_gas` |
| **Documentation** | Filter: Supplies | Otros (Contrato) | `doc_contract_other` |
| **Documentation** | Filter: Supplies | Otros (Factura) | `doc_bill_other` |
| **Economic Information** | Component 1: FinancialPerformanceWidget | Plan de inversión (Objetivo) | `target_rent_price`, `expected_yield` |
| **Economic Information** | Component 1: FinancialPerformanceWidget | En publicación (Pre-Rent) | `announcement_price` *(Condition: Status is "Publicado" / Not Rented)* |
| **Economic Information** | Component 1: FinancialPerformanceWidget | Cierre real (Rented) | `final_rent_price`, `actual_yield` *(Condition: Status is "Alquilado" or later)* |
| **Economic Information** | Component 2: TimeMetricsWidget | Desde fin reforma | Calculated from `reno_end_date` |
| **Economic Information** | Component 2: TimeMetricsWidget | Días en mercado | `vacancy_gap_days` |
| **Economic Information** | Component 2: TimeMetricsWidget | Días en fase actual | `days_in_stage` or `days_in_phase` |

**Economic Information Component Details:**

#### Component 1: FinancialPerformanceWidget (`components/property/FinancialPerformanceWidget.tsx`)
* **Location:** `components/property/FinancialPerformanceWidget.tsx`
* **Props:** Accepts the full `property` object.
* **Layout:** Split Card (Grid cols-2) with vertical divider.
* **Left Column (Static - "North Star"):**
    * **Title:** "Plan de inversión (Objetivo)" (Sentence case).
    * **Background:** Very light neutral gray (`bg-gray-50/50`).
    * **Data:** Display `property.target_rent_price` (Currency) and `property.expected_yield` (Percentage).
    * **Style:** Neutral colors, standard font weight.
* **Right Column (Dynamic - "Realidad"):**
    * **Condition A (Pre-Rented/Commercialization):**
        * **Title:** "En publicación" (Sentence case).
        * **Data:** Display `property.announcement_price` and calculate the *Implied Yield* based on this price (if possible, otherwise show "--").
        * **Style:** Neutral/Blue standard styling.
    * **Condition B (Rented - Phase "Alquilado" or later):**
        * **Title:** "Cierre real" (Sentence case).
        * **Data:** Display `property.final_rent_price` and `property.actual_yield`.
        * **VISUAL FEEDBACK (Crucial):**
            * Compare `actual_yield` vs `expected_yield`.
            * **IF Actual >= Expected:** Render values in **GREEN** (`text-green-600`) + Add a `TrendingUp` icon.
            * **IF Actual < Expected:** Render values in **ORANGE/RED** + Add a `TrendingDown` icon.

#### Component 2: TimeMetricsWidget (`components/property/TimeMetricsWidget.tsx`)
* **Location:** `components/property/TimeMetricsWidget.tsx`
* **Props:** Accepts the full `property` object.
* **Layout:** Clean horizontal bar with 3 distinct sections (3 cols). Use `divide-x` for separation.
* **Typography Rule:** **NO UPPERCASE** for labels. Use "Sentence case" (e.g., "Desde fin reforma", not "DESDE FIN REFORMA").
    * *Labels:* `text-sm text-muted-foreground`.
    * *Values:* `text-2xl font-bold text-gray-900`.
* **Metrics:**
    * **Metric 1:** "Desde fin reforma"
        * *Calculation:* `differenceInDays(new Date(), new Date(property.reno_end_date))` (Handle nulls).
        * *Icon:* `Construction` or `Hammer` (Lucide).
    * **Metric 2:** "Días en mercado"
        * *Data:* Use `property.vacancy_gap_days` (or relevant market time field).
        * *Icon:* `Store` or `Megaphone`.
    * **Metric 3:** "Días en fase actual"
        * *Data:* Use `property.days_in_stage` (or `days_in_phase`).
        * *Icon:* `Clock` or `Hourglass`.

---

## 2. Tab: Resumen Inversor (`InvestorSummaryTab`)
*Variables related to the owner/investor of the property.*

| Visual Block | UI Label (Spanish) | Supabase Variable |
| :--- | :--- | :--- |
| **Investor Data** | Nombre Completo | `client_full_name` |
| **Investor Data** | Número de Identificación | `client_identity_doc_number` |
| **Investor Data** | Documento de Identidad | `client_identity_doc_url` |
| **Investor Data** | Teléfono | `client_phone` |
| **Investor Data** | Email | `client_email` |
| **Investor Data** | Cuenta bancaria | `client_iban` |
| **Investor Data** | Certificado de titularidad bancaria | `client_bank_certificate_url` |

---

## 3. Tab: Inquilino (Tenant) (`TenantSummaryTab`)
*Variables related to the tenant of the property.*

**Visibility Rule:** This tab is **HIDDEN** by default. It MUST only appear when the Property Status/Phase is **'Inquilino aceptado'** (Phase Index 3) or any subsequent phase (including 'Gestión de cartera' phases: 'Alquilado', 'Actualización de Renta (IPC)', 'Gestión de Renovación', 'Finalización y Salida').

| Visual Block | UI Label (Spanish) | Supabase Variable |
| :--- | :--- | :--- |
| **Tenant Data** | Nombre Completo | `tenant_full_name` |
| **Tenant Data** | Número de Identificación | `tenant_nif` |
| **Tenant Data** | Teléfono | `tenant_phone` *(Clickable `tel:` link)* |
| **Tenant Data** | Email | `tenant_email` *(Clickable `mailto:` link)* |

**Style Requirements:**
- Must match the **Exact Visual Style** of the "Investor Tab" (`InvestorSummaryTab`)
- Grid layout with Label/Value pairs
- Read-only look (`bg-muted/50` on inputs)
- Same card structure and spacing
- Phone and Email fields must be clickable links (`tel:` and `mailto:` protocols)

---

## 4. Tab: Notas (Notes) (`PropertyNotesTab`)
*Dedicated tab for managing property notes and comments.*

| Visual Block | UI Label (Spanish) | Component/Functionality |
| :--- | :--- | :--- |
| **Notes Input** | Nueva Nota | Textarea for inputting new notes |
| **Notes Input** | Guardar Nota | Button to save new notes |
| **Notes Filter** | Filter Chips | Filter notes by phase (Current Phase + Previous Phases) |
| **Notes Display** | Notes Feed | List of notes with author, timestamp, and phase information |
| **Notes Features** | @Mentions | Support for @mention syntax in notes |
| **Notes Features** | Phase Filtering | View notes filtered by current phase or previous phases |
| **Notes Features** | Historical Notes | View notes from previous phases in reverse chronological order |

**Functionality:**
- **Inputting new notes:** Users can write notes in a textarea with support for @mentions
- **Saving notes:** Notes are saved with author, timestamp, and current phase information
- **Viewing history:** Notes can be filtered by phase (current phase or any previous phase)
- **Notes display:** Each note shows author name, relative time (e.g., "hace 2h"), creation time (e.g., "14:30"), and the note text with @mention highlighting

---

## 5. UI Component Behavior Guidelines

### 3.1 Image Gallery (Filmstrip Layout)
* **Layout:** Top: Main Image (Large). Bottom: Thumbnail Strip.
* **Navigation:** Arrows must be OUTSIDE the thumbnail strip.
* **Selection:** Clicking a thumbnail makes it active and centers it.

### 3.2 Smart Document Fields (Interaction Rules)

#### A. SmartDocumentField (Single Text Fields)
* **Visuals:**
    * *Empty:* Dashed border button "Subir Documento"
    * *Filled:* Filename button + Pencil button + **Trash button**
* **Actions:**
    * *View:* Click filename to open preview modal
    * *Edit:* Click pencil icon to replace file
    * *Delete:* Click trash icon to delete file and set field to `null`
* **Data Logic:**
    * Replace file when uploading to non-empty field
    * Delete old file from storage when replacing or deleting
    * **Instant updates** - No page refresh
    * **Scroll behavior:** Scrolls to field on upload/edit, no scroll on delete

#### B. SmartDocumentFieldArray (JSONB Array Fields)
* **Visuals:**
    * *Empty:* "Subir Documento" button with dashed border (matches SmartDocumentField)
    * *Filled:* List of all files + "Añadir" button in header
* **Actions:**
    * *View:* Click eye icon to open preview modal
    * *Delete:* Click trash icon to remove from array
    * *Upload (when empty):* Click "Subir Documento" button to upload first file
    * *Upload (when filled):* Click "Añadir" button to append additional files
* **Data Logic:**
    * Always append new files to array (never replace)
    * Delete removes specific URL from array (not entire field)
    * **Instant updates** - No page refresh
    * **Scroll behavior:** Scrolls to field on upload, no scroll on delete

### 3.3 Upload/Delete Backend Sync (No Page Refresh!)

#### Upload Logic
When a file is uploaded:
1. **Upload:** Upload the new file to the specific Bucket and Path (from architecture)
2. **Get URL:** Generate signed URL (10-year expiry)
3. **Update DB:** 
   - *Single fields:* Replace URL value
   - *Array fields:* Append URL to array
4. **Update Local State:** Instant UI update (no page refresh)
5. **Scroll:** Smooth scroll to field (so you can see the new document)
6. **Cleanup (If replacing):** Delete old file from bucket

#### Delete Logic
When a file is deleted:
1. **Confirmation:** Show confirmation dialog before proceeding
2. **Update DB:**
   - *Single fields:* Set field to `null`
   - *Array fields:* Remove URL from array
3. **Delete Storage:** Delete file from Supabase Storage bucket
4. **Update Local State:** Instant UI update (no page refresh)
5. **No Scroll:** Stays at current position (prevents layout shifts)

### 3.4 Supply Icons Design (Documents Tab)
* **Design Rule:** Supply icons (Electricity, Water, Gas, etc.) in the Documents Tab must be **neutral/monochrome** (e.g., gray or default text color) to maintain a clean UI. Do NOT use specific colors like yellow for electricity, blue for water, or orange for gas. All supply icons should use the same neutral color scheme as other document icons (`text-[#6B7280] dark:text-[#9CA3AF]` or equivalent).

---

## 6. Component Behaviors

### Document Fields
All document fields listed above use the `SmartDocumentField` component which provides:
- **View:** Opens document in floating modal (PDFs via iframe, images via img tag)
- **Edit:** File picker to replace existing document (when document exists)
- **Upload:** File picker to upload new document (when no document exists)

### Gallery Filmstrip
- **Layout:** Main image (top) + Thumbnail strip with external arrows (bottom)
- Active thumbnail automatically centers in scrollable strip
- Navigation arrows positioned outside thumbnail strip (not overlaying)
- Inactive thumbnails have reduced opacity (60%), active has full opacity
- Smooth fade transitions on main image changes
- Clicking main image opens full-screen modal

See `docs/component-behaviors.md` for complete documentation.

---

## 7. Component Usage by Field Type

### JSONB Array Fields (use SmartDocumentFieldArray)
These fields display **all** files in the array:
- `doc_renovation_files` - Documentos de reforma
- `pics_urls` - Fotos de la propiedad (gallery)

### Single Text Fields (use SmartDocumentField)
All other document fields use SmartDocumentField with view/edit/delete actions:
- `doc_purchase_contract`
- `doc_land_registry_note`
- `doc_energy_cert`
- `home_insurance_policy_url`
- `doc_contract_electricity`, `doc_bill_electricity`
- `doc_contract_water`, `doc_bill_water`
- `doc_contract_gas`, `doc_bill_gas`
- `doc_contract_other`, `doc_bill_other`
- `client_identity_doc_url`
- `client_bank_certificate_url`

---

## 8. Widget Guidelines: Progress & Navigation

### 6.1 Progress Overview Widget (Logic)

**Calculation:** Progress % is based on **VALIDATION** (valid vs invalid), not just "filled".
* *Constraint:* Invalid data (e.g., bad email format) counts as 0%.

**Dynamic Scope:** Sections hidden by conditional logic must be **excluded** from the math.

**Visual States:**
* *Completed:* Green Check Icon (✓) + Green Text. **NO Strikethrough.**
* *Pending:* Counter Badge (e.g., "1/3") + Bold Black Text.
* *Mandatory:* Use badge "(Obligatorio)" instead of red asterisks.

### 6.2 The "Focus Tunnel" Interaction

When a user clicks a **Pending Item** in the widget, the app must trigger this exact sequence:

1. **Scroll:** Smooth scroll to the target section ID.
2. **Section Pop:** Apply a visual "Pop" animation (`scale-105`, duration-200) to the section container.
3. **Auto-Focus:** Focus the **first empty input** in that section.
4. **Input Flash:** Trigger a "Yellow Pulse" animation (`animate-pulse` + `ring-2 ring-yellow-400`) specifically on the empty input.
