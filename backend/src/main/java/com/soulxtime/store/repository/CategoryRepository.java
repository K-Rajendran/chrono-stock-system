package com.soulxtime.store.repository;

import com.soulxtime.store.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByActiveTrueOrderBySortOrderAsc();
    Optional<Category> findBySlug(String slug);
    boolean existsByNameIgnoreCase(String name);
}
