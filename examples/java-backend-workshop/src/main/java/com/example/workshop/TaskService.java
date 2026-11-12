package com.example.workshop;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {
    private final TaskMapper mapper;
    private final AuditWriter audit;
    public TaskService(TaskMapper mapper, AuditWriter audit) {
        this.mapper = mapper;
        this.audit = audit;
    }

    @Transactional
    public Task create(String actor, String title) {
        Task task = new Task();
        task.setOwner(actor);
        task.setTitle(title.trim());
        mapper.insert(task);
        audit.write(task.getId(), actor, "CREATE");
        return find(actor, task.getId());
    }

    @Transactional
    public Task update(String actor, long id, String title, int version) {
        find(actor, id);
        if (mapper.update(id, actor, title.trim(), version) != 1) {
            throw new BizException(HttpStatus.CONFLICT, "VERSION_CONFLICT", "版本已变化，请刷新后重试");
        }
        audit.write(id, actor, "UPDATE");
        return find(actor, id);
    }

    public Task find(String actor, long id) {
        Task task = mapper.find(id, actor);
        if (task == null) {
            throw new BizException(HttpStatus.NOT_FOUND, "TASK_NOT_FOUND", "任务不存在或不在你的访问范围内");
        }
        return task;
    }

    public List<Task> list(String actor, int size) {
        if (size < 1 || size > 100) {
            throw new BizException(HttpStatus.BAD_REQUEST, "INVALID_PAGE_SIZE", "size 必须在 1 到 100 之间");
        }
        return mapper.list(actor, size);
    }
}
