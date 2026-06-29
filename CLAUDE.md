# EKMC Admin Next.js Developer Guide

## Route Directory Mappings

| URL Path | Next.js App Router File Path | Description |
|---|---|---|
| `/` | `app/page.js` | Root landing page / Login page (renders `LoginClient.jsx`) |
| `/dashboard/insight` | `app/(admin)/(route)/dashboard/insight/page.jsx` | Dashboard Analytics / Insights page |
| `/list-restaurants` | `app/(admin)/(route)/list-restaurants/page.jsx` | Restaurants management page (renders `ListRestaurantClient.jsx`) |

---

## Workspace Layout & Route Files

```
app/
├── (admin)/                    # Group for Admin-restricted views
│   ├── (route)/                # Layout group containing standard admin pages
│   │   ├── dashboard/
│   │   │   └── insight/
│   │   │       └── page.jsx    # Mapped to /dashboard/insight
│   │   └── list-restaurants/
│   │       ├── page.jsx        # Mapped to /list-restaurants (Server component wrapper)
│   │       ├── ListRestaurantClient.jsx  # Client logic container
│   │       ├── DeleteCafeDialog.jsx      # Dialog to delete a cafe
│   │       ├── ExpandableTable/
│   │       │   └── ExpandableTable.jsx   # Tab details shown on expanding a table row
│   │       ├── EditResturant/             # Sub-views for editing restaurant tabs
│   │       └── MergeResturant/            # Sub-views for merging restaurant data
│   ├── component/              # Shared Admin-level components
│   │   ├── AddEmployees/
│   │   │   └── AddEmployeesEatery.jsx
│   │   ├── ImageCroper/
│   │   │   ├── Demo.jsx
│   │   │   ├── CorpImage.jsx
│   │   │   └── Outline.jsx
│   │   └── utils/
│   │       ├── EaterySearchHeader.jsx
│   │       └── useDebounce.js
│   └── context/
│       └── cafeContext.jsx     # Shared state context for restaurant manipulation
├── LoginClient.jsx             # Client component for the Login page
├── layout.js                   # Root Next.js Layout
├── page.js                     # Root page entry point (renders LoginClient)
└── theme.js                    # Emotion/MUI custom theme configuration
```

---

## Development Commands

### Start Local Development Server
```bash
npm run dev
```

### Build Production Application
```bash
npm run build
```

### Start Production Server
```bash
npm run start
```
