package com.redsena.demo.reports.presentation;

import com.redsena.demo.reports.domain.ReportReason;

public record ReportPostInput(String postId, ReportReason reason) {
}
