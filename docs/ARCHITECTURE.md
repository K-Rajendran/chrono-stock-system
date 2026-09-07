# SOUL x TIME — Architecture

## System Overview

```
Browser (Next.js 14)
    │ HTTPS REST
    ▼
Spring Boot 3 API (Port 8080)
    │ JDBC / JPA
    ▼
PostgreSQL 15
```

## Key Architectural Decisions

### 1. Server-Side Pricing (Critical)
All price/discount calculations happen exclusively in `BillService` and `CartService`.
The frontend displays values received from the backend but never submits prices/totals.
This prevents price tampering via browser dev tools.

**Rule:** `BillService.computeEffectivePrice()` is the single source of truth.

### 2. Purchase Cost Visibility
- `purchaseCost` stored in `products` table and snapshot in `bill_items.purchase_cost_snapshot`
- `ProductService.toPublicResponse()` — NEVER includes `purchaseCost`
- `ProductService.toAdminResponse()` — includes `purchaseCost` for admin APIs only
- `BillService.toResponse(bill, includeAdminData)` — `purchaseCost` set to null when `includeAdminData=false`

### 3. Historical Price Snapshots
`BillItem` captures:
- `productNameSnapshot` — product name at billing time
- `sellingPriceSnapshot` — selling price at billing time
- `purchaseCostSnapshot` — purchase cost at billing time (for profit calc)
- `discountValueSnapshot`, `discountTypeSnapshot` — discount at billing time

Changing a product's price after billing does NOT affect old bills.

### 4. Optimistic Locking for Stock Concurrency
`Product.version` (JPA `@Version`) provides optimistic locking.
During bill creation, stock deduction via `InventoryService.deductStockForBill()` will
throw `ObjectOptimisticLockingFailureException` if another transaction modified the same product.
This prevents overselling under concurrent load.

Pre-validation pass checks all stock BEFORE deducting any — all-or-nothing.

### 5. Collision-Free Bill Numbering
`bill_number_sequences` table with `SELECT ... FOR UPDATE` (pessimistic write lock) ensures
no two concurrent transactions get the same sequence number.
Pattern: `{PREFIX}-{YEAR}-{6-digit-zero-padded-sequence}` e.g. `ST-2026-000042`

### 6. JWT Authentication Flow
```
Login → accessToken (15 min) + refreshToken (7 days, stored in DB hashed)
Request → Authorization: Bearer {accessToken}
Expired access → POST /api/auth/refresh → new token pair (refresh rotation)
Logout → revoke all refresh tokens for user
```

### 7. WhatsApp Integration Modes
```
WHATSAPP_MODE=LINK  → generates wa.me URL, no credentials needed
WHATSAPP_MODE=API   → calls WhatsApp Business API (implement sendViaApi())
```
Both modes work without crashing; LINK is the default safe mode.

## Financial Formulas (Documented)

```
effectiveUnitPrice = sellingPrice × (1 − discountPct/100)    [PERCENTAGE]
effectiveUnitPrice = sellingPrice − discountFixed              [FIXED_AMOUNT]

lineTotal          = effectiveUnitPrice × quantity
lineDiscountAmount = (sellingPrice − effectiveUnitPrice) × quantity

billSubtotal       = Σ lineTotal
billTotalDiscount  = Σ lineDiscountAmount
billFinalTotal     = billSubtotal  (already net of discounts)

— Dashboard —
netRevenue         = Σ bill_items.total_price   (non-cancelled bills in period)
goodsCost          = Σ (bill_items.quantity × bill_items.purchase_cost_snapshot)
grossProfit        = netRevenue − goodsCost
```

## Directory Structure

```
soul-x-time/
├── frontend/                   # Next.js 14 app
│   ├── app/                    # App router pages
│   │   ├── (public)/           # Public-facing pages (with Navbar/Footer)
│   │   ├── (auth)/             # Login/register (no navbar)
│   │   ├── admin/              # Admin dashboard (role-guarded)
│   │   ├── account/            # Customer account
│   │   ├── bills/              # Bill view
│   │   └── purchase-requests/  # PR detail
│   ├── components/
│   │   ├── ui/                 # Design system components
│   │   ├── layout/             # Navbar, Footer, Providers
│   │   └── 3d/                 # Three.js components
│   ├── lib/
│   │   ├── apiClient.ts        # Axios + auth interceptors
│   │   └── store/              # Zustand state stores
│   ├── services/               # API service layer
│   ├── types/                  # TypeScript interfaces
│   └── utils/                  # Formatters, cn(), etc.
│
└── backend/                    # Spring Boot 3 app
    └── src/main/java/com/soulxtime/store/
        ├── config/             # Security, CORS config
        ├── controller/         # REST controllers
        │   ├── admin/          # Admin-only endpoints
        │   ├── customer/       # Auth-required customer endpoints
        │   └── public/         # Public endpoints (products, auth)
        ├── dto/                # Request/Response DTOs
        ├── entity/             # JPA entities
        ├── exception/          # Custom exceptions + global handler
        ├── repository/         # Spring Data JPA repos
        ├── security/           # JWT filter, UserDetailsService
        └── service/            # Business logic
            └── whatsapp/       # WhatsApp abstraction
```
