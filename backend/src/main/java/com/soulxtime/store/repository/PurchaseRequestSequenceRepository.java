package com.soulxtime.store.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PurchaseRequestSequenceRepository extends JpaRepository<PurchaseRequestSequence, Integer> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM PurchaseRequestSequence s WHERE s.yearKey = :year")
    Optional<PurchaseRequestSequence> findByYearKeyForUpdate(@Param("year") int year);
}
