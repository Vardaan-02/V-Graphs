package com.marcella.backend.repositories;

import com.marcella.backend.entities.Workflows;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface WorkflowRepository extends JpaRepository<Workflows, UUID> {

    Page<Workflows> findByOwnerIdAndIsActiveTrue(UUID ownerId, Pageable pageable);

    long countByOwner_IdAndStatusIgnoreCase(UUID ownerId, String status);

}