package com.soulxtime.store.repository;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Entity
@Table(name = "purchase_request_sequences")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PurchaseRequestSequence {

    @Id
    @Column(name = "year_key")
    private int yearKey;

    @Column(name = "last_seq", nullable = false)
    private long lastSeq = 0L;
}
