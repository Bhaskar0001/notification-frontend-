export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: Role;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export type ChannelType = 'WHATSAPP' | 'EMAIL' | 'WEB_PUSH';

export interface ChannelInfo {
  configured: boolean;
  enabled: boolean;
  template_id: string | null;
  template_name: string | null;
}

export interface Trigger {
  id: string;
  name: string;
  event_key: string;
  description: string;
  is_active: boolean;
  whatsapp: ChannelInfo;
  email: ChannelInfo;
  web_push: ChannelInfo;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  trigger: string;
  trigger_name: string;
  trigger_event_key: string;
  channel: ChannelType;
  name: string;
  subject?: string;
  title?: string;
  body: string;
  variables: string[];
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type NotificationStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';

export interface DeliveryAttempt {
  id: string;
  attempt_number: number;
  status: string;
  provider_response: Record<string, any>;
  error_message: string;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  event_id: string;
  user_email: string;
  user_name: string;
  trigger_name: string;
  channel: ChannelType;
  provider: string;
  status: NotificationStatus;
  attempt_count: number;
  created_at: string;
  sent_at: string | null;
  failed_at: string | null;
}

export interface NotificationDetail extends NotificationLog {
  event_key: string;
  user: User;
  trigger: {
    id: string;
    name: string;
    event_key: string;
    description: string;
  };
  template: NotificationTemplate;
  provider_message_id: string;
  rendered_payload: {
    subject?: string;
    title?: string;
    body: string;
  };
  error_message: string;
  queued_at: string | null;
  updated_at: string;
  delivery_attempts: DeliveryAttempt[];
}

export interface AdminStats {
  total_triggers: number;
  configured_templates: number;
  failed_notifications: number;
  recent_notifications: NotificationLog[];
}
