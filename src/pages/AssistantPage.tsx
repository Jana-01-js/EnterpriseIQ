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
  Volume2,
  VolumeX,
  Copy,
  Check,
} from 'lucide-react';

export const AssistantPage: React.FC = () => {
  const { user, openDocumentViewer } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const scopedDocIdParam = searchParams.get('docId');
  const scopedTitleParam = searchParams.get('title');
  const initialQueryParam = searchParams.get('q');

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

  // Audio / Speech & Copy feedback states
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

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

  // If navigated from Dashboard with ?q=...
  useEffect(() => {
    if (initialQueryParam) {
      handleSendQuestion(initialQueryParam);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('q');
      setSearchParams(newParams, { replace: true });
    }
  }, [initialQueryParam]);

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

  // Clean up speech synthesis if component unmounts
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleToggleSpeech = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMsgId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(id);
    window.speechSynthesis.speak(utterance);
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
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-7.5rem)]">
      
      {/* Sidebar - Conversations History */}
      <div className="w-full md:w-80 bg-white/90 backdrop-blur-sm rounded-3xl border border-slate-200/80 shadow-xs flex flex-col shrink-0 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-400 border border-blue-500/30">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-xs tracking-tight">Chat History</span>
              <p className="text-[10px] text-slate-400">Enterprise RAG threads</p>
            </div>
          </div>
          <button
            onClick={handleStartNewChat}
            className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-xs flex items-center gap-1 text-[11px] font-bold px-2.5"
            title="Start new conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Filter Search */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={convSearchQuery}
              onChange={e => setConvSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* List of Previous Sessions */}
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
                className={`p-3 rounded-2xl text-xs cursor-pointer transition-all flex items-center justify-between group ${
                  activeConvId === conv.id
                    ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200 shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50 border border-transparent'
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
          <div className="p-3 bg-blue-50/80 border-t border-blue-200/80 text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="truncate font-semibold text-[11px]">Scoped: {scopedDocTitle}</span>
            </div>
            <button
              onClick={() => { setScopedDocId(null); setScopedDocTitle(null); }}
              className="p-1 text-blue-500 hover:text-blue-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-3xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
        
        {/* Chat Header */}
        <div className="p-4 bg-slate-950 text-white border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-md shadow-blue-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm text-white tracking-tight">EnterpriseIQ Knowledge Assistant</h2>
                <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
                  Gemini 3.8 Flash RAG
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Natural language search with grounded source citations</p>
            </div>
          </div>

          {/* Scope Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline font-medium">Retrieval Scope:</span>
            <select
              value={scopedDocId || ''}
              onChange={e => {
                const val = e.target.value;
                setScopedDocId(val || null);
                const d = documents.find(doc => doc.id === val);
                setScopedDocTitle(d?.title || null);
              }}
              className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
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
            <div className="max-w-3xl mx-auto py-10 text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-0.5 mx-auto shadow-xl shadow-blue-500/20">
                <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center text-blue-600">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Ask Your Enterprise Knowledge Base</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto leading-relaxed">
                  Queries are converted to high-dimensional embeddings, semantically searched across indexed corporate policies, and answered with strict citations.
                </p>
              </div>

              {/* Sample Question Chips */}
              <div className="space-y-3 text-left pt-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Suggested Inquiries</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSendQuestion('What is the company leave policy for annual leave and sick days?')}
                    className="p-3.5 bg-white hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 rounded-2xl text-left text-xs text-slate-800 font-medium transition-all shadow-2xs hover:shadow-xs group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">🏖️</span>
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Annual Leave & PTO</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">"What is the company leave policy for annual leave and sick days?"</p>
                  </button>

                  <button
                    onClick={() => handleSendQuestion('What are the password and 2FA cybersecurity requirements?')}
                    className="p-3.5 bg-white hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 rounded-2xl text-left text-xs text-slate-800 font-medium transition-all shadow-2xs hover:shadow-xs group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">🛡️</span>
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Security & 2FA</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">"What are the password and 2FA cybersecurity requirements?"</p>
                  </button>

                  <button
                    onClick={() => handleSendQuestion('Explain the employee onboarding schedule for week 1.')}
                    className="p-3.5 bg-white hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 rounded-2xl text-left text-xs text-slate-800 font-medium transition-all shadow-2xs hover:shadow-xs group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">🚀</span>
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Employee Onboarding</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">"Explain the employee onboarding schedule for week 1."</p>
                  </button>

                  <button
                    onClick={() => handleSendQuestion('What are the PR review approval requirements in engineering?')}
                    className="p-3.5 bg-white hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 rounded-2xl text-left text-xs text-slate-800 font-medium transition-all shadow-2xs hover:shadow-xs group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">💻</span>
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Engineering Standards</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">"What are the PR review approval requirements in engineering?"</p>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-3xl space-y-3.5 ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4.5 rounded-2xl rounded-tr-xs shadow-md shadow-blue-500/15 text-xs font-medium'
                    : 'bg-white/95 border border-slate-200/90 p-5 rounded-3xl rounded-tl-xs shadow-xs text-xs text-slate-800'
                }`}>
                  
                  {/* Assistant Header & Actions Toolbar */}
                  {msg.sender === 'assistant' && (
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {getConfidenceBadge(msg.confidence)}
                        {msg.sourceRelevance && (
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            Relevance: {msg.sourceRelevance}%
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Audio Read-Aloud Button */}
                        <button
                          onClick={() => handleToggleSpeech(msg.id, msg.content)}
                          className={`p-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1 ${
                            speakingMsgId === msg.id
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                          title={speakingMsgId === msg.id ? 'Stop reading' : 'Read answer aloud'}
                        >
                          {speakingMsgId === msg.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          <span className="text-[10px] hidden sm:inline">{speakingMsgId === msg.id ? 'Stop' : 'Listen'}</span>
                        </button>

                        {/* Copy Button */}
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                          title="Copy response"
                        >
                          {copiedMsgId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-[10px] text-emerald-600 font-bold hidden sm:inline">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[10px] hidden sm:inline">Copy</span>
                            </>
                          )}
                        </button>

                        <span className="text-[10px] text-slate-400 font-mono ml-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="whitespace-pre-wrap leading-relaxed font-normal">
                    {msg.content}
                  </div>

                  {/* Knowledge Gap Alert if present */}
                  {msg.knowledgeGapDetected && (
                    <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-amber-900 text-xs space-y-1 mt-3 shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Knowledge Gap Detected
                      </div>
                      <p className="text-[11px] text-amber-800">
                        The requested topic is not sufficiently covered in indexed enterprise documents. Contact a department administrator to upload relevant operational guidelines.
                      </p>
                    </div>
                  )}

                  {/* Source Citations for RAG */}
                  {user?.preferences?.citations !== false && msg.sources && msg.sources.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        Retrieved Grounded Sources ({msg.sources.length})
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {msg.sources.map((src, sIdx) => (
                          <div
                            key={sIdx}
                            onClick={() => openDocumentViewer(src.documentId)}
                            className="p-3 bg-slate-50/80 hover:bg-blue-50/50 border border-slate-200/80 hover:border-blue-400 rounded-2xl cursor-pointer transition-all shadow-2xs group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-blue-700 text-xs truncate group-hover:text-blue-800">
                                📄 {src.documentTitle}
                              </span>
                              <span className="text-[10px] bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md font-semibold shrink-0">
                                Page {src.pageNumber}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                              "{src.snippet}"
                            </p>
                            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                              <span className="font-mono">Relevance: {src.relevanceScore}%</span>
                              <span className="text-blue-600 font-semibold group-hover:underline flex items-center gap-0.5">
                                Preview in Viewer <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Follow-up Questions */}
                  {user?.preferences?.suggestions !== false && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Follow-Up Inquiries</p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedQuestions.map((sq, sqIdx) => (
                          <button
                            key={sqIdx}
                            onClick={() => handleSendQuestion(sq)}
                            className="text-[11px] font-medium bg-blue-50/80 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-xl border border-blue-200 transition-colors text-left"
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
            <div className="flex items-center gap-3 text-slate-500 text-xs py-3 px-4 bg-slate-50 rounded-2xl border border-slate-200/60 w-fit">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">Searching enterprise vectors & synthesizing grounded answer...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200/80">
          <form
            onSubmit={e => { e.preventDefault(); handleSendQuestion(); }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={inputQuestion}
              onChange={e => setInputQuestion(e.target.value)}
              placeholder={scopedDocId ? `Ask a question about "${scopedDocTitle}"...` : "Ask any enterprise knowledge or policy question..."}
              className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/80 shadow-xs"
            />
            <button
              type="submit"
              disabled={loading || !inputQuestion.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-md shadow-blue-500/25 transition-all disabled:opacity-50 flex items-center gap-2 shrink-0"
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
