package com.soulxtime.store.repository;

import com.soulxtime.store.entity.PurchaseRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, Long>, JpaSpecificationExecutor<PurchaseRequest> {

    Optional<PurchaseRequest> findByReferenceId(String referenceId);

    Page<PurchaseRequest> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("SELECT pr FROM PurchaseRequest pr WHERE pr.status IN ('REQUESTED', 'UNDER_REVIEW') ORDER BY pr.createdAt DESC")
    List<PurchaseRequest> findPendingRequests(Pageable pageable);
}
