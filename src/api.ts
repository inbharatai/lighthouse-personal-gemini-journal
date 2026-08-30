import { User } from 'firebase/auth';
import {
  Journal,
  Message,
  Summary,
  ChatRequest,
  ChatResponse,
  JournalDetailResponse,
  JournalExportResponse,
  UserMeResponse,
} from '../shared/types';

let activeAbortController: AbortController | null = null;
let currentInitiatingUid: string | null = null;

export function abortActiveRequests() {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
}

export function setApiAuthContext(uid: string | null) {
  if (currentInitiatingUid !== uid) {
    abortActiveRequests();
    currentInitiatingUid = uid;
  }
}

async function request<T>(
  user: User,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const initiatingUid = user.uid;

  // Ensure initiating UID matches current active context
  if (currentInitiatingUid && currentInitiatingUid !== initiatingUid) {
    throw new Error('AUTH_TRANSITION: Request cancelled due to user account switch');
  }

  const token = await user.getIdToken();

  const controller = new AbortController();
  activeAbortController = controller;

  try {
    const res = await fetch(endpoint, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    // Verification after response: ensure UID hasn't switched during network round-trip
    if (currentInitiatingUid && currentInitiatingUid !== initiatingUid) {
      throw new Error('AUTH_TRANSITION: Response discarded due to auth change');
    }

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok) {
      let errMessage = `Error ${res.status}: ${res.statusText}`;
      if (contentType.includes('application/json')) {
        try {
          const errJson = await res.json();
          if (errJson.error) {
            errMessage = errJson.error;
          }
        } catch {
          // Fallback to statusText
        }
      } else {
        try {
          const text = await res.text();
          if (text && text.length < 200 && !text.includes('<!DOCTYPE') && !text.includes('<html')) {
            errMessage = text;
          }
        } catch {
          // Fallback
        }
      }
      const error: any = new Error(errMessage);
      error.status = res.status;
      throw error;
    }

    if (!contentType.includes('application/json')) {
      throw new Error('Server connection was interrupted. Please try again.');
    }

    return (await res.json()) as T;
  } finally {
    if (activeAbortController === controller) {
      activeAbortController = null;
    }
  }
}

export const api = {
  async getMe(user: User): Promise<UserMeResponse> {
    return request<UserMeResponse>(user, '/api/me');
  },

  async listJournals(user: User): Promise<{ journals: Journal[] }> {
    return request<{ journals: Journal[] }>(user, '/api/journals');
  },

  async createJournal(user: User, title: string): Promise<{ journal: Journal }> {
    return request<{ journal: Journal }>(user, '/api/journals', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  async getJournal(user: User, id: string): Promise<JournalDetailResponse> {
    return request<JournalDetailResponse>(user, `/api/journals/${id}`);
  },

  async exportJournal(user: User, id: string): Promise<JournalExportResponse> {
    return request<JournalExportResponse>(user, `/api/journals/${id}/export`);
  },

  async deleteJournal(user: User, id: string): Promise<{ success: boolean; deletedId: string }> {
    return request<{ success: boolean; deletedId: string }>(user, `/api/journals/${id}`, {
      method: 'DELETE',
    });
  },

  async sendChat(user: User, payload: ChatRequest): Promise<ChatResponse> {
    return request<ChatResponse>(user, '/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
