package com.redsena.demo.reports.infrastructure;

import com.redsena.demo.reports.domain.PostReport;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostReportRepository extends JpaRepository<PostReport, UUID> {

	boolean existsByPost_IdAndReporter_Id(UUID postId, UUID reporterId);
}
