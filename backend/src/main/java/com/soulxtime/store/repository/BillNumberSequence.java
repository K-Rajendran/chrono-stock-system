package com.soulxtime.store.repository;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "bill_number_sequences")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BillNumberSequence {

    @Id
    @Column(name = "year_key")
    private int yearKey;

    @Column(name = "last_seq", nullable = false)
    private long lastSeq = 0L;
}
