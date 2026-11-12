package com.example.workshop;

import java.security.Principal;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskService service;
    public TaskController(TaskService service) { this.service = service; }
    public record CreateRequest(@NotBlank @Size(max = 120) String title) {}
    public record UpdateRequest(@NotBlank @Size(max = 120) String title,
                                @NotNull @Min(0) Integer version) {}
    public record TaskResponse(Long id, String title, Integer version) {
        static TaskResponse of(Task task) {
            return new TaskResponse(task.getId(), task.getTitle(), task.getVersion());
        }
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse create(Principal principal, @Valid @RequestBody CreateRequest request) {
        return TaskResponse.of(service.create(principal.getName(), request.title()));
    }

    @GetMapping("/{id}")
    public TaskResponse find(Principal principal, @PathVariable long id) {
        return TaskResponse.of(service.find(principal.getName(), id));
    }

    @GetMapping
    public List<TaskResponse> list(Principal principal, @RequestParam(defaultValue = "20") int size) {
        return service.list(principal.getName(), size).stream().map(TaskResponse::of).toList();
    }

    @PutMapping("/{id}")
    public TaskResponse update(Principal principal, @PathVariable long id,
                               @Valid @RequestBody UpdateRequest request) {
        return TaskResponse.of(service.update(principal.getName(), id, request.title(), request.version()));
    }
}
