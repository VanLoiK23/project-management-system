package com.c2.project_management_system.exception;

public class AccountLockedException extends RuntimeException {
	 
    public AccountLockedException() {
        super("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên");
    }
}
 
