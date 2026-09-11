package com.c2.project_management_system.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationSettingRequest {
    private Boolean appEnabled;
    private Boolean emailEnabled;
    private Boolean smsEnabled;
}