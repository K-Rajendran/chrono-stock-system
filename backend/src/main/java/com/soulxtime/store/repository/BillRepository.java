package com.soulxtime.store.repository;

import com.soulxtime.store.entity.Bill;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long>,
        JpaSpecificationExecutor<Bill> {

    Optional<Bill> findByBillNumber(String billNumber);

    Page<Bill> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // ─── Dashboard financial queries ───────────────────────────

    /**
     * Net Revenue = SUM of final line totals (after discounts) for PAID bills.
     */
    @Query("""
        SELECT COALESCE(SUM(bi.totalPrice), 0)
        FROM BillItem bi
        JOIN bi.bill b
        WHERE b.billStatus NOT IN ('CANCELLED', 'DRAFT')
        AND b.createdAt BETWEEN :from AND :to
        """)
    BigDecimal sumNetRevenueBetween(@Param("from") Instant from, @Param("to") Instant to);

    /**
     * Goods Cost = SUM(quantity × purchase_cost_snapshot) for non-cancelled bills.
     */
    @Query("""
        SELECT COALESCE(SUM(bi.quantity * bi.purchaseCostSnapshot), 0)
        FROM BillItem bi
        JOIN bi.bill b
        WHERE b.billStatus NOT IN ('CANCELLED', 'DRAFT')
        AND b.createdAt BETWEEN :from AND :to
        """)
    BigDecimal sumGoodsCostBetween(@Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT COUNT(b) FROM Bill b WHERE b.billStatus NOT IN ('CANCELLED', 'DRAFT') AND b.createdAt BETWEEN :from AND :to")
    long countBillsBetween(@Param("from") Instant from, @Param("to") Instant to);

    @Query("SELECT COUNT(b) FROM Bill b WHERE b.billStatus NOT IN ('CANCELLED', 'DRAFT')")
    long countAllNonCancelledBills();

    @Query("SELECT b FROM Bill b WHERE b.billStatus NOT IN ('CANCELLED') ORDER BY b.createdAt DESC")
    List<Bill> findRecentBills(Pageable pageable);

    @Query("SELECT b FROM Bill b WHERE b.paymentStatus = 'PENDING' AND b.billStatus NOT IN ('CANCELLED') ORDER BY b.createdAt DESC")
    List<Bill> findPendingPaymentBills(Pageable pageable);
}
