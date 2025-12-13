import { apiClient } from '../api-client';

export interface Notification {
  id: string;
  user_id: string;
  type: 'application_received' | 'application_status_changed' | 'message_received' | 'schedule_reminder' | 'system_notification' | 'contract_offer' | 'contract_signed';
  title: string;
  message: string;
  is_read: boolean;
  read_at: string | null;
  related_id: string | null;
  action_url: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// 通知一覧を取得
export const getNotifications = async (params?: { 
  limit?: number;
  offset?: number;
  isRead?: boolean;
}): Promise<NotificationsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  if (params?.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());
  
  const query = queryParams.toString();
  return apiClient.get<NotificationsResponse>(`/api/notifications${query ? `?${query}` : ''}`);
};

// 未読通知の数を取得
export const getUnreadNotificationCount = async (): Promise<{ count: number }> => {
  return apiClient.get<{ count: number }>('/api/notifications/unread-count');
};

// 通知を既読にする
export const markNotificationAsRead = async (notificationId: string): Promise<{ message: string }> => {
  return apiClient.patch<{ message: string }>(`/api/notifications/${notificationId}/read`, {});
};

// すべての通知を既読にする
export const markAllNotificationsAsRead = async (): Promise<{ message: string }> => {
  return apiClient.patch<{ message: string }>('/api/notifications/mark-all-read', {});
};

// 通知を削除
export const deleteNotification = async (notificationId: string): Promise<{ message: string }> => {
  return apiClient.delete<{ message: string }>(`/api/notifications/${notificationId}`);
};

