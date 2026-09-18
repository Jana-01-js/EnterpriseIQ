import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
  UserRole,
  DocumentItem,
  SearchResult,
  ChatMessage,
  Conversation,
  SystemAnalytics,
  AuditLog,
  Department,
  DocumentAiToolsResult,
  SuggestedMetadata,
  AiSearchOverview,
  KnowledgeGapItem,
  PolicyDraft,
  WorkTask,
} from '../types';

const getAuthHeaders = () => {
  const token = localStorage.getItem('eiq_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

async function accountRequest(url: string, method = 'GET', body?: unknown) {
  const res = await fetch(url, { method, headers: getAuthHeaders(), ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  updateProfile: (name: string, preferences: { citations: boolean; suggestions: boolean }): Promise<User> => accountRequest('/api/auth/profile', 'PUT', { name, preferences }),
  changePassword: (currentPassword: string, newPassword: string) => accountRequest('/api/auth/password', 'PUT', { currentPassword, newPassword }),
  getBookmarks: (): Promise<DocumentItem[]> => accountRequest('/api/bookmarks'),
  setBookmark: (id: string, saved: boolean) => accountRequest('/api/bookmarks/' + encodeURIComponent(id), 'PUT', { saved }),
  // Auth
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  getMe: async (): Promise<User> => {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to authenticate session');
    }
    return res.json();
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    const res = await fetch('/api/users', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
  },

  updateUserRole: async (id: string, role: UserRole): Promise<User> => {
    return api.updateUser(id, { role });
  },

  // Departments
  getDepartments: async (): Promise<Department[]> => {
    const res = await fetch('/api/departments');
    if (!res.ok) throw new Error('Failed to fetch departments');
    return res.json();
  },

  // Documents
  getDocuments: async (): Promise<DocumentItem[]> => {
    const res = await fetch('/api/documents', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  getDocumentById: async (id: string): Promise<DocumentItem & { chunks: any[] }> => {
    const res = await fetch(`/api/documents/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load document preview');
    return res.json();
  },

  uploadDocument: async (formData: FormData): Promise<DocumentItem> => {
    const token = localStorage.getItem('eiq_auth_token');
    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Document upload failed');
    }
    return res.json();
  },

  deleteDocument: async (id: string): Promise<void> => {
    const res = await fetch(`/api/documents/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete document');
  },

  reindexDocument: async (id: string): Promise<DocumentItem> => {
    const res = await fetch(`/api/documents/${id}/reindex`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to re-index document');
    const data = await res.json();
    return data.doc;
  },

  summarizeDocument: async (id: string): Promise<string> => {
    const res = await fetch(`/api/documents/${id}/summary`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to generate summary');
    const data = await res.json();
    return data.summary;
  },

  // Global Semantic Search
  search: async (params: { query: string; departmentId?: string; fileType?: string; accessLevel?: string }): Promise<SearchResult[]> => {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    return data.results;
  },

  // RAG Chat Assistant
  askAssistant: async (question: string, conversationId?: string, scopedDocumentId?: string): Promise<{ conversationId: string; userMessage: ChatMessage; assistantMessage: ChatMessage }> => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ question, conversationId, scopedDocumentId }),
    });
    if (!res.ok) throw new Error('Failed to query knowledge assistant');
    return res.json();
  },

  getChatHistory: async (): Promise<Conversation[]> => {
    const res = await fetch('/api/chat/history', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch chat history');
    return res.json();
  },

  getConversationMessages: async (id: string): Promise<{ conversation: Conversation; messages: ChatMessage[] }> => {
    const res = await fetch(`/api/chat/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load conversation messages');
    return res.json();
  },

  deleteConversation: async (id: string): Promise<void> => {
    const res = await fetch(`/api/chat/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete chat');
  },

  compareDocuments: async (docId1: string, docId2: string): Promise<string> => {
    const res = await fetch('/api/chat/compare', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ docId1, docId2 }),
    });
    if (!res.ok) throw new Error('Failed to compare documents');
    const data = await res.json();
    return data.comparison;
  },

  // Analytics & Audit Logs
  getAnalytics: async (): Promise<SystemAnalytics> => {
    const res = await fetch('/api/analytics', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch analytics data');
    return res.json();
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await fetch('/api/audit-logs', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  // Advanced AI Features
  executeAiTool: async (
    docId: string,
    mode: 'actionItems' | 'complianceRisk' | 'quiz' | 'simplify' | 'customQa',
    question?: string
  ): Promise<DocumentAiToolsResult> => {
    const res = await fetch(`/api/documents/${docId}/ai-tools`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ mode, question }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'AI tool execution failed');
    }
    return res.json();
  },

  suggestMetadata: async (content: string, filename?: string): Promise<SuggestedMetadata> => {
    const res = await fetch('/api/ai/suggest-metadata', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, filename }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Metadata suggestion failed');
    }
    return res.json();
  },

  getSearchAiOverview: async (query: string, results: SearchResult[]): Promise<AiSearchOverview> => {
    const res = await fetch('/api/search/ai-overview', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query, results }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate AI search overview');
    }
    return res.json();
  },

  getKnowledgeGaps: async (): Promise<KnowledgeGapItem[]> => {
    const res = await fetch('/api/ai/knowledge-gaps', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch knowledge gap report');
    return res.json();
  },

  draftPolicy: async (topic: string, departmentId: string, targetAudience?: string): Promise<PolicyDraft> => {
    const res = await fetch('/api/ai/draft-policy', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ topic, departmentId, targetAudience }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to draft policy');
    }
    return res.json();
  },

  saveDraftPolicy: async (draft: PolicyDraft): Promise<DocumentItem> => {
    const formData = new FormData();
    formData.append('title', draft.title);
    formData.append('departmentId', draft.departmentId);
    formData.append('description', draft.description);
    formData.append('accessLevel', draft.accessLevel);
    formData.append('tags', draft.tags.join(', '));
    formData.append('textContent', draft.content);

    return api.uploadDocument(formData);
  },

  // Work Tasks & Work Time
  getWorkTasks: async (): Promise<WorkTask[]> => accountRequest('/api/work-tasks'),
  
  createWorkTask: async (task: Partial<WorkTask>): Promise<WorkTask> => {
    return accountRequest('/api/work-tasks', 'POST', task);
  },

  updateWorkTask: async (id: string, updates: Partial<WorkTask>): Promise<WorkTask> => {
    return accountRequest(`/api/work-tasks/${encodeURIComponent(id)}`, 'PUT', updates);
  },

  deleteWorkTask: async (id: string): Promise<{ success: boolean; id: string }> => {
    return accountRequest(`/api/work-tasks/${encodeURIComponent(id)}`, 'DELETE');
  },

  logWorkTaskTime: async (id: string, minutes: number): Promise<WorkTask> => {
    return accountRequest(`/api/work-tasks/${encodeURIComponent(id)}/log-time`, 'POST', { minutes });
  },

  aiEstimateWorkTime: async (title: string, description?: string, docId?: string): Promise<{
    estimatedMinutes: number;
    recommendedBreakMinutes: number;
    difficulty: string;
    reasoning: string;
    checklistSteps: string[];
  }> => {
    return accountRequest('/api/work-tasks/ai-estimate-time', 'POST', { title, description, docId });
  },
};
