# EKMC Admin Next.js Developer Guide

## Route Directory Mappings

| URL Path | Next.js App Router File Path | Description |
|---|---|---|
| `/` | `app/page.js` | Root landing page / Login page (renders `LoginClient.jsx`) |
| `/dashboard/insight` | `app/(admin)/(route)/dashboard/insight/page.jsx` | Dashboard Analytics / Insights page |
| `/list-restaurants` | `app/(admin)/(route)/list-restaurants/page.jsx` | Restaurants management page (renders `ListRestaurantClient.jsx`) |
| `/onboarding` | `app/(admin)/(route)/onBoarding/page.js` | Restaurant onboarding flow (renders `OnBoardingClient.jsx`) |

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
│   │   └── onBoarding/                 # Restaurant onboarding flow
│   │       ├── page.js                 # Mapped to /onboarding (Server component wrapper)
│   │       ├── OnBoardingClient.jsx    # Onboarding container client component
│   │       ├── RestaurantSetting.jsx   # Settings setup step
│   │       ├── RestaurantDocuments.jsx # Document upload setup step
│   │       ├── FoodMenuBulk/           # Bulk item upload step view
│   │       └── GenenralInfo/           # General information step view
│   ├── component/              # Shared Admin-level components
│   │   ├── AddEmployees/
│   │   │   └── AddEmployeesEatery.jsx
│   │   ├── ImageCroper/
│   │   │   ├── Demo.jsx
│   │   │   ├── CorpImage.jsx
│   │   │   └── Outline.jsx
│   │   ├── restaurant/         # Restaurant sub-components (Address, FeatureImage, cropImage, etc.)
│   │   ├── services/
│   │   │   └── authService.js
│   │   └── utils/              # UI utility components
│   │       ├── CustomChip.jsx
│   │       ├── EaterySearchHeader.jsx
│   │       └── useDebounce.js
│   ├── context/
│   │   └── cafeContext.jsx     # Shared state context for restaurant manipulation
│   └── utils/                  # Core helpers and Next.js native wrappers
│       ├── axios.js            # Dependency-free Axios wrapper around native fetch
│       ├── nativeDropzone.js   # Native drag-and-drop React hook replacement
│       ├── nativeForm.js       # Native useForm and Controller state hook replacement
│       └── GlobalSnackbar.jsx  # Global toast notification component
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

---

## Path Aliases

The project utilizes absolute path mappings defined in [jsconfig.json](file:///d:/A2D/ekmc%20Admin/new/ekmc-admin-react-v5/ekmc-admin-nextjs-v7/jsconfig.json):
* `@/*` maps to `./*` (root of the project)
* `@/restaurant/*` maps to `./app/(admin)/component/restaurant/*` (resolves legacy component imports)
* `@/ui/assets/*` maps to `./app/(admin)/assets/*` (resolves legacy asset/icon imports)



