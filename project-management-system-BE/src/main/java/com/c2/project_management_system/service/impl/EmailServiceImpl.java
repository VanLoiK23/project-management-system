package com.c2.project_management_system.service.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.c2.project_management_system.service.EmailService;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

	private final JavaMailSenderImpl mailSender;

	@Value("${url.front-end}")
	private String url;

	public boolean sendOTPEmail(String toEmail, String OTP) {
		try {
			MimeMessage message = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

			helper.setTo(toEmail);
			helper.setSubject("C2 - Verify your identity");

			StringBuilder htmlContent = new StringBuilder();
			htmlContent.append(
					"<div style='font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eef0fc; rounded-top: 11px;'>")
					.append("<div style='text-align: center; margin-bottom: 24px;'>")
					.append("<h2 style='color: #5B5FC7; margin: 0; font-size: 22px;'>Project Management System</h2>")
					.append("<p style='color: #00C3FF; font-size: 14px; margin: 5px 0 0 0; font-weight: bold;'>Find your dream job</p>")
					.append("</div>")
					.append("<div style='background-color: #FAFAFB; padding: 24px; border-radius: 11px; text-align: center; border: 1px solid #eef0fc;'>")
					.append("<h3 style='color: #333333; margin-top: 0; font-size: 16px;'>Identity Verification</h3>")
					.append("<p style='color: #666666; font-size: 13px; line-height: 1.6;'>Thank you for choosing my service. Please use the following 6-digit One-Time Password (OTP) to complete your registration procedure. This code is valid for 5 minutes.</p>")
					.append("<div style='margin: 24px 0; padding: 12px; background-color: #E0F7FF; border: 1px dashed #00C3FF; border-radius: 8px; display: inline-block; letter-spacing: 6px; font-size: 26px; font-weight: bold; color: #5B5FC7;'>")
					.append(OTP).append("</div>")
					.append("<p style='color: #999999; font-size: 11px; margin-bottom: 0;'>If you did not request this code, please ignore this email safely.</p>")
					.append("</div>")
					.append("<p style='margin-top: 24px; font-size: 12px; color: #666666; text-align: center;'>Best regards,<br><strong>TechRoute Operations Team</strong></p>")
					.append("</div>");

			helper.setText(htmlContent.toString(), true);

			mailSender.send(message);

			return true;
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
	}

	@Override
	public boolean sendResetEmail(String toEmail, String token) {
		try {
			MimeMessage message = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

			helper.setTo(toEmail);
			helper.setSubject("TechRoute - Link reset your password");

			String resetLink = url + "reset-password/" + token;

			StringBuilder htmlContent = new StringBuilder();
			htmlContent.append(
					"<div style='font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eef0fc; border-radius: 11px;'>")
					.append("<h2 style='color: #5B5FC7;'>Project Management System - Reset Your Password</h2>")
					.append("<p style='color: #666666; font-size: 13px; line-height: 1.6;'>We received a request to reset your password. Click the button below to change your password. This link is valid for 15 minutes.</p>")
					.append("<div style='text-align: center; margin: 30px 0;'>").append("<a href='").append(resetLink)
					.append("' style='background-color: #00C3FF; color: white; padding: 12px 30px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;'>Reset Password</a>")
					.append("</div>")
					.append("<p style='color: #999999; font-size: 11px;'>If you did not request a password reset, please ignore this email.</p>")
					.append("</div>");

			helper.setText(htmlContent.toString(), true);

			mailSender.send(message);

			return true;
		} catch (Exception e) {
			e.printStackTrace();
			return false;
		}
	}

}
