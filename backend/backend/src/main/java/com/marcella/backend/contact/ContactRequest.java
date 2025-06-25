package com.marcella.backend.contact;

import lombok.Data;

@Data
public class ContactRequest {
    private String name;
    private String email;
    private String page;
    private String subject;
    private String message;
}
