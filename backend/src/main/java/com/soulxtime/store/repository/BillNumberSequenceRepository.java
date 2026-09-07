package com.soulxtime.store.repository;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Collision-safe bill number generation via database-level row locking.
 * Uses SELECT ... FOR UPDATE to prevent concurrent sequence increment races.
 */
@Repository
public interface BillNumberSequenceRepository extends JpaRepository<BillNumberSequence, Integer> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM BillNumberSequence s WHERE s.yearKey = :year")
    Optional<BillNumberSequence> findByYearKeyForUpdate(@Param("year") int year);
}
