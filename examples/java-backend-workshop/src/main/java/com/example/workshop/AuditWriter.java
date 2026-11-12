package com.example.workshop;

import org.springframework.stereotype.Component;

@Component
public class AuditWriter {
    private final TaskMapper mapper;
    public AuditWriter(TaskMapper mapper) { this.mapper = mapper; }
    public void write(long taskId, String actor, String operation) {
        mapper.insertAudit(taskId, actor, operation);
    }
}
