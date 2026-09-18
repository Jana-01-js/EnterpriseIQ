export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export type UserStatus = 'ACTIVE' | 'DISABLED';

export interface User {
  preferences?: { citations: boolean; suggestions: boolean };
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId: string;
  departmentName: string;
  status: UserStatus;
  lastActive: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  docCount: number;
  popularSearches: string[];
  iconName: string;
}

export type DocumentStatus = 'Uploaded' | 'Processing' | 'Indexed' | 'Failed';

export type AccessLevel = 'Public' | 'Department only' | 'Managers only' | 'Restricted';

export type FileType = 'PDF' | 'DOCX' | 'TXT' | 'CSV' | 'Markdown';

export interface DocumentItem {
  id: string;
  title: string;
  description: string;
  filename: string;
  fileType: FileType;
  fileSize: string;
  departmentId: string;
  departmentName: string;
  uploadedBy: string;
  uploadedById: string;
  uploadedAt: string;
  status: DocumentStatus;
  accessLevel: AccessLevel;
  tags: string[];
  chunkCount: number;
  content: string; // Plaintext representation
  summary?: string;
  isBookmarked?: boolean;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  departmentId: string;
  accessLevel: AccessLevel;
  content: string;
  chunkIndex: number;
  pageNumber: number;
  embedding?: number[];
  score?: number; // Similarity score 0 - 1
}

export interface SourceCitation {
  id: string;
  documentId: string;
  documentTitle: string;
  departmentName: string;
  pageNumber: number;
  relevanceScore: number; // e.g. 0.94 for 94%
  snippet: string;
  accessLevel: AccessLevel;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: SourceCitation[];
  confidence?: 'High' | 'Medium' | 'Low';
  sourceRelevance?: number; // e.g. 94
  suggestedQuestions?: string[];
  knowledgeGapDetected?: boolean;
  relatedDocuments?: { id: string; title: string; departmentName: string }[];
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface SearchResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  departmentName: string;
  fileType: FileType;
  uploadedAt: string;
  uploadedBy: string;
  relevanceScore: number;
  snippet: string;
  pageNumber: number;
  tags: string[];
  accessLevel: AccessLevel;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string; // e.g., 'LOGIN', 'DOCUMENT_UPLOAD', 'AI_QUERY', 'SEARCH', 'PERMISSION_CHANGE'
  resource: string;
  ipAddress: string;
  timestamp: string;
  details?: string;
}

export interface SystemAnalytics {
  totalDocuments: number;
  indexedDocuments: number;
  totalUsers: number;
  knowledgeQueries: number;
  docsAddedThisMonth: number;
  avgRetrievalScore: number; // e.g., 92.4
  activeUsersToday: number;
  queriesOverTime: { date: string; queries: number }[];
  documentsByDepartment: { department: string; count: number }[];
  documentsByType: { type: string; count: number }[];
  popularSearchTopics: { topic: string; count: number }[];
  recentActivity: AuditLog[];
  topSearchTopics: { topic: string; count: number }[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface DocumentActionItem {
  item: string;
  priority: 'High' | 'Medium' | 'Low';
  deadline?: string;
  owner?: string;
}

export interface DocumentRiskItem {
  title: string;
  severity: 'High' | 'Medium' | 'Low';
  description: string;
  recommendation: string;
}

export interface DocumentAiToolsResult {
  mode: 'actionItems' | 'complianceRisk' | 'quiz' | 'simplify' | 'customQa';
  actionItems?: DocumentActionItem[];
  risks?: DocumentRiskItem[];
  quiz?: QuizQuestion[];
  simplified?: string;
  qaAnswer?: string;
}

export interface SuggestedMetadata {
  title: string;
  description: string;
  departmentId: string;
  accessLevel: AccessLevel;
  tags: string[];
}

export interface AiSearchOverview {
  summary: string;
  keyPoints: string[];
  confidence: 'High' | 'Medium' | 'Low';
  citations: { docId: string; title: string; pageNumber: number }[];
  relatedQueries: string[];
}

export interface KnowledgeGapItem {
  id: string;
  topic: string;
  departmentId: string;
  departmentName: string;
  severity: 'Critical' | 'Moderate' | 'Minor';
  frequency: number;
  description: string;
  suggestedTitle: string;
}

export interface PolicyDraft {
  title: string;
  description: string;
  departmentId: string;
  accessLevel: AccessLevel;
  tags: string[];
  content: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password?: string;
  departmentId: string;
}

export type WorkTaskPriority = 'Urgent' | 'High' | 'Medium' | 'Low';
export type WorkTaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';

export interface WorkTask {
  id: string;
  title: string;
  description: string;
  departmentId: string;
  departmentName: string;
  relatedDocId?: string;
  relatedDocTitle?: string;
  estimatedMinutes: number;
  loggedMinutes: number;
  priority: WorkTaskPriority;
  status: WorkTaskStatus;
  deadline: string; // ISO date string or HH:MM
  assignedTo: string;
  assignedToId: string;
  recommendedBreakMinutes: number; // e.g., 5 or 10 min break recommendation
  completedAt?: string;
  createdAt: string;
}

export type WorkTimeAlertSeverity = 'critical' | 'warning' | 'info' | 'success';
export type WorkTimeAlertType =
  | 'WORKLOAD_DEFICIT'
  | 'APPROACHING_TASK_LIMIT'
  | 'TASK_LIMIT_REACHED'
  | 'TASK_OVERTIME'
  | 'CONTINUOUS_WORK_BREAK'
  | 'URGENT_DEADLINE'
  | 'SHIFT_LIMIT_APPROACHING';

export interface WorkTimeAlert {
  id: string;
  type: WorkTimeAlertType;
  severity: WorkTimeAlertSeverity;
  title: string;
  message: string;
  taskId?: string;
  taskTitle?: string;
  timestamp: string;
  actionLabel?: string;
  actionType?: 'START_TASK' | 'TAKE_BREAK' | 'EXTEND_TIME' | 'COMPLETE_TASK' | 'VIEW_TASK';
  dismissed?: boolean;
}

export interface WorkScheduleConfig {
  shiftStart: string; // e.g. "09:00"
  shiftEnd: string; // e.g. "17:00"
  shiftDurationMinutes: number; // 480 mins (8 hours)
  breakIntervalMinutes: number; // e.g., 50 mins
  breakDurationMinutes: number; // e.g., 10 mins
  soundAlertsEnabled: boolean;
}
