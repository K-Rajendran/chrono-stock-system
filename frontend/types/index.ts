// ─────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'CUSTOMER';
}

// ─────────────────────────────────────────────────────────────
// Products
// ─────────────────────────────────────────────────────────────

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export interface ProductPublic {
  id: number;
  sku: string;
  name: string;
  brand: string;
  categoryId: number | null;
  categoryName: string | null;
  description: string;
  movement: string;
  caseMaterial: string;
  strapMaterial: string;
  caseDiameterMm: number;
  dialColor: string;
  waterResistance: string;
  glassType: string;
  genderStyle: string;
  warrantyMonths: number;
  sellingPrice: number;
  discountType: DiscountType;
  discountValue: number;
  effectivePrice: number;
  discountAmount: number;
  stockStatus: StockStatus;
  stockAvailable: boolean;
  primaryImageUrl: string | null;
  model3dUrl: string | null;
  imageUrls: string[];
}

export interface ProductAdmin extends ProductPublic {
  purchaseCost: number;
  stockQuantity: number;
  lowStockThreshold: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
}

// ─────────────────────────────────────────────────────────────
// Cart
// ─────────────────────────────────────────────────────────────

export interface CartItemResponse {
  productId: number;
  productName: string;
  brand: string;
  sku: string;
  primaryImageUrl: string | null;
  sellingPrice: number;
  effectivePrice: number;
  discountAmount: number;
  discountType: DiscountType;
  discountValue: number;
  quantity: number;
  stockQuantity: number;
  stockStatus: StockStatus;
  lineTotal: number;
  lineDiscount: number;
}

export interface CartResponse {
  cartId: number;
  items: CartItemResponse[];
  subtotal: number;
  totalDiscount: number;
  finalAmount: number;
  itemCount: number;
}

// ─────────────────────────────────────────────────────────────
// Purchase Requests
// ─────────────────────────────────────────────────────────────

export type PurchaseRequestStatus =
  | 'REQUESTED'
  | 'UNDER_REVIEW'
  | 'BILL_GENERATED'
  | 'SENT'
  | 'PAID'
  | 'PENDING'
  | 'CANCELLED'
  | 'COMPLETED';

export interface PRItemResponse {
  id: number;
  productId: number | null;
  productName: string;
  unitPrice: number;
  discountValue: number;
  discountType: DiscountType;
  quantity: number;
  lineTotal: number;
}

export interface PurchaseRequestResponse {
  id: number;
  referenceId: string;
  userId: number;
  customerName: string;
  customerPhone: string;
  status: PurchaseRequestStatus;
  subtotal: number;
  totalDiscount: number;
  totalAmount: number;
  notes: string | null;
  billId: number | null;
  whatsappSentAt: string | null;
  items: PRItemResponse[];
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Bills
// ─────────────────────────────────────────────────────────────

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';
export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'CANCELLED';
export type BillStatus = 'DRAFT' | 'ISSUED' | 'SENT' | 'PAID' | 'CANCELLED';

export interface BillItemResponse {
  id: number;
  productId: number | null;
  productName: string;
  sellingPrice: number;
  purchaseCost?: number; // admin only
  discountValue: number;
  discountType: DiscountType;
  quantity: number;
  lineDiscountAmount: number;
  totalPrice: number;
}

export interface BillResponse {
  id: number;
  billNumber: string;
  userId: number | null;
  customerName: string;
  customerPhone: string;
  subtotal: number;
  totalDiscount: number;
  finalTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionRef: string | null;
  billStatus: BillStatus;
  purchaseRequestId: number | null;
  notes: string | null;
  whatsappSentAt: string | null;
  items: BillItemResponse[];
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────

export interface DashboardResponse {
  netRevenuePeriod: number;
  goodsCostPeriod: number;
  grossProfitPeriod: number;
  todayRevenue: number;
  todayBillCount: number;
  periodBillCount: number;
  totalBillCount: number;
  totalActiveProducts: number;
  totalStockUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentBills: BillResponse[];
  pendingBills: BillResponse[];
}

// ─────────────────────────────────────────────────────────────
// Inventory
// ─────────────────────────────────────────────────────────────

export type InventoryTransactionType = 'PURCHASE' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'CANCELLATION';

export interface InventoryTransactionResponse {
  id: number;
  productId: number;
  productName: string;
  transactionType: InventoryTransactionType;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string | null;
  referenceId: number | null;
  referenceType: string | null;
  performedByName: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────
// WhatsApp
// ─────────────────────────────────────────────────────────────

export interface WhatsAppMessageResponse {
  message: string;
  whatsappLink: string;
  mode: 'LINK' | 'API';
  recipientNumber: string;
  sent: boolean;
}

// ─────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ─────────────────────────────────────────────────────────────
// API Error
// ─────────────────────────────────────────────────────────────

export interface ApiError {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  path: string;
}
