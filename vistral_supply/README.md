# Vistral Supply

Supply management application built with Next.js, TypeScript, and Supabase.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.local.example .env.local
```

3. Fill in your environment variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (required for admin user creation)
- `NEXT_PUBLIC_AIRTABLE_API_KEY`: Your Airtable API key (optional)
- `NEXT_PUBLIC_AIRTABLE_BASE_ID`: Your Airtable base ID (optional)
- `NEXT_PUBLIC_AIRTABLE_TABLE_NAME`: Your Airtable table name (optional, default: Properties)

4. Run database migrations:
- Go to your Supabase Dashboard → SQL Editor
- Run the migrations in `supabase/migrations/` in order:
  - `001_user_roles.sql`
  - `002_properties.sql`

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) with your browser to see the result.

## Roles

The application supports three roles:
- `supply_partner`: Default role for supply partners
- `supply_analyst`: Role for supply analysts
- `supply_admin`: Admin role with full access

## Project Structure

- `app/`: Next.js app router pages
- `components/`: React components
- `lib/`: Utility functions and configurations
- `hooks/`: Custom React hooks
- `contexts/`: React contexts
- `supabase/migrations/`: Database migrations

## Responsive Design System

The application uses a consistent responsive grid system with breakpoints, margins, and gutters:

### Breakpoints

- **XS** (<576px): Margin 20px, Gutter 12px, 6 columns
- **SM** (577px-768px): Margin 32px, Gutter 12px, 6 columns
- **MD** (769px-992px): Margin 40px, Gutter 16px, 12 columns
- **LG** (993px-1199px): Margin 80px, Gutter 28px, 12 columns
- **XL** (1200px-1400px): Margin 100px, Gutter 32px, 12 columns
- **XXL** (>1400px): Margin 112px (centered, max-width 1920px), Gutter 32px, 12 columns

### Usage

**CSS Classes:**
- Use `container-margin` class for responsive container margins
- Use `gutter` class for responsive spacing between grid items

**CSS Variables:**
- Margins: `var(--prophero-margin-xs)` through `var(--prophero-margin-xxl)`
- Gutters: `var(--prophero-gutter-xs)` through `var(--prophero-gutter-xxl)`

**TypeScript Constants:**
- Import from `lib/constants`: `BREAKPOINTS` and `SPACING`

**Example:**
```tsx
// Using CSS classes
<div className="container-margin">
  <div className="grid grid-cols-1 md:grid-cols-2 gutter">
    {/* Content */}
  </div>
</div>

// Using CSS variables
<div style={{ paddingLeft: 'var(--prophero-margin-md)', gap: 'var(--prophero-gutter-md)' }}>
  {/* Content */}
</div>
```

## License

Private
