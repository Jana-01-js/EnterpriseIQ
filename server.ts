import { config } from 'dotenv';
import fs from 'node:fs';
import { randomBytes } from 'node:crypto';
config({ path: '.env.local' });
config();
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) throw new Error('JWT_SECRET is required in production');
const JWT_SECRET = process.env.JWT_SECRET || randomBytes(48).toString('hex');
const PORT = Number(process.env.PORT || 3000);

// Initialize Gemini Client server-side if key present
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// --- DATA TYPES FOR IN-MEMORY DATABASE ---
interface DBUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  departmentId: string;
  departmentName: string;
  status: 'ACTIVE' | 'DISABLED';
  lastActive: string;
  createdAt: string;
  bookmarks?: string[];
  preferences?: { citations: boolean; suggestions: boolean };
}

interface DBDepartment {
  id: string;
  name: string;
  description: string;
  popularSearches: string[];
  iconName: string;
}

interface DBDocument {
  id: string;
  title: string;
  description: string;
  filename: string;
  fileType: 'PDF' | 'DOCX' | 'TXT' | 'CSV' | 'Markdown';
  fileSize: string;
  departmentId: string;
  departmentName: string;
  uploadedBy: string;
  uploadedById: string;
  uploadedAt: string;
  status: 'Uploaded' | 'Processing' | 'Indexed' | 'Failed';
  accessLevel: 'Public' | 'Department only' | 'Managers only' | 'Restricted';
  tags: string[];
  content: string; // full text content
  summary?: string;
}

interface DBChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  departmentId: string;
  departmentName: string;
  accessLevel: 'Public' | 'Department only' | 'Managers only' | 'Restricted';
  content: string;
  chunkIndex: number;
  pageNumber: number;
  vectorTokens: string[];
}

interface DBChatMessage {
  id: string;
  conversationId: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: any[];
  confidence?: 'High' | 'Medium' | 'Low';
  sourceRelevance?: number;
  suggestedQuestions?: string[];
  knowledgeGapDetected?: boolean;
  relatedDocuments?: any[];
}

interface DBConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface DBAuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  ipAddress: string;
  timestamp: string;
  details?: string;
}

// --- INITIALIZE DEMO DATABASE STATE ---
const departments: DBDepartment[] = [
  { id: 'dep-hr', name: 'Human Resources', description: 'Policies, leave management, onboarding & benefits', popularSearches: ['leave policy', 'onboarding schedule', 'parental leave'], iconName: 'Users' },
  { id: 'dep-fin', name: 'Finance', description: 'Procurement, expense limits, budgets & audits', popularSearches: ['meal allowance', 'travel cap', 'vendor approval'], iconName: 'DollarSign' },
  { id: 'dep-eng', name: 'Engineering', description: 'Architecture, dev guidelines, sprint workflows', popularSearches: ['PR review process', 'deployment checklist', 'JIRA workflow'], iconName: 'Code' },
  { id: 'dep-mkt', name: 'Marketing', description: 'Brand assets, press guidelines & campaigns', popularSearches: ['brand logo SVG', 'press release template', 'social media policy'], iconName: 'Megaphone' },
  { id: 'dep-ops', name: 'Operations', description: 'Facilities, vendor management & logistics', popularSearches: ['badge replacement', 'office hours', 'visitor registration'], iconName: 'Briefcase' },
  { id: 'dep-leg', name: 'Legal', description: 'Contracts, NDAs, compliance & ISO standards', popularSearches: ['NDA template', 'ISO 27001 compliance', 'vendor contract'], iconName: 'Scale' },
  { id: 'dep-it', name: 'Information Technology', description: 'Cybersecurity, systems access, VPN & IT support', popularSearches: ['VPN setup', 'password rotation', '2FA hardware token'], iconName: 'ShieldCheck' },
];

const passwordHashAdmin = bcrypt.hashSync('admin123', 10);
const passwordHashManager = bcrypt.hashSync('manager123', 10);
const passwordHashEmp = bcrypt.hashSync('employee123', 10);

const users: DBUser[] = [
  {
    id: 'usr-admin-1',
    name: 'Sarah Connor (Admin)',
    email: 'admin@enterpriseiq.com',
    passwordHash: passwordHashAdmin,
    role: 'ADMIN',
    departmentId: 'dep-it',
    departmentName: 'Information Technology',
    status: 'ACTIVE',
    lastActive: new Date().toISOString(),
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'usr-mgr-1',
    name: 'David Miller (Manager)',
    email: 'manager@enterpriseiq.com',
    passwordHash: passwordHashManager,
    role: 'MANAGER',
    departmentId: 'dep-eng',
    departmentName: 'Engineering',
    status: 'ACTIVE',
    lastActive: new Date(Date.now() - 3600000).toISOString(),
    createdAt: '2026-01-15T09:30:00Z',
  },
  {
    id: 'usr-emp-1',
    name: 'Alex Rivera (Employee)',
    email: 'employee@enterpriseiq.com',
    passwordHash: passwordHashEmp,
    role: 'EMPLOYEE',
    departmentId: 'dep-hr',
    departmentName: 'Human Resources',
    status: 'ACTIVE',
    lastActive: new Date(Date.now() - 1800000).toISOString(),
    createdAt: '2026-02-01T10:15:00Z',
  },
];

const documents: DBDocument[] = [
  {
    id: 'doc-hr-leave',
    title: 'Employee Leave Policy & Benefits 2026',
    description: 'Comprehensive guidelines on annual leave, paid time off, sick leave, parental benefits, and approval workflows.',
    filename: 'Employee Leave Policy & Benefits 2026.pdf',
    fileType: 'PDF',
    fileSize: '2.4 MB',
    departmentId: 'dep-hr',
    departmentName: 'Human Resources',
    uploadedBy: 'Sarah Connor (Admin)',
    uploadedById: 'usr-admin-1',
    uploadedAt: '2026-01-12T09:00:00Z',
    status: 'Indexed',
    accessLevel: 'Public',
    tags: ['HR', 'Leave', 'PTO', 'Benefits', 'Policy'],
    summary: 'Outlines the organization leave structure: 18 paid annual leave days, 12 paid sick days, 16 weeks paid maternity leave, 4 weeks paid paternity leave. Requires manager approval 5 days prior via HR portal.',
    content: `EMPLOYEE LEAVE POLICY & BENEFITS 2026 (DEMO KNOWLEDGE BASE)
Page 1: Overview & Scope
EnterpriseIQ provides competitive leave benefits to support employee work-life balance. All full-time employees are eligible for full benefits upon completing their 30-day orientation.

Page 2: Paid Annual Leave (PTO)
Full-time employees accrue 18 days of paid annual leave per calendar year. Up to 5 unused leave days can be carried over into Q1 of the following calendar year, expiring on March 31st. All annual leave requests exceeding 3 consecutive business days must be submitted at least 5 working days in advance through the EnterpriseIQ HR portal.

Page 3: Sick Leave & Personal Emergency
Employees receive 12 fully paid sick leave days annually. For sick leave extending beyond 3 consecutive days, a medical certificate signed by a licensed physician must be uploaded to the portal. Emergency family leave covers up to 5 paid days per year for immediate family care.

Page 4: Parental & Maternity Leave
Primary caregivers are entitled to 16 weeks of 100% paid maternity/parental leave. Secondary caregivers receive 4 weeks of 100% paid parental leave. Flexible return-to-work options (part-time or remote) are available for up to 3 months following parental leave upon approval from HR and department manager.`,
  },
  {
    id: 'doc-it-cybersecurity',
    title: 'Cybersecurity & Data Protection Policy',
    description: 'Mandatory security controls, password hygiene, multi-factor authentication (MFA), and incident reporting procedures.',
    filename: 'Cybersecurity & Data Protection Guidelines.pdf',
    fileType: 'PDF',
    fileSize: '3.1 MB',
    departmentId: 'dep-it',
    departmentName: 'Information Technology',
    uploadedBy: 'Sarah Connor (Admin)',
    uploadedById: 'usr-admin-1',
    uploadedAt: '2026-01-14T11:20:00Z',
    status: 'Indexed',
    accessLevel: 'Public',
    tags: ['Security', 'Passwords', '2FA', 'MFA', 'Cybersecurity', 'Compliance'],
    summary: 'Defines mandatory security rules: 16+ character passwords changed every 90 days, mandatory hardware/software MFA for all internal tools, immediate 15-minute lockout on suspicious logins.',
    content: `CYBERSECURITY & DATA PROTECTION POLICY (DEMO KNOWLEDGE BASE)
Page 1: Information Security Mandates
Protecting client data and internal intellectual property is paramount. All employees must complete quarterly security awareness training and adhere strictly to zero-trust architecture guidelines.

Page 2: Password Requirements & Access Controls
All corporate passwords must be at least 16 characters long and include uppercase letters, lowercase letters, numbers, and special symbols. Passwords expire every 90 days. Passwords must never be shared or written down. Multi-Factor Authentication (MFA) via TOTP authenticator app or hardware YubiKey is mandatory for all access attempts to internal systems, Google Workspace, and corporate VPN.

Page 3: Remote Access & VPN Usage
Employees connecting to EnterpriseIQ network resources from outside corporate offices must route traffic through the EnterpriseIQ WireGuard VPN client. Public Wi-Fi networks (cafes, airports) must never be used without an active encrypted VPN tunnel.

Page 4: Incident Response & Reporting
Any suspected phishing email, unauthorized access attempt, lost corporate laptop, or credential leak must be reported within 15 minutes to security-ops@enterpriseiq.com or via the IT Incident Hotline (#4499).`,
  },
  {
    id: 'doc-eng-guidelines',
    title: 'Engineering Code Review & Sprint Standards',
    description: 'Guidelines for code quality, Pull Request (PR) requirements, automated CI/CD checks, and sprint ceremonies.',
    filename: 'Project Management & Engineering Standards.md',
    fileType: 'Markdown',
    fileSize: '1.1 MB',
    departmentId: 'dep-eng',
    departmentName: 'Engineering',
    uploadedBy: 'David Miller (Manager)',
    uploadedById: 'usr-mgr-1',
    uploadedAt: '2026-01-20T14:15:00Z',
    status: 'Indexed',
    accessLevel: 'Department only',
    tags: ['Engineering', 'Code Review', 'Git', 'Agile', 'Sprint'],
    summary: 'Standard operating procedure for software engineering: 2 peer approvals required per PR, 80%+ unit test coverage, 2-week sprint cycles with Monday planning and Friday retrospectives.',
    content: `ENGINEERING CODE REVIEW & SPRINT STANDARDS (DEMO KNOWLEDGE BASE)
Page 1: Development Workflow & Git Strategy
We utilize GitHub Flow with feature branches off 'main'. Direct commits to main are blocked. All pull requests must pass automated linting, security scanning, and unit testing before review.

Page 2: Pull Request Approval Policy
Every Pull Request requires at least two approving code reviews from peer senior engineers before merging. PRs must contain clear context, issue links (JIRA-XXX), and screenshots for frontend UI changes. Automated unit test coverage must not drop below 80%.

Page 3: Sprint Ceremonies & Delivery
Engineering operates on 2-week sprint cycles beginning every second Monday at 10:00 AM EST. Daily standups occur synchronously at 9:45 AM EST (15 minutes max). Sprint grooming takes place on Wednesday afternoon, and Sprint Retrospectives occur on the final Friday of each cycle.`,
  },
  {
    id: 'doc-fin-procurement',
    title: 'Financial Expense & Procurement Guidelines',
    description: 'Rules for corporate credit card usage, travel expense reimbursements, meal caps, and procurement limits.',
    filename: 'Financial Expense & Procurement Guidelines.csv',
    fileType: 'CSV',
    fileSize: '850 KB',
    departmentId: 'dep-fin',
    departmentName: 'Finance',
    uploadedBy: 'Sarah Connor (Admin)',
    uploadedById: 'usr-admin-1',
    uploadedAt: '2026-01-25T16:00:00Z',
    status: 'Indexed',
    accessLevel: 'Managers only',
    tags: ['Finance', 'Expense', 'Procurement', 'Travel', 'Budget'],
    summary: 'Financial expense caps: $75 daily meal allowance during business travel, $250/night hotel allowance, purchases over $1,000 require VP approval.',
    content: `FINANCIAL EXPENSE & PROCUREMENT GUIDELINES (DEMO KNOWLEDGE BASE)
Page 1: Travel & Meal Expense Allowances
Business travel expenses must be submitted via Concur within 14 days of travel completion. Daily meal allowance is capped at $75 USD per day. Hotel accommodations are capped at $250 USD per night in standard cities and $350 USD per night in tier-1 metro areas (NYC, SF, Tokyo, London).

Page 2: Procurement & Approval Limits
Department managers have spending authorization up to $1,000 USD per single purchase. Equipment or software purchases between $1,000 and $10,000 require Finance Director approval. Capital expenditures exceeding $10,000 require VP and CFO sign-off with three competitive vendor quotes.`,
  },
  {
    id: 'doc-hr-onboarding',
    title: 'Employee Onboarding & Culture Handbook',
    description: 'First 90 days roadmap, IT hardware provisioning, benefits enrollment, mentor pairing, and company values.',
    filename: 'Employee Onboarding & Culture Guide.docx',
    fileType: 'DOCX',
    fileSize: '1.8 MB',
    departmentId: 'dep-hr',
    departmentName: 'Human Resources',
    uploadedBy: 'Alex Rivera (Employee)',
    uploadedById: 'usr-emp-1',
    uploadedAt: '2026-02-02T10:00:00Z',
    status: 'Indexed',
    accessLevel: 'Public',
    tags: ['Onboarding', 'HR', 'Culture', 'Handbook', 'New Hire'],
    summary: 'New hire onboarding playbook: Day 1 IT hardware pick-up, Day 2-5 HR orientation & mentor pairing, Month 1 key performance alignment, Month 3 probation review.',
    content: `EMPLOYEE ONBOARDING & CULTURE HANDBOOK (DEMO KNOWLEDGE BASE)
Page 1: Welcome to EnterpriseIQ
Our mission is to empower teams with grounded artificial intelligence. Your first 90 days are structured to give you a seamless introduction to our team, tools, and values.

Page 2: Week 1 Onboarding Schedule
Day 1: Hardware setup, IT credential pickup, and welcome lunch with your team mentor.
Day 2: HR benefits briefing, company history, and compliance module completions.
Day 3-5: Shadowing mentor, environment configuration, and introductory 1-on-1 with department manager.

Page 3: First 90 Days Roadmap
30 Days: Complete initial starter task, achieve full tool access.
60 Days: Participate in first full sprint/project cycle, receive 60-day feedback from manager.
90 Days: First formal performance review and transition from probationary status.`,
  },
  {
    id: 'doc-it-vpn',
    title: 'IT Helpdesk & Remote VPN Setup Guide',
    description: 'Step-by-step instructions for installing WireGuard VPN, configuring SSO, and troubleshooting hardware tickets.',
    filename: 'IT Support & Systems Access Protocols.txt',
    fileType: 'TXT',
    fileSize: '420 KB',
    departmentId: 'dep-it',
    departmentName: 'Information Technology',
    uploadedBy: 'Sarah Connor (Admin)',
    uploadedById: 'usr-admin-1',
    uploadedAt: '2026-02-05T15:30:00Z',
    status: 'Indexed',
    accessLevel: 'Public',
    tags: ['IT', 'VPN', 'WireGuard', 'Helpdesk', 'Support'],
    summary: 'Step-by-step connection guide for WireGuard VPN client on macOS/Windows, SSO configuration, IT helpdesk ticket SLA response times (Urgent: 1 hr, Normal: 24 hrs).',
    content: `IT HELPDESK & REMOTE VPN SETUP GUIDE (DEMO KNOWLEDGE BASE)
Page 1: Remote VPN Configuration
1. Download the EnterpriseIQ WireGuard package from https://it.enterpriseiq.internal/vpn.
2. Import the configuration file provided in your secure onboarding email.
3. Authenticate with your Okta SSO credentials when prompted.
4. Verify connection status indicator turns green (IP range: 10.200.x.x).

Page 2: IT Support Ticket SLAs
To open a support request, submit a ticket at https://helpdesk.enterpriseiq.com.
SLA Priority Tiers:
- P1 (Critical Outage): 15-minute response time, 24/7 coverage.
- P2 (High Priority / Work Blocking): 1-hour response time.
- P3 (Normal Request / Laptop Swap): 24-hour response time.
- P4 (General Inquiry): 48-hour response time.`,
  },
  {
    id: 'doc-leg-iso',
    title: 'Information Security & ISO 27001 Compliance Manual',
    description: 'Detailed compliance controls for ISO 27001 certification, data categorization, and audit requirements.',
    filename: 'Information Security & ISO 27001 Standard.pdf',
    fileType: 'PDF',
    fileSize: '4.5 MB',
    departmentId: 'dep-leg',
    departmentName: 'Legal',
    uploadedBy: 'Sarah Connor (Admin)',
    uploadedById: 'usr-admin-1',
    uploadedAt: '2026-02-08T11:00:00Z',
    status: 'Indexed',
    accessLevel: 'Restricted',
    tags: ['Legal', 'ISO27001', 'Compliance', 'Audit', 'Security'],
    summary: 'Restricted compliance documentation detailing data classification levels (Public, Internal, Confidential, Restricted) and ISO 27001 ISMS operational standards.',
    content: `INFORMATION SECURITY & ISO 27001 COMPLIANCE MANUAL (DEMO KNOWLEDGE BASE)
Page 1: ISO 27001 ISMS Scope
EnterpriseIQ operates an Information Security Management System (ISMS) certified under ISO/IEC 27001:2022. This manual outlines operational controls, risk assessments, and annual audit procedures.

Page 2: Data Classification Policy
Data must be tagged into one of four tiers:
1. Public: Market materials, external documentation.
2. Internal: Standard company policies, internal memos.
3. Confidential: Departmental operational plans, internal customer analytics.
4. Restricted: Financial records, PII, encryption keys, admin access logs. Access restricted to authorized roles with NDA on file.`,
  },
  {
    id: 'doc-hr-remote',
    title: 'Remote Work & Flexible Hours Policy',
    description: 'Rules governing remote working arrangements, core synchronous working hours, and home office ergonomics allowance.',
    filename: 'Remote Work & Flexible Hours Policy.pdf',
    fileType: 'PDF',
    fileSize: '1.5 MB',
    departmentId: 'dep-hr',
    departmentName: 'Human Resources',
    uploadedBy: 'Sarah Connor (Admin)',
    uploadedById: 'usr-admin-1',
    uploadedAt: '2026-02-10T09:45:00Z',
    status: 'Indexed',
    accessLevel: 'Public',
    tags: ['HR', 'Remote Work', 'Flexible Hours', 'Home Office', 'Policy'],
    summary: 'Remote work policy establishing core collaboration hours (10:00 AM - 4:00 PM local time), $500 home office equipment stipend, and international remote work cap (30 days/year).',
    content: `REMOTE WORK & FLEXIBLE HOURS POLICY (DEMO KNOWLEDGE BASE)
Page 1: Remote Work Options & Eligibility
EnterpriseIQ supports hybrid and fully remote work models. All full-time employees are eligible to work remotely upon agreement with their line manager.

Page 2: Core Hours & Availability
To maintain cross-team collaboration, all employees must be available for meetings and communication during core operational hours: 10:00 AM to 4:00 PM in their local primary time zone. Outside core hours, working time can be adjusted flexibly.

Page 3: Home Office Stipend & Ergonomics
Employees receive a one-time $500 USD home office setup allowance upon hire for ergonomic chairs, monitors, or desks. An additional $50 USD monthly internet stipend is included in monthly payroll. International remote work is limited to 30 calendar days per calendar year due to tax compliance limits.`,
  },
];

// Helper chunker to turn full text into vector chunk records
const chunks: DBChunk[] = [];

const tokenize = (text: string): string[] => {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length > 2);
};

const processDocIntoChunks = (doc: DBDocument) => {
  // Split doc content by pages or paragraphs
  const rawPages = doc.content.split(/Page\s+(\d+):/i);
  let chunkIndex = 0;

  if (rawPages.length > 1) {
    for (let i = 1; i < rawPages.length; i += 2) {
      const pageNum = parseInt(rawPages[i], 10) || 1;
      const pageText = rawPages[i + 1]?.trim() || '';
      if (pageText) {
        chunks.push({
          id: `chk-${doc.id}-${chunkIndex++}`,
          documentId: doc.id,
          documentTitle: doc.title,
          departmentId: doc.departmentId,
          departmentName: doc.departmentName,
          accessLevel: doc.accessLevel,
          content: pageText,
          chunkIndex,
          pageNumber: pageNum,
          vectorTokens: tokenize(pageText + ' ' + doc.tags.join(' ') + ' ' + doc.title),
        });
      }
    }
  } else {
    // split by paragraphs
    const paragraphs = doc.content.split('\n\n').filter(p => p.trim());
    paragraphs.forEach((para, idx) => {
      chunks.push({
        id: `chk-${doc.id}-${idx}`,
        documentId: doc.id,
        documentTitle: doc.title,
        departmentId: doc.departmentId,
        departmentName: doc.departmentName,
        accessLevel: doc.accessLevel,
        content: para.trim(),
        chunkIndex: idx + 1,
        pageNumber: idx + 1,
        vectorTokens: tokenize(para + ' ' + doc.tags.join(' ') + ' ' + doc.title),
      });
    });
  }
};

// Initial chunking of demo documents
documents.forEach(processDocIntoChunks);

const conversations: DBConversation[] = [
  {
    id: 'conv-demo-1',
    userId: 'usr-emp-1',
    title: 'Leave Policy & Paid Time Off',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'conv-demo-2',
    userId: 'usr-mgr-1',
    title: 'Code Review & Sprint Rules',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

const chatMessages: DBChatMessage[] = [
  {
    id: 'msg-1',
    conversationId: 'conv-demo-1',
    sender: 'user',
    content: 'What is the company leave policy for annual leave and sick days?',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'msg-2',
    conversationId: 'conv-demo-1',
    sender: 'assistant',
    content: 'According to the **Employee Leave Policy & Benefits 2026**, full-time employees receive:\n\n1. **18 days of paid annual leave (PTO)** per calendar year. Up to 5 unused days can be carried over into Q1 of the following year (expiring March 31st).\n2. **12 fully paid sick leave days** annually. For sick leave extending beyond 3 consecutive days, a medical certificate is required.\n3. **16 weeks of 100% paid maternity/primary caregiver leave** and **4 weeks paid secondary caregiver leave**.',
    timestamp: new Date(Date.now() - 86390000).toISOString(),
    confidence: 'High',
    sourceRelevance: 96,
    suggestedQuestions: [
      'How far in advance do I need to request annual leave?',
      'Can I carry over unused leave days to next year?',
      'What is the parental leave approval process?'
    ],
    sources: [
      {
        id: 'src-1',
        documentId: 'doc-hr-leave',
        documentTitle: 'Employee Leave Policy & Benefits 2026',
        departmentName: 'Human Resources',
        pageNumber: 2,
        relevanceScore: 0.96,
        snippet: 'Full-time employees accrue 18 days of paid annual leave per calendar year. Up to 5 unused leave days can be carried over into Q1 of the following calendar year...',
        accessLevel: 'Public',
      },
      {
        id: 'src-2',
        documentId: 'doc-hr-leave',
        documentTitle: 'Employee Leave Policy & Benefits 2026',
        departmentName: 'Human Resources',
        pageNumber: 3,
        relevanceScore: 0.94,
        snippet: 'Employees receive 12 fully paid sick leave days annually. For sick leave extending beyond 3 consecutive days, a medical certificate signed by a licensed physician must be uploaded...',
        accessLevel: 'Public',
      },
    ],
  },
];

const auditLogs: DBAuditLog[] = [
  {
    id: 'log-101',
    userId: 'usr-admin-1',
    userName: 'Sarah Connor (Admin)',
    userRole: 'ADMIN',
    action: 'LOGIN',
    resource: 'System Auth',
    ipAddress: '10.0.4.12',
    timestamp: new Date(Date.now() - 1000000).toISOString(),
    details: 'Successful JWT login',
  },
  {
    id: 'log-102',
    userId: 'usr-admin-1',
    userName: 'Sarah Connor (Admin)',
    userRole: 'ADMIN',
    action: 'DOCUMENT_UPLOAD',
    resource: 'Remote Work & Flexible Hours Policy.pdf',
    ipAddress: '10.0.4.12',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    details: 'Uploaded document to Human Resources department (Access: Public)',
  },
  {
    id: 'log-103',
    userId: 'usr-emp-1',
    userName: 'Alex Rivera (Employee)',
    userRole: 'EMPLOYEE',
    action: 'AI_QUERY',
    resource: 'EnterpriseIQ Knowledge Assistant',
    ipAddress: '10.0.8.44',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    details: 'Query: "What is the company leave policy for annual leave and sick days?"',
  },
  {
    id: 'log-104',
    userId: 'usr-mgr-1',
    userName: 'David Miller (Manager)',
    userRole: 'MANAGER',
    action: 'SEARCH',
    resource: 'Global Semantic Search',
    ipAddress: '10.0.3.89',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    details: 'Search term: "Code review PR approvals"',
  },
];

// Single-process durable store. Fail startup on corrupt data rather than overwrite it.
const dataFile = path.resolve(process.env.DATA_FILE || 'data/enterpriseiq.json');
if (fs.existsSync(dataFile)) {
  const saved = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  for (const key of ['users', 'documents', 'departments', 'conversations', 'chatMessages', 'auditLogs']) {
    if (!Array.isArray(saved[key])) throw new Error('Invalid data store: ' + key);
  }
  users.splice(0, users.length, ...saved.users);
  documents.splice(0, documents.length, ...saved.documents);
  departments.splice(0, departments.length, ...saved.departments);
  conversations.splice(0, conversations.length, ...saved.conversations);
  chatMessages.splice(0, chatMessages.length, ...saved.chatMessages);
  auditLogs.splice(0, auditLogs.length, ...saved.auditLogs);
  chunks.splice(0);
  documents.forEach(processDocIntoChunks);
}
function persistData() {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile + '.tmp', JSON.stringify({ users, documents, departments, conversations, chatMessages, auditLogs }));
  fs.renameSync(dataFile + '.tmp', dataFile);
}

// Log helper
const logAudit = (userId: string, userName: string, userRole: string, action: string, resource: string, details?: string) => {
  auditLogs.unshift({
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    userName,
    userRole,
    action,
    resource,
    ipAddress: '10.0.2.15',
    timestamp: new Date().toISOString(),
    details,
  });
};

// --- AUTH MIDDLEWARE & PERMISSION CHECKERS ---
interface AuthenticatedRequest extends express.Request {
  user?: DBUser;
}

const authenticateToken = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    const user = users.find(u => u.id === decoded.id && u.status === 'ACTIVE');
    if (!user) {
      return res.status(403).json({ error: 'User account disabled or not found' });
    }
    req.user = user;
    next();
  });
};

// CRITICAL REQUIREMENT: PERMISSION FILTERING BEFORE RETRIEVAL
const checkChunkPermission = (user: DBUser, chunk: DBChunk): boolean => {
  if (user.role === 'ADMIN') return true;

  if (chunk.accessLevel === 'Public') return true;

  if (user.role === 'MANAGER') {
    if (chunk.accessLevel === 'Managers only') return true;
    if (chunk.accessLevel === 'Department only' && chunk.departmentId === user.departmentId) return true;
    return false;
  }

  if (user.role === 'EMPLOYEE') {
    if (chunk.accessLevel === 'Department only' && chunk.departmentId === user.departmentId) return true;
    return false;
  }

  return false;
};

// --- SEMANTIC VECTOR SIMILARITY ENGINE ---
const calculateSimilarityScore = (query: string, chunk: DBChunk): number => {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return 0;

  let matchCount = 0;
  const chunkTextLower = chunk.content.toLowerCase();
  
  qTokens.forEach(token => {
    if (chunk.vectorTokens.includes(token) || chunkTextLower.includes(token)) {
      matchCount += 1;
    }
  });

  // Base TF-IDF approximation score
  let score = matchCount / Math.sqrt(qTokens.length * Math.max(chunk.vectorTokens.length, 10));

  // Boost if exact multi-word phrases match
  if (chunkTextLower.includes(query.toLowerCase().trim())) {
    score += 0.35;
  }

  return Math.min(score * 2.5, 0.99);
};

// --- SETUP EXPRESS APP ---
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    if (res.statusCode < 400) persistData();
    return originalJson(body);
  }) as typeof res.json;
  next();
});
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Set up Multer for memory upload handling
const storage = multer.memoryStorage();
const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit

// --- API ROUTES ---

// Auth Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (user.status !== 'ACTIVE') {
    return res.status(403).json({ error: 'This user account has been disabled by an administrator.' });
  }

  if (!bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  user.lastActive = new Date().toISOString();
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

  logAudit(user.id, user.name, user.role, 'LOGIN', 'System Auth', 'User logged in successfully');

  const { passwordHash, ...userClean } = user;
  res.json({ token, user: userClean });
});

// Auth Register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, departmentId } = req.body;

  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.length < 8 || !departments.some(d => d.id === departmentId)) {
    return res.status(400).json({ error: 'Valid name, email, department and a password of at least 8 characters are required' });
  }

  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account with this email address already exists' });
  }

  const dep = departments.find(d => d.id === departmentId) || departments[0];
  const newUser: DBUser = {
    id: `usr-${Date.now()}`,
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'EMPLOYEE', // Standard register is strictly EMPLOYEE
    departmentId: dep.id,
    departmentName: dep.name,
    status: 'ACTIVE',
    lastActive: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });

  logAudit(newUser.id, newUser.name, newUser.role, 'REGISTER', 'System Auth', `Registered new employee account in ${dep.name}`);

  const { passwordHash, ...userClean } = newUser;
  res.json({ token, user: userClean });
});

// Auth Me
app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { passwordHash, ...userClean } = req.user;
  res.json(userClean);
});

// User Management (Admin only)
app.get('/api/users', authenticateToken, (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Administrator permissions required' });
  const cleanUsers = users.map(({ passwordHash, ...u }) => u);
  res.json(cleanUsers);
});

app.put('/api/users/:id', authenticateToken, (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Administrator permissions required' });
  }

  const targetUser = users.find(u => u.id === req.params.id);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { role, departmentId, status } = req.body;
  if ((role && !['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role)) || (status && !['ACTIVE', 'DISABLED'].includes(status)) || (departmentId && !departments.some(d => d.id === departmentId))) return res.status(400).json({ error: 'Invalid user update' });
  if (targetUser.role === 'ADMIN' && targetUser.status === 'ACTIVE' && ((role && role !== 'ADMIN') || status === 'DISABLED') && users.filter(u => u.role === 'ADMIN' && u.status === 'ACTIVE').length === 1) return res.status(409).json({ error: 'Keep at least one active administrator' });
  if (role && ['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role)) {
    targetUser.role = role;
  }
  if (departmentId) {
    const dep = departments.find(d => d.id === departmentId);
    if (dep) {
      targetUser.departmentId = dep.id;
      targetUser.departmentName = dep.name;
    }
  }
  if (status && ['ACTIVE', 'DISABLED'].includes(status)) {
    targetUser.status = status;
  }

  logAudit(req.user.id, req.user.name, req.user.role, 'USER_UPDATE', targetUser.email, `Updated role: ${targetUser.role}, Dept: ${targetUser.departmentName}, Status: ${targetUser.status}`);

  const { passwordHash, ...userClean } = targetUser;
  res.json(userClean);
});

const canReadDocument = (user: DBUser, doc: DBDocument) => checkChunkPermission(user, doc as unknown as DBChunk);

app.put('/api/auth/profile', authenticateToken, (req: AuthenticatedRequest, res) => {
  const { name, preferences } = req.body;
  if (typeof name !== 'string' || !name.trim() || name.length > 120 ||
      !preferences || typeof preferences.citations !== 'boolean' || typeof preferences.suggestions !== 'boolean') {
    return res.status(400).json({ error: 'A name and valid preferences are required' });
  }
  req.user!.name = name.trim();
  req.user!.preferences = { citations: preferences.citations, suggestions: preferences.suggestions };
  const { passwordHash, ...user } = req.user!;
  res.json(user);
});
app.put('/api/auth/password', authenticateToken, (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 72) return res.status(400).json({ error: 'Use a new password between 8 and 72 characters' });
  if (!bcrypt.compareSync(currentPassword, req.user!.passwordHash)) return res.status(400).json({ error: 'Current password is incorrect' });
  req.user!.passwordHash = bcrypt.hashSync(newPassword, 10);
  logAudit(req.user!.id, req.user!.name, req.user!.role, 'PASSWORD_CHANGE', 'Account');
  res.json({ message: 'Password updated' });
});
app.get('/api/bookmarks', authenticateToken, (req: AuthenticatedRequest, res) => {
  res.json(documents.filter(d => req.user!.bookmarks?.includes(d.id) && canReadDocument(req.user!, d)));
});
app.put('/api/bookmarks/:id', authenticateToken, (req: AuthenticatedRequest, res) => {
  const doc = documents.find(d => d.id === req.params.id);
  if (!doc || !canReadDocument(req.user!, doc)) return res.status(404).json({ error: 'Document unavailable' });
  if (typeof req.body.saved !== 'boolean') return res.status(400).json({ error: 'saved must be a boolean' });
  const ids = new Set(req.user!.bookmarks || []);
  if (req.body.saved) ids.add(doc.id); else ids.delete(doc.id);
  req.user!.bookmarks = [...ids];
  res.json({ saved: req.body.saved });
});

// Departments
app.get('/api/departments', (req, res) => {
  const list = departments.map(d => {
    const docCount = documents.filter(doc => doc.departmentId === d.id).length;
    return { ...d, docCount };
  });
  res.json(list);
});

// Document Upload & Management
app.get('/api/documents', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  
  // Filter documents accessible to the user
  const accessibleDocs = documents.filter(doc => {
    if (user.role === 'ADMIN') return true;
    if (doc.accessLevel === 'Public') return true;
    if (user.role === 'MANAGER') {
      if (doc.accessLevel === 'Managers only') return true;
      if (doc.accessLevel === 'Department only' && doc.departmentId === user.departmentId) return true;
      return false;
    }
    if (user.role === 'EMPLOYEE') {
      if (doc.accessLevel === 'Department only' && doc.departmentId === user.departmentId) return true;
      return false;
    }
    return false;
  }).map(doc => {
    const chunkCount = chunks.filter(c => c.documentId === doc.id).length;
    return { ...doc, chunkCount };
  });

  res.json(accessibleDocs);
});

app.post('/api/documents/upload', authenticateToken, upload.single('file'), (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  
  // Permission check: Admins and Managers can upload; Employees can upload to their department if approved
  if (user.role === 'EMPLOYEE' && req.body.accessLevel === 'Restricted') {
    return res.status(403).json({ error: 'Employees cannot upload restricted level documents' });
  }

  const { title, description, departmentId, accessLevel, tags, textContent } = req.body;
  const file = req.file;

  if (!title || !departmentId) {
    return res.status(400).json({ error: 'Title and department are required' });
  }

  const dep = departments.find(d => d.id === departmentId);
  if (!dep || typeof title !== 'string' || title.length > 200) return res.status(400).json({ error: 'Valid title and department required' });
  if (user.role !== 'ADMIN' && departmentId !== user.departmentId) return res.status(403).json({ error: 'Upload to your assigned department' });
  if (accessLevel && !['Public', 'Department only', 'Managers only', 'Restricted'].includes(accessLevel)) return res.status(400).json({ error: 'Invalid access level' });
  if (user.role === 'EMPLOYEE' && accessLevel === 'Managers only') return res.status(403).json({ error: 'Manager permissions required' });
  const fileExt = file ? file.originalname.split('.').pop()?.toUpperCase() : 'TXT';
  let inferredFileType: any = 'TXT';
  if (['PDF', 'DOCX', 'TXT', 'CSV', 'MD'].includes(fileExt || '')) {
    inferredFileType = fileExt === 'MD' ? 'Markdown' : fileExt;
  }

  if (file && !['PDF', 'DOCX', 'TXT', 'CSV', 'MD'].includes(fileExt || '')) return res.status(400).json({ error: 'Unsupported file type' });
  if (file && ['PDF', 'DOCX'].includes(fileExt || '') && (typeof textContent !== 'string' || !textContent.trim())) return res.status(400).json({ error: 'PDF and DOCX require extracted plain text in the text content field' });
  let finalContent = typeof textContent === 'string' ? textContent : '';
  if (file && !['PDF', 'DOCX'].includes(fileExt || '')) {
    finalContent = file.buffer.toString('utf-8');
  }
  if (!finalContent.trim() || finalContent.includes('\u0000')) return res.status(400).json({ error: 'Readable document text is required' });

  const parsedTags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : (Array.isArray(tags) ? tags : [dep.name]);

  const newDoc: DBDocument = {
    id: `doc-${Date.now()}`,
    title,
    description: description || `Uploaded by ${user.name}`,
    filename: file ? file.originalname : `${title.replace(/\s+/g, '_')}.txt`,
    fileType: inferredFileType,
    fileSize: file ? `${(file.size / 1024).toFixed(1)} KB` : '120 KB',
    departmentId: dep.id,
    departmentName: dep.name,
    uploadedBy: user.name,
    uploadedById: user.id,
    uploadedAt: new Date().toISOString(),
    status: 'Indexed',
    accessLevel: accessLevel || 'Public',
    tags: parsedTags,
    summary: `Summary for ${title}: Document contains organizational guidelines for ${dep.name}.`,
    content: finalContent,
  };

  documents.unshift(newDoc);
  processDocIntoChunks(newDoc);

  logAudit(user.id, user.name, user.role, 'DOCUMENT_UPLOAD', newDoc.title, `Uploaded ${newDoc.fileType} to ${dep.name} (Access: ${newDoc.accessLevel})`);

  res.status(201).json(newDoc);
});

app.get('/api/documents/:id', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const doc = documents.find(d => d.id === req.params.id);

  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Permission check
  const dummyChunk: DBChunk = {
    id: '', documentId: doc.id, documentTitle: doc.title, departmentId: doc.departmentId, departmentName: doc.departmentName, accessLevel: doc.accessLevel, content: doc.content, chunkIndex: 1, pageNumber: 1, vectorTokens: []
  };

  if (!checkChunkPermission(user, dummyChunk)) {
    return res.status(403).json({ error: 'You do not have authorization to view this document.' });
  }

  const docChunks = chunks.filter(c => c.documentId === doc.id);
  res.json({ ...doc, chunks: docChunks, isBookmarked: user.bookmarks?.includes(doc.id) || false });
});

app.delete('/api/documents/:id', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only administrators can delete enterprise documents' });
  }

  const docIndex = documents.findIndex(d => d.id === req.params.id);
  if (docIndex === -1) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const deletedDoc = documents[docIndex];
  documents.splice(docIndex, 1);

  // Remove associated chunks
  const chunkIndicesToRemove = chunks.map((c, i) => c.documentId === deletedDoc.id ? i : -1).filter(i => i !== -1);
  for (let i = chunkIndicesToRemove.length - 1; i >= 0; i--) {
    chunks.splice(chunkIndicesToRemove[i], 1);
  }

  logAudit(user.id, user.name, user.role, 'DOCUMENT_DELETE', deletedDoc.title, `Deleted document ID ${deletedDoc.id}`);

  res.json({ message: 'Document and associated vector chunks deleted successfully' });
});

app.post('/api/documents/:id/reindex', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  if (user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only administrators can re-index documents' });
  }

  const doc = documents.find(d => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  doc.status = 'Processing';
  
  // Re-chunking logic
  const chunkIndicesToRemove = chunks.map((c, i) => c.documentId === doc.id ? i : -1).filter(i => i !== -1);
  for (let i = chunkIndicesToRemove.length - 1; i >= 0; i--) {
    chunks.splice(chunkIndicesToRemove[i], 1);
  }

  processDocIntoChunks(doc);
  doc.status = 'Indexed';

  logAudit(user.id, user.name, user.role, 'DOCUMENT_REINDEX', doc.title, 'Re-generated document vector embeddings & chunks');

  res.json({ message: 'Document re-indexed successfully', doc });
});

// Single document AI Summarize
app.post('/api/documents/:id/summary', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const doc = documents.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  if (!canReadDocument(req.user!, doc)) return res.status(403).json({ error: 'Document access denied' });

  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Provide a concise 3-bullet enterprise executive summary of the following document:\n\nTitle: ${doc.title}\nContent:\n${doc.content.substring(0, 3000)}`,
      });
      return res.json({ summary: response.text });
    } catch (e) {
      console.error('Gemini summary error:', e);
    }
  }

  res.json({ summary: doc.summary || `Executive Summary of ${doc.title}:\n- Key guidelines for ${doc.departmentName}.\n- Accessible to authorized personnel under ${doc.accessLevel} access.\n- Includes operational procedures and compliance mandates.` });
});

// GLOBAL SEMANTIC SEARCH
app.post('/api/search', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { query, departmentId, fileType, accessLevel } = req.body;

  if (typeof query !== 'string' || query.length > 4000 || query.trim().length === 0) {
    return res.json({ results: [] });
  }

  // 1. Filter chunks by permission
  let allowedChunks = chunks.filter(c => checkChunkPermission(user, c));

  // 2. Filter by search dropdowns if specified
  if (departmentId) {
    allowedChunks = allowedChunks.filter(c => c.departmentId === departmentId);
  }
  if (accessLevel) {
    allowedChunks = allowedChunks.filter(c => c.accessLevel === accessLevel);
  }

  // 3. Compute vector scores
  const scoredResults = allowedChunks.map(chunk => {
    const parentDoc = documents.find(d => d.id === chunk.documentId);
    if (fileType && parentDoc && parentDoc.fileType !== fileType) {
      return null;
    }

    const score = calculateSimilarityScore(query, chunk);
    return {
      chunkId: chunk.id,
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      departmentName: chunk.departmentName,
      fileType: parentDoc?.fileType || 'PDF',
      uploadedAt: parentDoc?.uploadedAt || new Date().toISOString(),
      uploadedBy: parentDoc?.uploadedBy || 'System',
      relevanceScore: Math.round(score * 100),
      snippet: chunk.content,
      pageNumber: chunk.pageNumber,
      tags: parentDoc?.tags || [],
      accessLevel: chunk.accessLevel,
    };
  }).filter(Boolean).filter(r => r!.relevanceScore > 10);

  scoredResults.sort((a, b) => b!.relevanceScore - a!.relevanceScore);

  logAudit(user.id, user.name, user.role, 'SEARCH', 'Global Search', `Query: "${query}" (${scoredResults.length} matches found)`);

  res.json({ results: scoredResults.slice(0, 15) });
});

// COMPARE DOCUMENTS FEATURE
app.post('/api/chat/compare', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { docId1, docId2 } = req.body;

  const doc1 = documents.find(d => d.id === docId1);
  const doc2 = documents.find(d => d.id === docId2);

  if (!doc1 || !doc2) {
    return res.status(400).json({ error: 'Two valid documents must be selected for comparison' });
  }

  if (!canReadDocument(user, doc1) || !canReadDocument(user, doc2)) return res.status(403).json({ error: 'Document access denied' });

  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const prompt = `Compare these two enterprise documents side-by-side in Markdown format:\n\nDOCUMENT 1: ${doc1.title}\n${doc1.content.substring(0, 2500)}\n\nDOCUMENT 2: ${doc2.title}\n${doc2.content.substring(0, 2500)}\n\nHighlight key similarities, policy differences, department scope, and compliance requirements.`;
      const response = await gemini.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });
      return res.json({ comparison: response.text });
    } catch (e) {
      console.error('Gemini compare error:', e);
    }
  }

  const fallbackComparison = `### Document Comparison Analysis\n\n**Comparing:**\n1. 📄 **${doc1.title}** (${doc1.departmentName})\n2. 📄 **${doc2.title}** (${doc2.departmentName})\n\n---\n\n#### Key Similarities\n- Both documents serve as formal EnterpriseIQ organizational guidelines.\n- Both specify compliance protocols and require manager authorization.\n\n#### Key Differences\n- **Scope:** ${doc1.title} targets ${doc1.departmentName}, while ${doc2.title} is designed for ${doc2.departmentName}.\n- **Access Control:** ${doc1.title} is classified as \`${doc1.accessLevel}\`, whereas ${doc2.title} is \`${doc2.accessLevel}\`.\n\n#### Summary Recommendation\nReview department specific clauses before executing operational procedures.`;

  res.json({ comparison: fallbackComparison });
});

// AI KNOWLEDGE ASSISTANT - GROUNDED RAG PIPELINE
app.post('/api/chat', authenticateToken, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const { question, conversationId, scopedDocumentId } = req.body;

  if (typeof question !== 'string' || question.length > 4000 || !question.trim()) {
    return res.status(400).json({ error: 'Question is required' });
  }

  if (conversationId && !conversations.some(c => c.id === conversationId && c.userId === user.id)) return res.status(404).json({ error: 'Conversation not found' });
  if (scopedDocumentId && !documents.some(d => d.id === scopedDocumentId && canReadDocument(user, d))) return res.status(404).json({ error: 'Document unavailable' });
  // Find or create conversation
  let conv = conversations.find(c => c.id === conversationId && c.userId === user.id);
  if (!conv) {
    conv = {
      id: `conv-${Date.now()}`,
      userId: user.id,
      title: question.substring(0, 35) + (question.length > 35 ? '...' : ''),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    conversations.unshift(conv);
  }

  // User Message
  const userMsg: DBChatMessage = {
    id: `msg-${Date.now()}-usr`,
    conversationId: conv.id,
    sender: 'user',
    content: question,
    timestamp: new Date().toISOString(),
  };
  chatMessages.push(userMsg);

  // --- RAG RETRIEVAL PIPELINE ---
  // 1. Permission filtering FIRST
  let candidateChunks = chunks.filter(c => checkChunkPermission(user, c));

  // If scoped to a single document
  if (scopedDocumentId) {
    candidateChunks = candidateChunks.filter(c => c.documentId === scopedDocumentId);
  }

  // 2. Semantic Similarity Score
  const scoredChunks = candidateChunks.map(chunk => ({
    chunk,
    score: calculateSimilarityScore(question, chunk),
  })).filter(sc => sc.score > 0.08);

  scoredChunks.sort((a, b) => b.score - a.score);

  const topChunks = scoredChunks.slice(0, 4);

  let answerText = '';
  let confidence: 'High' | 'Medium' | 'Low' = 'High';
  let knowledgeGapDetected = false;
  let sourceRelevance = 92;

  if (topChunks.length === 0 || topChunks[0].score < 0.12) {
    // GROUNDED RAG MANDATE: DO NOT FABRICATE INFORMATION
    answerText = "I couldn't find enough information in the available enterprise knowledge base to answer this confidently. Please make sure the relevant document has been uploaded and indexed, or contact your administrator.";
    confidence = 'Low';
    knowledgeGapDetected = true;
    sourceRelevance = 0;
  } else {
    const topScore = topChunks[0].score;
    sourceRelevance = Math.min(Math.round(topScore * 100) + 15, 98);
    if (topScore > 0.4) confidence = 'High';
    else if (topScore > 0.2) confidence = 'Medium';
    else confidence = 'Low';

    // Build RAG Context
    const contextText = topChunks.map((tc, idx) => `[Source ${idx + 1}: ${tc.chunk.documentTitle}, Page ${tc.chunk.pageNumber}]\n${tc.chunk.content}`).join('\n\n');

    // Call Gemini API server-side if available
    const gemini = getGeminiClient();
    if (gemini) {
      try {
        const systemPrompt = `You are EnterpriseIQ Knowledge Assistant, an enterprise AI assistant for organization employees.
Answer the user's question using ONLY the provided enterprise context snippets below.
Rules:
- Be professional, structured, clear, and grounded.
- If the context does not contain enough information to answer the question accurately, respond with: "I couldn't find enough information in the available enterprise knowledge base to answer this confidently."
- Include key facts, numbers, deadlines, or policies present in the context.
- Format with clean Markdown headers and bullet points.`;

        const prompt = `CONTEXT:\n${contextText}\n\nUSER QUESTION:\n${question}`;

        const geminiRes = await gemini.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
          },
        });

        if (geminiRes.text) {
          answerText = geminiRes.text;
        }
      } catch (err) {
        console.error('Gemini RAG Generation Error:', err);
      }
    }

    // Fallback grounded answer if Gemini not present or failed
    if (!answerText) {
      const topChunkDoc = topChunks[0].chunk;
      answerText = `Based on **${topChunkDoc.documentTitle}** (Page ${topChunkDoc.pageNumber}):\n\n${topChunkDoc.content}\n\n*Note: Retrieve details from the linked source citation below for full policy specifications.*`;
    }
  }

  // Format Sources
  const sources = topChunks.map(tc => ({
    id: `src-${tc.chunk.id}`,
    documentId: tc.chunk.documentId,
    documentTitle: tc.chunk.documentTitle,
    departmentName: tc.chunk.departmentName,
    pageNumber: tc.chunk.pageNumber,
    relevanceScore: Math.min(Math.round(tc.score * 100) + 20, 98),
    snippet: tc.chunk.content,
    accessLevel: tc.chunk.accessLevel,
  }));

  // Suggested questions generator
  const suggestedQuestions = knowledgeGapDetected ? [
    'Who is the administrator responsible for uploading missing documents?',
    'Search global knowledge base for related keywords',
    'View all available department documents'
  ] : [
    'Who approves this policy request?',
    'Show me related department guidelines',
    'What are the penalties or exceptions?'
  ];

  // Related documents
  const relatedDocs = Array.from(new Set(topChunks.map(tc => tc.chunk.documentId)))
    .map(id => documents.find(d => d.id === id))
    .filter(Boolean)
    .map(d => ({ id: d!.id, title: d!.title, departmentName: d!.departmentName }));

  const assistantMsg: DBChatMessage = {
    id: `msg-${Date.now()}-ast`,
    conversationId: conv.id,
    sender: 'assistant',
    content: answerText,
    timestamp: new Date().toISOString(),
    confidence,
    sourceRelevance,
    suggestedQuestions,
    knowledgeGapDetected,
    relatedDocuments: relatedDocs,
    sources,
  };

  chatMessages.push(assistantMsg);
  conv.updatedAt = new Date().toISOString();

  logAudit(user.id, user.name, user.role, 'AI_QUERY', 'EnterpriseIQ Knowledge Assistant', `Question: "${question.substring(0, 40)}..." (Confidence: ${confidence})`);

  res.json({
    conversationId: conv.id,
    userMessage: userMsg,
    assistantMessage: assistantMsg,
  });
});

// Chat History API
app.get('/api/chat/history', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const userConvs = conversations.filter(c => c.userId === user.id).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json(userConvs.map(c => ({ ...c, messageCount: chatMessages.filter(m => m.conversationId === c.id).length })));
});

app.get('/api/chat/:id', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const conv = conversations.find(c => c.id === req.params.id && c.userId === user.id);
  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }

  const msgs = chatMessages.filter(m => m.conversationId === conv.id).map(m => {
    if (m.sources?.some(source => !documents.some(d => d.id === source.documentId && canReadDocument(user, d)))) {
      return { ...m, content: 'This answer references documents that are no longer available to your account.', sources: [], relatedDocuments: [], suggestedQuestions: [] };
    }
    return m;
  });
  res.json({ conversation: conv, messages: msgs });
});

app.delete('/api/chat/:id', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const index = conversations.findIndex(c => c.id === req.params.id && c.userId === user.id);
  if (index !== -1) {
    const convId = conversations[index].id;
    conversations.splice(index, 1);
    // Delete messages
    const msgIndicesToRemove = chatMessages.map((m, i) => m.conversationId === convId ? i : -1).filter(i => i !== -1);
    for (let i = msgIndicesToRemove.length - 1; i >= 0; i--) {
      chatMessages.splice(msgIndicesToRemove[i], 1);
    }
  }
  res.json({ message: 'Conversation deleted' });
});

// SYSTEM ANALYTICS
app.get('/api/analytics', authenticateToken, (req: AuthenticatedRequest, res) => {
  const visibleDocs = documents.filter(d => canReadDocument(req.user!, d));
  const visibleLogs = req.user!.role === 'ADMIN' ? auditLogs : auditLogs.filter(a => a.userId === req.user!.id);
  const today = new Date().toISOString().slice(0, 10);
  const queriesOverTime = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.now() - (6 - index) * 86400000).toISOString().slice(0, 10);
    return { date, queries: visibleLogs.filter(a => a.action === 'AI_QUERY' && a.timestamp.startsWith(date)).length };
  });
  const convIds = new Set(conversations.filter(c => req.user!.role === 'ADMIN' || c.userId === req.user!.id).map(c => c.id));
  const answers = chatMessages.filter(m => m.sender === 'assistant' && convIds.has(m.conversationId));
  const topics = new Map<string, number>();
  visibleLogs.filter(a => a.action === 'SEARCH').forEach(a => {
    const topic = a.details?.match(/Query: "([^"]+)"/)?.[1];
    if (topic) topics.set(topic, (topics.get(topic) || 0) + 1);
  });
  res.json({
    totalDocuments: visibleDocs.length,
    indexedDocuments: visibleDocs.filter(d => d.status === 'Indexed').length,
    totalUsers: req.user!.role === 'ADMIN' ? users.length : 1,
    knowledgeQueries: visibleLogs.filter(a => a.action === 'AI_QUERY').length,
    docsAddedThisMonth: visibleDocs.filter(d => d.uploadedAt.startsWith(today.slice(0, 7))).length,
    avgRetrievalScore: answers.length ? Math.round(answers.reduce((n, m) => n + (m.sourceRelevance || 0), 0) / answers.length) : 0,
    activeUsersToday: users.filter(u => (req.user!.role === 'ADMIN' || u.id === req.user!.id) && u.status === 'ACTIVE' && u.lastActive.startsWith(today)).length,
    queriesOverTime,
    documentsByDepartment: departments.map(d => ({ department: d.name, count: visibleDocs.filter(doc => doc.departmentId === d.id).length })),
    documentsByType: ['PDF', 'DOCX', 'TXT', 'CSV', 'Markdown'].map(type => ({ type, count: visibleDocs.filter(d => d.fileType === type).length })),
    popularSearchTopics: [...topics].map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count).slice(0, 10),
    recentActivity: visibleLogs.slice(0, 10),
  });
});

// SYSTEM AUDIT LOGS
app.get('/api/audit-logs', authenticateToken, (req: AuthenticatedRequest, res) => {
  res.json(req.user!.role === 'ADMIN' ? auditLogs : auditLogs.filter(a => a.userId === req.user!.id));
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found' }));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err instanceof multer.MulterError ? 400 : 500).json({ error: err instanceof multer.MulterError ? err.message : 'Unable to complete request' });
});

// --- VITE MIDDLEWARE & STATIC SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use('/EnterpriseIQ', express.static(distPath));
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EnterpriseIQ Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
