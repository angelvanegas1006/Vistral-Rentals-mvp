# Property Card Specification (Full Page View)

## 1. Page Layout Architecture
The page `/rentals/property/[id]` follows a "Fixed Layout" structure:
* **Header (Top):** Full width.
* **Tabs (Below Header):** Full width navigation bar.
* **Main Container (Bottom):** Flex container with two areas:
    * **Left Area (Dynamic):** Occupies ~85% width (`flex-1`). Renders the active Tab content.
    * **Right Sidebar (Fixed):** Fixed width (`w-80`). **Global & Persistent** (always visible).

## 2. Component Details

### A. The Header
* **Left:** "Back to Kanban" button (`<-`).
* **Center/Left:** Text area with 2-row layout:
    * **Row 1 (Primary Info):**
        * **Address:** Text Large & Bold (`text-xl font-bold text-zinc-900`).
        * **City:** Displayed immediately after the address. Style: Lighter weight/color (`text-zinc-500 font-normal`). Separator: Use a comma or simple spacing.
    * **Row 2 (Metadata):**
        * **Property ID:** Monospace font, medium size, semibold, darker gray for prominence (`text-sm font-mono font-semibold text-zinc-600`).
        * **Phase Badge:** The Status Pill (visual badge). Displayed next to the ID.
* **Right:** "Reportar Incidencia" button.

### B. The Right Sidebar (Global Context)
* **Visibility:** Visible on Desktop (Sticky). Hidden on Mobile (Drawer).
* **Layout:** Fixed width (`w-80`), Sticky positioning. Persists across all Tabs.
* **Structural Layout (Static Control Panel):**
    * **Container:** Simple Flex Column (`h-full flex flex-col`).
    * **No Scroll Required:** Since Notes moved to a dedicated Tab, all sidebar content fits perfectly on screen without internal scrolling.
    * **Layout:** All widgets stack vertically with consistent spacing (`space-y-4`). Uses padding (`p-4`) for consistent margins.

* **Structure:** Three vertical widgets (Order is Critical):

#### Widget 1: Transition Control (Top)
* **Component:** `PhaseTransitionWidget`.
* **Behavior:** Static positioning at the top of the sidebar.
* **Logic:**
    * **State Source:** Must listen to the `PropertyFormContext` (from the "Espacio de trabajo" Tab).
    * **Condition:**
        * **Locked (Grey):** If Mandatory fields in the current phase are invalid/empty.
        * **Warning (Orange):** If Mandatory are done, but Optional fields are empty.
        * **Ready (Green):** If All fields are valid.
* **Action:** Clicking "Advance Phase" triggers the transition logic defined in the pipeline.

#### Widget 2: SLA Monitor (Time Health Widget)
* **Location:** Immediately below Transition Control.
* **Concept:** "Phase Health Gauge" - Visual progress indicator using Project Management terminology.
* **Visuals:**
    * **Header:** "Tiempo en fase" (Label) + "Día X de Y" (Value).
    * **Visual Bar:** A thin, rounded Progress Bar showing elapsed time vs Target.
* **Logic:**
    * **En plazo (On Track):** Progress Bar is Green (`bg-green-500`). Shows when `daysInPhase <= slaTargetDays * 0.8`. Status text: "En plazo".
    * **Riesgo (At Risk):** Progress Bar turns Yellow (`bg-yellow-500`) when approaching limit (`daysInPhase > slaTargetDays * 0.8` and `daysInPhase <= slaTargetDays`). Status text: "Riesgo".
    * **Vencido (Overdue):** Progress Bar turns RED (`bg-red-500`) and shows "X días fuera de plazo" when `daysInPhase > slaTargetDays`. Status text: "Vencido".
* **Progress Calculation:** `(daysInPhase / slaTargetDays) * 100` (capped at 100% for visual purposes, but can exceed for overdue state).

#### Widget 3: KPIs (Metrics)
* **Component:** `RentalKPIsWidget`.
* **Display:** Compact list of key metrics (Yield, Target Price, Days on Market, Vacancy Gap).
* **Data:** Read-only data from the property record.

## 3. The Tabs (Navigation & Data Grouping)
* **Tab 1: "Espacio de trabajo"** (Default)
    * **Focus:** Execution & Daily Tasks.
    * **Content:** * **Progress Summary:** Visual indicator of phase completion.
        * **Active Work Fields:** Forms to fill information, Document Uploaders, Checklists.
* **Tab 2: "Resumen Propiedad"**
    * **Focus:** The Physical & Operational Asset.
    * **Layout:** Vertical stack of **5 Distinct Blocks**:
    
    1. **Media & Location (Visual Header):**
        * **Layout:** Split View (50% / 50%).
        * **Left:** "Galería" (Filmstrip Gallery):
            * **Top:** Main Display (Large image, display only - no arrows overlaying).
            * **Bottom:** Thumbnail Strip with Navigation (`[Left Arrow] [Scrollable Thumbnails] [Right Arrow]`).
            * Arrows positioned outside the thumbnail strip (not overlaying).
            * Active thumbnail has full opacity with blue border/ring; inactive thumbnails have 60% opacity.
            * Clicking a thumbnail or arrow updates the Main Display with smooth fade transition.
        * **Right:** "Ubicación" (Map placeholder):
            * **Full Height and Width:** Map placeholder occupies the full height and width of its container card. No padding inside the card for the map.
    
    2. **Asset Identity (Context Bar):**
        * **Title:** "Datos del Activo".
        * **Fields:** Address, City, Property ID, Cluster/Zone, Asset Type.
    
    3. **Technical Specs (The Grid):**
        * **Sub-section A ("Distribución"):** Surface (m²), Bedrooms, Bathrooms, Floor.
        * **Sub-section B ("Edificio y Exteriores"):** Year, Orientation, Garage, Elevator (Yes/No), Terrace (Yes/No).
    
    4. **Operations & Compliance (Status):**
        * **Split into Two Separate Cards:**
        * **Widget A: "Logística" (Logistics):** Separate Card containing Keys Location and Administrator Name.
        * **Widget B: "Estado Legal y Pagos" (Legal & Compliance):** Separate Card containing Traffic Light system (Green/Red Badges) for: Community Payments, Tax/IBI Payments, Inspection (ITV/ITE).
    
    5. **Documents:**
        * **Title:** "Documentos" (renamed from "Bóveda de Documentos").
        * **UI:** Header with Search Bar + Filter Pills (`[Todos]`, `[Legal]`, `[Seguros]`, `[Suministros]`).
        * **Search Logic:** Must implement real-time filtering. The list must update immediately as the user types.
        * **Content:**
            * **Legal:** Deeds, Registry Note, Energy Cert, Renovation Docs.
            * **Insurance:** 
                * **Display Priority:** The Insurance Type (`home_insurance_type`) must be displayed PROMINENTLY.
                * **Format:** Label reads **"Seguro del Hogar: [Type]"** (e.g., "Seguro del Hogar: Mapfre") as the main bold text.
                * **Policy Document:** The Policy Document link/button appears next to or below the insurance type title, clearly associated with it.
            * **Supplies:** Group by utility (Electricity, Water, Gas). Show "Contract" and "Bill" buttons side-by-side for each.
        * **"All Documents" View (Grouping Logic):**
            * **When `activeFilter === 'all'`:** Documents are rendered **Grouped by Category** with distinct sub-headers.
            * **Visual Structure for "All":**
                * *Sub-header:* "LEGAL" (Text-xs, gray, uppercase) → List Legal Docs.
                * *Sub-header:* "SEGUROS" → List Insurance Info.
                * *Sub-header:* "SUMINISTROS" → List Supply Docs.
            * **Note:** If a specific filter (e.g., "Legal") is selected, show ONLY that list without the sub-headers (or keep the header, but just one block).

* **Tab 3: "Resumen Inversor"**
    * **Title:** **"Datos del Inversor"**.
    * **Focus:** The Client & Legal Relationship.
    * **Layout:** "Business/Profile Card" style.
    * **Fields:** Full Name, ID Number, ID Document (File), Email, Phone, IBAN, Bank Certificate (File).
* **Tab 4: "Resumen Inquilino"** (Conditional - Visible if `phase_index >= 3`)
    * **Trigger:** Starts appearing at **Phase Index 3 ("Inquilino aceptado")**.
    * **Persistence:** Remains visible for all subsequent phases (Indices 3, 4, 5...).
    * **Focus:** The Candidate/Tenant Profile.
    * **Data:** Personal Data, Financial Profile (Payslips, Work History), Bank Guarantees, Scoring/Solvency Reports.
* **Tab 5: "Alquiler"** (Conditional - Visible if `phase_index >= 4`)
    * **Trigger:** Starts appearing at **Phase Index 4 ("Pendiente de trámites")**.
    * **Persistence:** Remains visible for all subsequent phases (Indices 4, 5...).
    * **Focus:** The Lease Agreement.
    * **Data:** Lease Conditions (Rent Price, Start Date, Duration), Legal Contracts, Security Deposits (Fianza).
* **Tab 6: "Notas"**
    * **Focus:** Communication & Activity Timeline with Global Continuous Lifecycle.
    * **Core Concept:** The Property Lifecycle is CONTINUOUS across both Kanban boards. Notes created in "Kanban 1" must be visible as history when the property moves to "Kanban 2".
    * **Global Phase Sequence (Order is critical):**
        1. **Viviendas Prophero** (Index 0)
        2. **Listo para Alquilar** (Index 1)
        3. **Publicado** (Index 2)
        4. **Inquilino aceptado** (Index 3)
        5. **Pendiente de trámites** (Index 4) --- *Transition to Kanban 2* ---
        6. **Alquilado** (Index 5)
        7. **Actualización de Renta (IPC)** (Index 6)
        8. **Gestión de Renovación** (Index 7)
        9. **Finalización y Salida** (Index 8)
    * **Structure:** Three-zone layout with Filter Chip navigation pattern.
        * **Zone A (Top - Input):** Clear writing area
            * **Input:** Rich Text / Textarea with placeholder "Escribe una nota...".
            * **@Mention Highlighting:** Visual support for `@mentions` - words starting with `@` are highlighted in blue color (`text-blue-600 dark:text-blue-400`). This is frontend visual styling only for now.
            * **Submit:** "Guardar Nota" button to save the note.
        * **Zone B (Middle - Navigation):** Horizontal scrollable bar of Filter Chips (Pills)
            * **Default State:** The active filter MUST always default to **`[Fase Actual]`**.
            * **Options:** `[Fase Actual]` | `[Fase: Previous Phase N]` | `[Fase: Previous Phase N-1]` | etc.
            * **History Pills Logic:** To the right of the "Fase Actual" pill, render pills for **Previous Phases** only.
                * *Logic:* If current phase is Index 6 ("Actualización Renta"), show pills for indices 5, 4, 3... down to 0.
                * *Ordering:* Reverse chronological (most recent past phase first).
            * **Behavior:** Clicking a chip filters the list below (Zone C).
            * **Visual Style:** Active chip uses primary color, inactive chips use secondary/outline variant.
            * **Pill Style:** Use **Rectangular Pills** (`rounded-md`) instead of rounded-full.
        * **Zone C (Bottom - Feed):** List of note cards
            * **Sort:** Chronological (Newest first - descending timestamp).
            * **Note Card Design:**
                * **Header:** User Name + Timestamp (relative time, e.g., "hace 2h") + **Creation Time** (e.g., "14:30").
                * **Context:** Notes belong to the specific phase index where they were created.
                * **Body:** The note text with @mention highlighting applied.

## 4. Visual Style
* **Theme:** Blue & Zinc (Professional/Corporate).
* **Layout:** Main content area uses `bg-zinc-50` with `p-6` padding to ensure breathing room.
* **Dark Mode Support:**
    * **Background Cards:** Must use `dark:bg-zinc-800` for card backgrounds.
    * **Text Colors:** 
        * Primary text: `dark:text-zinc-100`
        * Secondary text: `dark:text-zinc-400`
        * Labels: `dark:text-zinc-300`
    * **Borders:** Use `dark:border-zinc-700` for card borders.
    * **Progress Bars:** Maintain color visibility in dark mode (green/blue/yellow/red remain vibrant).
