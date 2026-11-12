package com.example.workshop;

import java.util.concurrent.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class WorkshopIntegrationTest {
    @Autowired MockMvc http;
    @Autowired JdbcTemplate jdbc;
    @Autowired TaskService service;
    @Autowired ObjectMapper json;
    @MockitoSpyBean AuditWriter audit;

    @BeforeEach
    void cleanDatabase() {
        jdbc.update("DELETE FROM task_audit");
        jdbc.update("DELETE FROM tasks");
    }
    int rows(String table) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Integer.class);
    }
    long createTask() throws Exception {
        var result = http.perform(post("/api/tasks").with(httpBasic("alice", "alice-demo"))
                .with(csrf()).contentType("application/json").content("{\"title\":\"first\"}"))
            .andExpect(status().isCreated()).andReturn();
        return json.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    @Test
    void anonymousRequestReturns401AndRequestId() throws Exception {
        var result = http.perform(get("/api/tasks")).andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
            .andExpect(header().exists("X-Request-Id")).andReturn();
        assertThat(json.readTree(result.getResponse().getContentAsString()).get("requestId").asText())
            .isEqualTo(result.getResponse().getHeader("X-Request-Id"));
    }
    @Test
    void incorrectPasswordReturns401() throws Exception {
        http.perform(get("/api/tasks").with(httpBasic("alice", "wrong")))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
            .andExpect(jsonPath("$.requestId").isNotEmpty());
    }
    @Test
    void authenticatedUserCanObtainCsrfToken() throws Exception {
        http.perform(get("/api/csrf").with(httpBasic("alice", "alice-demo")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.headerName").value("X-CSRF-TOKEN"))
            .andExpect(jsonPath("$.token").isNotEmpty());
    }
    @Test
    void writeWithoutCsrfIsRejected() throws Exception {
        http.perform(post("/api/tasks").with(httpBasic("alice", "alice-demo"))
                .contentType("application/json").content("{\"title\":\"first\"}"))
            .andExpect(status().isForbidden());
        assertThat(rows("tasks")).isZero();
    }
    @Test
    void viewerCannotCreateEvenWithValidCsrf() throws Exception {
        http.perform(post("/api/tasks").with(httpBasic("viewer", "viewer-demo")).with(csrf())
                .contentType("application/json").content("{\"title\":\"first\"}"))
            .andExpect(status().isForbidden());
        assertThat(rows("tasks")).isZero();
    }
    @Test
    void blankTitleReturns400WithoutWrites() throws Exception {
        http.perform(post("/api/tasks").with(httpBasic("alice", "alice-demo")).with(csrf())
                .contentType("application/json").content("{\"title\":\"  \"}"))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("INVALID_REQUEST"));
        assertThat(rows("tasks")).isZero();
        assertThat(rows("task_audit")).isZero();
    }
    @Test
    void requestCannotInjectAnOwner() throws Exception {
        http.perform(post("/api/tasks").with(httpBasic("alice", "alice-demo")).with(csrf())
                .contentType("application/json").content("{\"title\":\"first\",\"owner\":\"bob\"}"))
            .andExpect(status().isBadRequest());
        assertThat(rows("tasks")).isZero();
    }
    @Test
    void successfulCreateCommitsTaskAndAuditWithoutExposingEntity() throws Exception {
        http.perform(post("/api/tasks").with(httpBasic("alice", "alice-demo")).with(csrf())
                .contentType("application/json").content("{\"title\":\"  first  \"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.title").value("first"))
            .andExpect(jsonPath("$.version").value(0)).andExpect(jsonPath("$.owner").doesNotExist());
        assertThat(rows("tasks")).isEqualTo(1);
        assertThat(rows("task_audit")).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT owner FROM tasks", String.class)).isEqualTo("alice");
    }
    @Test
    void anotherUserCannotReadOrModifyTheTask() throws Exception {
        long id = createTask();
        http.perform(get("/api/tasks/{id}", id).with(httpBasic("bob", "bob-demo")))
            .andExpect(status().isNotFound());
        http.perform(put("/api/tasks/{id}", id).with(httpBasic("bob", "bob-demo")).with(csrf())
                .contentType("application/json").content("{\"title\":\"stolen\",\"version\":0}"))
            .andExpect(status().isNotFound());
        assertThat(service.find("alice", id).getTitle()).isEqualTo("first");
        assertThat(rows("task_audit")).isEqualTo(1);
    }
    @Test
    void listIsScopedToAuthenticatedUserAndSizeIsBounded() throws Exception {
        createTask();
        http.perform(get("/api/tasks").with(httpBasic("bob", "bob-demo")))
            .andExpect(status().isOk()).andExpect(content().json("[]"));
        http.perform(get("/api/tasks?size=101").with(httpBasic("alice", "alice-demo")))
            .andExpect(status().isBadRequest());
    }
    @Test
    void staleVersionReturns409AndDoesNotOverwriteData() throws Exception {
        long id = createTask();
        http.perform(put("/api/tasks/{id}", id).with(httpBasic("alice", "alice-demo")).with(csrf())
                .contentType("application/json").content("{\"title\":\"updated\",\"version\":0}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.version").value(1));
        http.perform(put("/api/tasks/{id}", id).with(httpBasic("alice", "alice-demo")).with(csrf())
                .contentType("application/json").content("{\"title\":\"stale\",\"version\":0}"))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("VERSION_CONFLICT"));
        assertThat(service.find("alice", id).getTitle()).isEqualTo("updated");
        assertThat(rows("task_audit")).isEqualTo(2);
    }
    @Test
    void failureAfterBothInsertsRollsBackBothTables() throws Exception {
        doAnswer(call -> { call.callRealMethod(); throw new IllegalStateException("audit fault injected by test"); })
            .when(audit).write(anyLong(), anyString(), anyString());
        http.perform(post("/api/tasks").with(httpBasic("alice", "alice-demo")).with(csrf())
                .contentType("application/json").content("{\"title\":\"first\"}"))
            .andExpect(status().isInternalServerError()).andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
            .andExpect(jsonPath("$.message").value("服务暂时不可用"));
        assertThat(rows("tasks")).isZero();
        assertThat(rows("task_audit")).isZero();
    }
    @Test
    void failedUpdateRollsBackTitleVersionAndAudit() throws Exception {
        long id = createTask();
        doAnswer(call -> { call.callRealMethod(); throw new IllegalStateException("update fault"); })
            .when(audit).write(anyLong(), anyString(), anyString());
        http.perform(put("/api/tasks/{id}", id).with(httpBasic("alice", "alice-demo")).with(csrf())
                .contentType("application/json").content("{\"title\":\"rolled back\",\"version\":0}"))
            .andExpect(status().isInternalServerError());
        Task task = service.find("alice", id);
        assertThat(task.getTitle()).isEqualTo("first");
        assertThat(task.getVersion()).isZero();
        assertThat(rows("task_audit")).isEqualTo(1);
    }
    @Test
    void twoConcurrentUpdatesAllowExactlyOneVersionTransition() throws Exception {
        long id = createTask();
        var executor = Executors.newFixedThreadPool(2);
        var ready = new CountDownLatch(2);
        var start = new CountDownLatch(1);
        Callable<Integer> update = () -> {
            ready.countDown();
            if (!start.await(5, TimeUnit.SECONDS)) throw new IllegalStateException("start timeout");
            try { service.update("alice", id, "winner", 0); return 200; }
            catch (BizException error) { return error.status().value(); }
        };
        try {
            Future<Integer> first = executor.submit(update);
            Future<Integer> second = executor.submit(update);
            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            assertThat(java.util.List.of(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS)))
                .containsExactlyInAnyOrder(200, 409);
        } finally {
            start.countDown();
            executor.shutdownNow();
        }
        assertThat(service.find("alice", id).getVersion()).isEqualTo(1);
        assertThat(rows("task_audit")).isEqualTo(2);
    }
}
