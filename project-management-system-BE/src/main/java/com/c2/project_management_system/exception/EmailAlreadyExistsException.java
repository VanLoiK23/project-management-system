package com.c2.project_management_system.exception;

public class EmailAlreadyExistsException extends RuntimeException {
	 
    public EmailAlreadyExistsException(String email) {
        super("Email đã tồn tại: " + email);
    }
}