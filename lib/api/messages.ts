import { apiClient } from '../api-client';

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  sender: {
    id: string;
    email: string;
    userType: 'pharmacist' | 'pharmacy';
  };
}

export interface MessageThread {
  id: string;
  applicationId: number;
  createdAt: string;
  updatedAt: string;
  application: {
    id: number;
    status: string;
    jobPosting?: {
      id: number;
      title: string;
      pharmacy?: {
        pharmacyName: string;
        profileImageUrl: string | null;
      };
    };
    pharmacist?: {
      id: number;
      firstName: string;
      lastName: string;
      profileImageUrl: string | null;
    };
  };
  messages?: Message[];
  _count?: {
    messages: number;
  };
}

export interface SendMessageData {
  threadId: string;
  content: string;
}

export interface ThreadsResponse {
  threads: MessageThread[];
}

export interface ThreadDetailResponse {
  thread: MessageThread;
  messages: Message[];
}

export interface UnreadCountResponse {
  unreadCount: number;
}

// Send message
export const sendMessage = async (data: SendMessageData) => {
  return apiClient.post<{ message: string; data: Message }>('/api/messages', data);
};

// Get my message threads
export const getMyThreads = async () => {
  return apiClient.get<ThreadsResponse>('/api/messages/threads');
};

// Get messages by thread
export const getMessagesByThread = async (threadId: string) => {
  return apiClient.get<ThreadDetailResponse>(`/api/messages/thread/${threadId}`);
};

// Get unread message count
export const getUnreadCount = async () => {
  return apiClient.get<UnreadCountResponse>('/api/messages/unread-count');
};

// Mark messages as read
export const markAsRead = async (threadId: string) => {
  return apiClient.patch<{ message: string; updatedCount: number }>(`/api/messages/thread/${threadId}/read`, {});
};



