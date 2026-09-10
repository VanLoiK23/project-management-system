package com.c2.project_management_system.service;

public interface EmailService {
	boolean sendOTPEmail(String toEmail, String OTP);
	
	boolean sendResetEmail(String toEmail, String token);
}
