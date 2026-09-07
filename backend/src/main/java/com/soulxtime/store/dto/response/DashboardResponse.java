package com.soulxtime.store.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

/**
 * Dashboard response.
 *
 * Financial formulas (documented per spec):
 *   netRevenuePeriod  = SUM of bill_items.total_price for non-cancelled bills in period
 *   goodsCostPeriod   = SUM of (quantity × purchase_cost_snapshot) for non-cancelled bills in period
 *   grossProfitPeriod = netRevenuePeriod - goodsCostPeriod
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DashboardResponse {
    // Revenue metrics
    private BigDecimal netRevenuePeriod;
    private BigDecimal goodsCostPeriod;
    private BigDecimal grossProfitPeriod;
    private BigDecimal todayRevenue;

    // Bill counts
    private long todayBillCount;
    private long periodBillCount;
    private long totalBillCount;

    // Inventory summary (set by controller from product repo)
    private long totalActiveProducts;
    private long totalStockUnits;
    private long lowStockCount;
    private long outOfStockCount;

    // Lists
    private List<BillResponse> recentBills;
    private List<BillResponse> pendingBills;
}
