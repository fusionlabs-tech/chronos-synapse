export interface Notification {
 id: string;
 userId: string;
 type:
  | 'job_success'
  | 'job_failed'
  | 'job_timeout'
  | 'system_alert'
  | 'job_created'
  | 'job_updated'
  | 'job_deleted';
 title: string;
 message: string;
 data?: Record<string, any>;
 isRead: boolean;
 createdAt: string;
 readAt?: string;
}

export interface NotificationResponse {
 notifications: Notification[];
 unreadCount: number;
 pagination?: PaginationInfo;
}

export interface PaginationInfo {
 page: number;
 limit: number;
 total: number;
 totalPages: number;
 hasNext: boolean;
 hasPrev: boolean;
}
