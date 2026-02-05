# Component Behaviors & UX Patterns

This document describes the UX/UI behaviors and patterns implemented in the Property Summary and Investor Summary tabs.

---

## 1. Gallery Filmstrip (`PropertySummaryTab`)

### Layout Structure
The gallery follows a **Filmstrip UX pattern** with two distinct sections:

1. **Top Section - Main Image Display:**
   - Large aspect-video container showing the currently selected image.
   - **Display only** - no navigation arrows overlaying the image.
   - Smooth fade-in transition when the image changes (`animate-fade-in`).
   - Clicking the main image opens a full-screen modal with navigation controls.
   - Image counter badge (e.g., "1 / 5") displayed in bottom-right corner.

2. **Bottom Section - Thumbnail Strip with Navigation:**
   - Layout: `[Left Arrow] [Scrollable Thumbnail Strip] [Right Arrow]`
   - Navigation arrows are positioned **outside** the thumbnail strip (not overlaying).
   - Arrows use Flexbox positioning with `flex-shrink-0` to prevent shrinking.
   - Thumbnail strip uses `flex-1 min-w-0` to enable proper horizontal scrolling.

### Behavior
- **Main Display:** Shows `images[activeIndex]` with smooth fade transitions.
- **Active Thumbnail Selection:**
  - The active thumbnail is always the one centered in the visible strip.
  - Active thumbnail has full opacity (`opacity-100`), blue border, and ring highlight.
  - Inactive thumbnails have reduced opacity (`opacity-60`) with hover state (`opacity-80`).
- **Navigation:**
  - Clicking `[Left Arrow]` or `[Right Arrow]` shifts the active selection by one index.
  - Clicking a specific thumbnail makes it the active image.
  - Navigation arrows cycle through images without opening the modal.
- **Auto-Scroll:** When the active index changes, the thumbnail strip automatically scrolls to keep the active thumbnail centered and visible.
- **Modal View:** Clicking the main image opens a full-screen modal with navigation controls.

### Implementation Details
- Uses `scrollIntoView` with `inline: "center"` and `behavior: "smooth"` to center active thumbnails.
- Main image uses `key={mainImageIndex}` to trigger React re-render and fade animation.
- Thumbnail strip container uses `overflow-hidden` and `min-w-0` to prevent overflow beyond container boundaries.
- Flexbox layout ensures arrows stay outside the scrollable thumbnail area.
- CSS animation `fadeIn` defined in `globals.css` for smooth image transitions.
- Thumbnail strip has `overflow-x-auto` with `scrollbar-hidden` class for clean scrolling.

---

## 2. Document Preview Modal

### Behavior
- **Floating Modal:** Documents open in a centered floating modal overlay instead of a new browser tab.
- **PDF Support:** PDFs are displayed using an `<iframe>` element.
- **Image Support:** Images are displayed using an `<img>` tag with proper scaling.
- **Close Button:** Clear "X" button in the top-right corner of the modal.
- **Responsive:** Modal adapts to screen size (max-width: 7xl, height: 90vh).

### Component: `DocumentPreviewModal`
- **Location:** `src/components/rentals/document-preview-modal.tsx`
- **Props:**
  - `open: boolean` - Controls modal visibility
  - `onOpenChange: (open: boolean) => void` - Callback for state changes
  - `documentUrl: string | null | undefined` - URL of the document to preview
  - `documentName?: string` - Display name for the document

### File Type Detection
- Automatically detects file type from URL extension.
- Supports: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`, `.svg` (images)
- Supports: `.pdf` (PDFs)
- Falls back to "Open in new tab" button for unsupported types.

---

## 3. Smart Document Field Components

### A. SmartDocumentField (Single Text Fields)

#### Behavior
The `SmartDocumentField` component provides a unified interface for single document fields (text columns) with distinct states:

##### Scenario A: Document Exists (`value` is not null/empty)
- **Display:** Shows filename with file icon.
- **Actions Available:**
  1. **View Button (Filename):** Opens the document in the floating preview modal.
  2. **Edit Button (Pencil Icon):** Triggers file picker to replace the existing document.
  3. **Delete Button (Trash Icon):** Deletes the document from storage and sets database field to `null`.

##### Scenario B: No Document (`value` is null/empty)
- **Display:** Shows "Subir Documento" button with dashed border.
- **Actions Available:**
  1. **Upload Button (Upload Icon):** Triggers file picker to upload a document for the first time.

#### Component: `SmartDocumentField`
- **Location:** `src/components/rentals/smart-document-field.tsx`
- **Props:**
  - `label: string` - Field label (e.g., "Contrato Compraventa")
  - `value: string | null | undefined` - Document URL from database
  - `onUpload?: (file: File) => void | Promise<void>` - Callback when file is selected
  - `onDelete?: () => void | Promise<void>` - Callback when delete is triggered
  - `className?: string` - Additional CSS classes
  - `disabled?: boolean` - Disable all interactions

#### Implementation Details
- Uses a hidden `<input type="file">` element for file selection.
- File input accepts: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- Automatically integrates with `DocumentPreviewModal` for viewing.
- File input resets after selection to allow re-selecting the same file.
- Delete action shows confirmation dialog before proceeding.

---

### B. SmartDocumentFieldArray (JSONB Array Fields)

#### Behavior
The `SmartDocumentFieldArray` component handles JSONB array fields (like `doc_renovation_files`, `pics_urls`) and displays **all files** in the array:

##### Display - When Files Exist
- Shows all files in a list/grid layout with file icons and names.
- "Añadir" button visible in header to upload additional files.

##### Display - When Empty
- Shows "Subir Documento" button with dashed border (matches `SmartDocumentField` empty state).
- No "Añadir" button shown when empty for consistency.

##### Actions Per File
1. **View Button (Eye Icon):** Opens the document in the floating preview modal.
2. **Delete Button (Trash Icon):** Removes the URL from the array and deletes file from storage.

#### Component: `SmartDocumentFieldArray`
- **Location:** `src/components/rentals/smart-document-field-array.tsx`
- **Props:**
  - `label: string` - Field label (e.g., "Documentos de reforma")
  - `value: string[] | null | undefined` - Array of document URLs from database
  - `onUpload?: (file: File) => void | Promise<void>` - Callback when file is selected (appends to array)
  - `onDelete?: (fileUrl: string) => void | Promise<void>` - Callback when delete is triggered for a specific file
  - `className?: string` - Additional CSS classes
  - `disabled?: boolean` - Disable all interactions

#### Implementation Details
- Displays all files in the array, not just the first one.
- Upload always appends to array (never replaces).
- Delete removes specific URL from array (not the entire array).
- Each file has individual view and delete actions.
- Delete action shows confirmation dialog before proceeding.
- Empty state matches `SmartDocumentField` for visual consistency.

---

## 4. Document Fields Using Smart Components

### PropertySummaryTab (`src/components/rentals/property-summary-tab.tsx`)

#### Legal Documents (Single Fields - `SmartDocumentField`)
- `doc_purchase_contract` → "Contrato Compraventa"
- `doc_land_registry_note` → "Nota Simple"
- `doc_energy_cert` → "Certificado de eficiencia energética"

#### Legal Documents (Array Fields - `SmartDocumentFieldArray`)
- `doc_renovation_files` → "Documentos de reforma" (JSONB array - displays all files)

#### Insurance Documents (Single Fields - `SmartDocumentField`)
- `home_insurance_policy_url` → "Póliza de seguro"
- `home_insurance_type` → Displayed as a standard grid item (Label + Value) matching other fields

#### Supplies Documents (Single Fields - `SmartDocumentField`)
- `doc_contract_electricity` → "Contrato de luz"
- `doc_bill_electricity` → "Última factura luz"
- `doc_contract_water` → "Contrato de agua"
- `doc_bill_water` → "Última factura agua"
- `doc_contract_gas` → "Contrato de gas"
- `doc_bill_gas` → "Última factura gas"
- `doc_contract_other` → "Contrato otros suministros"
- `doc_bill_other` → "Última factura otros suministros"

### InvestorSummaryTab (`src/components/rentals/investor-summary-tab.tsx`)

All fields use `SmartDocumentField` (single fields):
- `client_identity_doc_url` → "Documento de Identidad"
- `client_bank_certificate_url` → "Certificado de titularidad bancaria"

---

## 5. Styling Improvements

### `home_insurance_type` Field
- **Previous:** Displayed as plain text without consistent styling.
- **Current:** Styled as a standard grid item matching the rest of the form:
  - Label: `text-xs font-medium text-muted-foreground`
  - Value: `text-sm font-medium`
  - Layout: Grid column matching other fields

### Visual Consistency
- All document fields now follow the same visual pattern:
  - Standard label styling
  - Consistent button placement
  - Uniform spacing and alignment

---

## 6. Upload and Delete Handler Pattern

### Upload Handler Implementation
Both `PropertySummaryTab` and `InvestorSummaryTab` implement full upload functionality:

```typescript
const handleDocumentUpload = async (label: string, file: File) => {
  // 1. Maps UI label to database field name
  // 2. Gets current value for cleanup (single fields) or null (array fields)
  // 3. Calls server-side API route: POST /api/documents/upload
  // 4. Stores active tab and field label in sessionStorage
  // 5. Refreshes page to show updated data
};
```

The upload handler:
1. ✅ Validates file type via API
2. ✅ Uploads to appropriate Supabase Storage bucket (see `docs/docs-architecture.md`)
3. ✅ Updates the corresponding database field with the new URL
4. ✅ Handles errors gracefully with user feedback
5. ✅ For JSONB arrays: Appends new URL to array
6. ✅ For single fields: Replaces existing URL and deletes old file
7. ✅ **Updates local state instantly** (no page refresh!)
8. ✅ **Auto-scrolls to uploaded field** (smooth scroll to center)

### Delete Handler Implementation
Both tabs implement full delete functionality:

```typescript
const handleDocumentDelete = async (label: string, fileUrl?: string) => {
  // 1. Maps UI label to database field name
  // 2. For arrays: requires fileUrl parameter
  // 3. For single fields: uses current value
  // 4. Calls server-side API route: DELETE /api/documents/delete
  // 5. Stores active tab and field label in sessionStorage
  // 6. Refreshes page to show updated data
};
```

The delete handler:
1. ✅ Shows confirmation dialog before deletion
2. ✅ Deletes file from Supabase Storage bucket
3. ✅ For JSONB arrays: Removes URL from array
4. ✅ For single fields: Sets field to `null`
5. ✅ Handles errors gracefully with user feedback
6. ✅ **Updates local state instantly** (no page refresh!)
7. ✅ **No scroll** - Stays at current position (prevents layout shifts)

### Instant Updates Without Page Refresh

**No page refresh required!** The implementation uses local React state for instant updates:

1. **Local State Management:**
   - Both tabs maintain `localProperty` state synced with parent prop
   - State updates immediately after upload/delete operations
   - No `window.location.reload()` - instant UI updates

2. **Upload/Edit Flow:**
   - File uploads to backend via API
   - Backend returns new URL
   - Local state updates immediately with new URL
   - **Smooth scroll** to field (so you can see the new document)
   - Scroll behavior: `smooth`, positioned to `center`

3. **Delete Flow:**
   - File deletes from backend and storage
   - Local state updates immediately:
     - Arrays: Remove URL from array
     - Single fields: Set to `null`
   - **No scroll** - Stays at current position (you're already looking at it)

4. **Scroll Behavior:**
   - **Upload/Edit:** Scrolls to show you where the document is
   - **Delete:** No scroll - prevents unwanted layout shifts
   - Uses `data-field-label` attribute to find elements
   - 100ms delay for smooth state transition

5. **Benefits:**
   - ⚡ **Instant** - No loading, no flicker
   - 🎯 **Precise** - Scroll only when needed
   - 💾 **Preserves state** - No form data loss
   - 🎨 **Clean** - Minimal, no distracting animations
   - 📍 **Stable** - No unwanted scrolling on delete

---

## 7. Component Dependencies

### Required Components
- `@/components/ui/dialog` - For modal functionality
- `@/components/ui/button` - For action buttons
- `lucide-react` - For icons (Eye, Pencil, Upload, Trash2, X, ChevronLeft, ChevronRight)

### Component Hierarchy
```
PropertySummaryTab / InvestorSummaryTab
  ├── SmartDocumentField (single text fields)
  │   ├── DocumentPreviewModal
  │   └── DocumentUploadModal
  └── SmartDocumentFieldArray (JSONB array fields)
      ├── DocumentPreviewModal
      └── DocumentUploadModal
```

### API Routes
- `POST /api/documents/upload` - Handles file uploads
- `DELETE /api/documents/delete` - Handles file deletions

---

## 8. Accessibility

### Keyboard Navigation
- Modal can be closed with Escape key (handled by Dialog component)
- File input can be triggered via keyboard when button is focused
- Navigation arrows are keyboard accessible

### ARIA Labels
- All buttons include `aria-label` or `title` attributes
- Modal includes `DialogTitle` and `DialogDescription` for screen readers
- Close buttons include `sr-only` text

---

## 9. Browser Compatibility

### Supported Features
- File API (`<input type="file">`)
- CSS Grid and Flexbox
- ES6+ JavaScript features
- Modern dialog/modal patterns

### PDF Display
- PDFs displayed via `<iframe>` - supported in all modern browsers
- Fallback provided for unsupported file types
