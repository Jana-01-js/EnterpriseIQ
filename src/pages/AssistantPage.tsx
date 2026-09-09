import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Conversation, ChatMessage, DocumentItem } from '../types';
import {
  Bot,
  Send,
  Plus,
  Trash2,
  Sparkles,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Clock,
  ChevronRight,
  Search,
  MessageSquare,
  HelpCircle,
  X,
  ExternalLink,
} from 'lucide-react';

export const AssistantPage: React.FC = () => {
  const { user, openDocumentViewer } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const scopedDocIdParam = searchParams.get('docId');
  const scopedTitleParam = searchParams.get('title');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [scopedDocId, setScopedDocId] = useState<string | null>(scopedDocIdParam);
  const [scopedDocTitle, setScopedDocTitle] = useState<string | null>(scopedTitleParam);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [convSearchQuery, setConvSearchQuery] = useState('');

  const chatBottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    try {
      const history = await api.getChatHistory();
      setConversations(history);
      if (history.length > 0 && !activeConvId) {
        setActiveConvId(history[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
    api.getDocuments().then(setDocuments).catch(console.error);
  }, []);

  useEffect(() => {
    if (scopedDocIdParam) {
      setScopedDocId(scopedDocIdParam);
      setScopedDocTitle(scopedTitleParam || 'Selected Document');
    }
  }, [scopedDocIdParam, scopedTitleParam]);

  useEffect(() => {
    if (activeConvId) {
      api.getConversationMessages(activeConvId)
        .then(res => setMessages(res.messages))
        .catch(console.error);
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleStartNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.deleteConversation(id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) {
      setActiveConvId(null);
      setMessages([]);
    }
  };

  const handleSendQuestion = async (qText?: string) => {
    const q = (qText || inputQuestion).trim();
    if (!q) return;

    setInputQuestion('');
    setLoading(true);

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId: activeConvId || '',
      sender: 'user',
      content: q,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await api.askAssistant(q, activeConvId || undefined, scopedDocId || undefined);
      if (!activeConvId) {
        setActiveConvId(res.conversationId);
        loadConversations();
      }
      setMessages(prev => [...prev.filter(m => !m.id.startsWith('temp-')), res.userMessage, res.assistantMessage]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredConvs = conversations.filter(c =>
    c.title.toLowerCase().includes(convSearchQuery.toLowerCase())
  );

  const getConfidenceBadge = (conf?: string) => {
    switch (conf) {
      case 'High':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> High Confidence</span>;
      case 'Medium':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold px-2 py-0.5 rounded-full">Medium Confidence</span>;
      default:
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-rose-600" /> Low Confidence</span>;
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-8rem)]">
      
      {/* Sidebar - Conversations History */}
      <div className="w-full md:w-72 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col shrink-0 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-xs">Chat History</span>
          </div>
          <button
            onClick={handleStartNewChat}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Chats */}
        <div className="p-3 border-b border-slate-100 bg-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={convSearchQuery}
              onChange={e => setConvSearchQuery(e.target.value)}
              placeholder="Search previous chats..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {historyLoading ? (
            <div className="p-4 text-center text-xs text-slate-400">Loading history...</div>
          ) : filteredConvs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 space-y-2">
              <Bot className="w-8 h-8 mx-auto text-slate-300" />
              <p>No previous chats found. Ask a question to begin.</p>
            </div>
          ) : (
            filteredConvs.map(conv => (
              <div
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`p-3 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-between group ${
                  activeConvId === conv.id
                    ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${activeConvId === conv.id ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="truncate">{conv.title}</span>
                </div>
                <button
                  onClick={e => handleDeleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bottom Scope Indicator */}
        {scopedDocId && (
          <div className="p-3 bg-indigo-50 border-t border-indigo-100 text-xs text-indigo-900 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="truncate font-semibold text-[11px]">Scoped: {scopedDocTitle}</span>
            </div>
            <button
              onClick={() => { setScopedDocId(null); setScopedDocTitle(null); }}
              className="p-1 text-indigo-400 hover:text-indigo-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
        
        {/* Chat Header */}
        <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 border border-blue-400/30 rounded-xl text-blue-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">EnterpriseIQ Knowledge Assistant</h2>
              <p className="text-[11px] text-slate-400">Retrieval-Augmented Generation Grounded Engine</p>
            </div>
          </div>

          {/* Scope Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Retrieval Scope:</span>
            <select
              value={scopedDocId || ''}
              onChange={e => {
                const val = e.target.value;
                setScopedDocId(val || null);
                const d = documents.find(doc => doc.id === val);
                setScopedDocTitle(d?.title || null);
              }}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Enterprise Knowledge Documents</option>
              {documents.map(d => (
                <option key={d.id} value={d.id}>📄 {d.title} ({d.departmentName})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto shadow-xs">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Ask Your Enterprise Knowledge Base</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Queries are converted to embeddings, semantically searched against indexed documents, filtered by your role permissions, and answered with grounded sources.
                </p>
              </div>

              {/* Sample Question Chips */}
              <div className="space-y-2 text-left pt-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Sample Natural Language Queries</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleSendQuestion('What is the company leave policy for annual leave and sick days?')}
                    className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left text-xs text-slate-800 font-medium transition-colors"
                  >
                    "What is the company leave policy for annual leave and sick days?"
                  </button>

                  <button
                    onClick={() => handleSendQuestion('What are the password and 2FA cybersecurity requirements?')}
                    className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left text-xs text-slate-800 font-medium transition-colors"
                  >
                    "What are the password and 2FA cybersecurity requirements?"
                  </button>

                  <button
                    onClick={() => handleSendQuestion('Explain the employee onboarding schedule for week 1.')}
                    className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left text-xs text-slate-800 font-medium transition-colors"
                  >
                    "Explain the employee onboarding schedule for week 1."
                  </button>

                  <button
                    onClick={() => handleSendQuestion('What are the PR review approval requirements in engineering?')}
                    className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left text-xs text-slate-800 font-medium transition-colors"
                  >
                    "What are the PR review approval requirements in engineering?"
                  </button>
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-3xl space-y-3 ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white p-4 rounded-2xl rounded-tr-xs shadow-xs text-xs font-medium'
                    : 'bg-slate-50 border border-slate-200 p-5 rounded-2xl rounded-tl-xs shadow-xs text-xs text-slate-800'
                }`}>
                  
                  {/* Confidence Header for Assistant */}
                  {msg.sender === 'assistant' && (
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-2">
                      <div className="flex items-center gap-2">
                        {getConfidenceBadge(msg.confidence)}
                        {msg.sourceRelevance && (
                          <span className="text-[11px] font-semibold text-slate-500">
                            Relevance: {msg.sourceRelevance}%
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>

                  {/* Knowledge Gap Alert if present */}
                  {msg.knowledgeGapDetected && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1 mt-3">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Knowledge Gap Detected
                      </div>
                      <p className="text-[11px] text-amber-800">
                        The requested topic is not covered in the currently indexed documents. Contact an administrator to upload relevant guidelines.
                      </p>
                    </div>
                  )}

                  {/* Source Citations for RAG */}
                  {user?.preferences?.citations !== false && msg.sources && msg.sources.length > 0 && (
                    <div className="pt-3 border-t border-slate-200/80 space-y-2">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        Retrieved Enterprise Sources ({msg.sources.length})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.sources.map((src, sIdx) => (
                          <div
                            key={sIdx}
                            onClick={() => openDocumentViewer(src.documentId)}
                            className="p-2.5 bg-white border border-slate-200 hover:border-blue-400 rounded-xl cursor-pointer transition-all shadow-2xs group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-blue-700 text-xs truncate group-hover:text-blue-800">
                                📄 {src.documentTitle}
                              </span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold shrink-0">
                                Page {src.pageNumber}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">
                              "{src.snippet}"
                            </p>
                            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                              <span>Relevance: {src.relevanceScore}%</span>
                              <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-0.5">
                                View Source <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Follow-up Questions */}
                  {user?.preferences?.suggestions !== false && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="pt-3 border-t border-slate-200/80 space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Follow-Up Questions</p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedQuestions.map((sq, sqIdx) => (
                          <button
                            key={sqIdx}
                            onClick={() => handleSendQuestion(sq)}
                            className="text-[11px] font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors text-left"
                          >
                            💡 {sq}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-center gap-3 text-slate-400 text-xs py-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Searching vector database & generating grounded AI response...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <form
            onSubmit={e => { e.preventDefault(); handleSendQuestion(); }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={inputQuestion}
              onChange={e => setInputQuestion(e.target.value)}
              placeholder={scopedDocId ? `Ask a question about "${scopedDocTitle}"...` : "Ask any enterprise policy question..."}
              className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            />
            <button
              type="submit"
              disabled={loading || !inputQuestion.trim()}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2 shrink-0"
            >
              <span>Ask AI</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
