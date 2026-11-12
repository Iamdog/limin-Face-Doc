package com.example.workshop;

public class Task {
    private Long id;
    private String owner;
    private String title;
    private Integer version;
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
}
