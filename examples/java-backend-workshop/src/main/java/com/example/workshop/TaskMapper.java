package com.example.workshop;

import java.util.List;
import org.apache.ibatis.annotations.*;

@Mapper
public interface TaskMapper {
    @Insert("INSERT INTO tasks(owner, title) VALUES(#{owner}, #{title})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Task task);

    @Select("SELECT id, owner, title, version FROM tasks WHERE id = #{id} AND owner = #{owner}")
    Task find(@Param("id") long id, @Param("owner") String owner);

    @Select("SELECT id, owner, title, version FROM tasks WHERE owner = #{owner} ORDER BY id DESC LIMIT #{size}")
    List<Task> list(@Param("owner") String owner, @Param("size") int size);

    @Update("UPDATE tasks SET title = #{title}, version = version + 1 WHERE id = #{id} AND owner = #{owner} AND version = #{version}")
    int update(@Param("id") long id, @Param("owner") String owner,
               @Param("title") String title, @Param("version") int version);

    @Insert("INSERT INTO task_audit(task_id, actor, operation) VALUES(#{taskId}, #{actor}, #{operation})")
    int insertAudit(@Param("taskId") long taskId, @Param("actor") String actor,
                    @Param("operation") String operation);
}
