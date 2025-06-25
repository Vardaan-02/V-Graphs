package com.marcella.backend.repositories;

import com.marcella.backend.entities.Execution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ExecutionRepository extends JpaRepository<Execution, UUID> {

    long countByOwner_IdAndStatusIgnoreCase(UUID ownerId, String status);

    long countByOwner_Id(UUID ownerId);

    @Query("SELECT e FROM Execution e WHERE e.workflow.id = :workflowId AND e.status = :status ORDER BY e.startedAt DESC")
    List<Execution> findByWorkflowIdAndStatus(@Param("workflowId") UUID workflowId, @Param("status") String status);

}
