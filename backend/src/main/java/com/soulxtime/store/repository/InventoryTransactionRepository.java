package com.soulxtime.store.repository;

import com.soulxtime.store.entity.InventoryTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    Page<InventoryTransaction> findByProductIdOrderByCreatedAtDesc(Long productId, Pageable pageable);
}
