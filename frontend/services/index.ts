import { apiClient } from '@/lib/apiClient';
import type {
  AuthResponse, ProductPublic, ProductAdmin, Category,
  CartResponse, PurchaseRequestResponse, BillResponse,
  DashboardResponse, InventoryTransactionResponse,
  WhatsAppMessageResponse, Page,
} from '@/types';

// ─────────────────────────────────────────────────────────────
// Auth Service
// ─────────────────────────────────────────────────────────────

export const authService = {
  register: (data: { fullName: string; email: string; phone: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),

  logout: () => apiClient.post('/auth/logout'),
};

// ─────────────────────────────────────────────────────────────
// Product Service
// ─────────────────────────────────────────────────────────────

export const productService = {
  list: (params: {
    search?: string; categoryId?: number; minPrice?: number;
    maxPrice?: number; stockStatus?: string; page?: number;
    size?: number; sortBy?: string; sortDir?: string;
  }) =>
    apiClient.get<Page<ProductPublic>>('/products', { params }).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<ProductPublic>(`/products/${id}`).then((r) => r.data),

  getRelated: (id: number, categoryId?: number) =>
    apiClient.get<ProductPublic[]>(`/products/${id}/related`, { params: { categoryId } }).then((r) => r.data),

  getFeatured: () =>
    apiClient.get<ProductPublic[]>('/products/featured').then((r) => r.data),

  getCategories: () =>
    apiClient.get<Category[]>('/categories').then((r) => r.data),
};

// ─────────────────────────────────────────────────────────────
// Cart Service
// ─────────────────────────────────────────────────────────────

export const cartService = {
  get: () => apiClient.get<CartResponse>('/cart').then((r) => r.data),

  addItem: (productId: number, quantity: number) =>
    apiClient.post<CartResponse>('/cart/items', { productId, quantity }).then((r) => r.data),

  updateItem: (productId: number, quantity: number) =>
    apiClient.put<CartResponse>(`/cart/items/${productId}`, { quantity }).then((r) => r.data),

  removeItem: (productId: number) =>
    apiClient.delete<CartResponse>(`/cart/items/${productId}`).then((r) => r.data),

  clear: () => apiClient.delete<CartResponse>('/cart').then((r) => r.data),
};

// ─────────────────────────────────────────────────────────────
// Purchase Request Service
// ─────────────────────────────────────────────────────────────

export const purchaseRequestService = {
  createFromCart: () =>
    apiClient.post<PurchaseRequestResponse>('/purchase-requests/from-cart').then((r) => r.data),

  getMyRequests: (page = 0, size = 10) =>
    apiClient.get<Page<PurchaseRequestResponse>>('/purchase-requests', { params: { page, size } }).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<PurchaseRequestResponse>(`/purchase-requests/${id}`).then((r) => r.data),

  sendWhatsApp: (id: number) =>
    apiClient.post<WhatsAppMessageResponse>(`/purchase-requests/${id}/send-whatsapp`).then((r) => r.data),
};

// ─────────────────────────────────────────────────────────────
// Customer Bills Service
// ─────────────────────────────────────────────────────────────

export const billService = {
  getMyBills: (page = 0, size = 10) =>
    apiClient.get<Page<BillResponse>>('/customer/bills', { params: { page, size } }).then((r) => r.data),

  getById: (billId: number) =>
    apiClient.get<BillResponse>(`/customer/bills/${billId}`).then((r) => r.data),
};

// ─────────────────────────────────────────────────────────────
// Admin Service
// ─────────────────────────────────────────────────────────────

export const adminService = {
  // Dashboard
  getDashboard: (period = 'this_month') =>
    apiClient.get<DashboardResponse>('/admin/dashboard', { params: { period } }).then((r) => r.data),

  // Products
  listProducts: (params: { search?: string; categoryId?: number; stockStatus?: string; page?: number; size?: number }) =>
    apiClient.get<Page<ProductAdmin>>('/admin/products', { params }).then((r) => r.data),

  getProduct: (id: number) =>
    apiClient.get<ProductAdmin>(`/admin/products/${id}`).then((r) => r.data),

  createProduct: (data: Partial<ProductAdmin>) =>
    apiClient.post<ProductAdmin>('/admin/products', data).then((r) => r.data),

  updateProduct: (id: number, data: Partial<ProductAdmin>) =>
    apiClient.put<ProductAdmin>(`/admin/products/${id}`, data).then((r) => r.data),

  deactivateProduct: (id: number) =>
    apiClient.delete(`/admin/products/${id}`),

  // Inventory
  adjustStock: (productId: number, data: { type: string; quantity: number; reason: string }) =>
    apiClient.post<InventoryTransactionResponse>(`/admin/inventory/${productId}/adjust`, data).then((r) => r.data),

  getInventoryHistory: (productId: number, page = 0, size = 20) =>
    apiClient.get<Page<InventoryTransactionResponse>>(`/admin/inventory/${productId}/history`, {
      params: { page, size },
    }).then((r) => r.data),

  getLowStock: () =>
    apiClient.get<ProductAdmin[]>('/admin/inventory/low-stock').then((r) => r.data),

  getOutOfStock: () =>
    apiClient.get<ProductAdmin[]>('/admin/inventory/out-of-stock').then((r) => r.data),

  // Bills (admin)
  listBills: (params: { search?: string; paymentStatus?: string; billStatus?: string; page?: number; size?: number }) =>
    apiClient.get<Page<BillResponse>>('/admin/bills', { params }).then((r) => r.data),

  getBill: (id: number) =>
    apiClient.get<BillResponse>(`/admin/bills/${id}`).then((r) => r.data),

  createBill: (data: unknown) =>
    apiClient.post<BillResponse>('/admin/bills', data).then((r) => r.data),

  updateBill: (id: number, data: unknown) =>
    apiClient.put<BillResponse>(`/admin/bills/${id}`, data).then((r) => r.data),

  cancelBill: (id: number) =>
    apiClient.post<BillResponse>(`/admin/bills/${id}/cancel`).then((r) => r.data),

  sendBillWhatsApp: (id: number) =>
    apiClient.post<WhatsAppMessageResponse>(`/admin/bills/${id}/send-whatsapp`).then((r) => r.data),

  // Purchase Requests (admin)
  listPurchaseRequests: (params: { search?: string; status?: string; page?: number; size?: number }) =>
    apiClient.get<Page<PurchaseRequestResponse>>('/admin/purchase-requests', { params }).then((r) => r.data),

  getPurchaseRequest: (id: number) =>
    apiClient.get<PurchaseRequestResponse>(`/admin/purchase-requests/${id}`).then((r) => r.data),

  updateRequestStatus: (id: number, status: string) =>
    apiClient.put<PurchaseRequestResponse>(`/admin/purchase-requests/${id}/status`, { status }).then((r) => r.data),
};
