'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

// Attachment type (stores preview dataUrl so drafts can persist)
type Attachment = {
  name: string;
  type?: string;
  size?: number;
  dataUrl?: string;
  file?: File;
};

export default function CitizenProposals() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('citizen-proposals');

  // form state
  const [projectTitle, setProjectTitle] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [proposedSolution, setProposedSolution] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('4,50,000');
  const [estimatedDuration, setEstimatedDuration] = useState('2 weeks');
  const [department, setDepartment] = useState('Public Works');

  // department custom dropdown state & options
  const departments = ['Public Works', 'Transportation', 'Infrastructure', 'Urban Planning'];
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const selectDepartment = (d: string) => { setDepartment(d); setDepartmentOpen(false); };

  // attachments & UI state (store Attachment objects with dataUrl)
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB per file
  const MAX_TOTAL_SIZE = 8 * 1024 * 1024; // 8 MB total for all attachments
  const MAX_COUNT = 8;
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // draft & draft-modal state
  const [hasDraft, setHasDraft] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);
  // list of saved drafts
  const [draftsList, setDraftsList] = useState<any[]>([]);
  // if editing an existing draft, hold its id
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  // (font) Poppins is loaded globally from RootLayout

  // chatbot state
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{text: string, sender: 'user' | 'bot'}>>([
    { text: "Hello! I'm here to help you with your proposal. How can I assist you today?", sender: 'bot' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);  
  // citizen issues data for AI context
  const [citizenIssues, setCitizenIssues] = useState<any[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  // Auto-scroll chat to bottom
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // toast helper
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const raw = localStorage.getItem('proposal_drafts');
    const list = raw ? JSON.parse(raw) : [];
    setDraftsList(list);
    setHasDraft(list.length > 0);
  }, []);

  // Fetch citizen issues for AI context
  useEffect(() => {
    const fetchCitizenIssues = async () => {
      try {
        setLoadingIssues(true);
        const response = await fetch('http://localhost:5000/api/issues');
        
        if (!response.ok) {
          console.warn('Failed to fetch citizen issues:', response.statusText);
          return;
        }
        
        const issues = await response.json();
        // Sort by priority and take top 10
        const top10 = issues
          .sort((a: any, b: any) => b.priority - a.priority)
          .slice(0, 10);
        
        setCitizenIssues(top10);
      } catch (error) {
        console.error('Error fetching citizen issues:', error);
      } finally {
        setLoadingIssues(false);
      }
    };

    fetchCitizenIssues();
  }, []);

  // Check for pre-populated issue data from Draft Proposal navigation
  useEffect(() => {
    const issueData = localStorage.getItem('draft_proposal_issue_data');
    if (issueData) {
      try {
        const parsedData = JSON.parse(issueData);
        
        // Pre-populate only the title with the original issue title
        setProjectTitle(parsedData.title);
        
        // Set department based on category
        const categoryDeptMap: { [key: string]: string } = {
          'Roads': 'Public Works',
          'Transportation': 'Transportation', 
          'Infrastructure': 'Infrastructure',
          'Urban Planning': 'Urban Planning',
          'Water': 'Public Works',
          'Electricity': 'Infrastructure',
          'Waste Management': 'Public Works'
        };
        
        const suggestedDept = categoryDeptMap[parsedData.category] || 'Public Works';
        setDepartment(suggestedDept);
        
        // Clear the stored data after using it
        localStorage.removeItem('draft_proposal_issue_data');
        
        // Show success toast
        setToast(`Proposal created for: "${parsedData.title}"`);
        
      } catch (error) {
        console.error('Error parsing issue data:', error);
        localStorage.removeItem('draft_proposal_issue_data');
      }
    }
  }, []);

  const handleLogout = () => {
    router.push('/login');
  };

  // Analyze user input to determine intent and create appropriate payload
  const analyzeUserInputAndCreatePayload = (userInput: string) => {
    const input = userInput.toLowerCase();
    
    // Check if user is asking for citizen issues data
    const isAskingForIssues = input.includes('issue') || input.includes('problem') || input.includes('top') || input.includes('citizen') || input.includes('community');
    const isAskingForSpecificNumber = input.match(/top\s*(\d+)/i) || input.match(/(\d+)\s*issue/i);
    
    // Check if user is asking for proposal help
    const isAskingForProposal = input.includes('proposal') || input.includes('draft') || input.includes('write') || input.includes('help me') || input.includes('suggest');
    
    // Extract number if specified
    let requestedCount = 10;
    if (isAskingForSpecificNumber) {
      const match = input.match(/(\d+)/);
      if (match) {
        requestedCount = Math.min(parseInt(match[1]), citizenIssues.length);
      }
    }
    
    let contextData = '';
    let instructions = '';
    
    if (isAskingForIssues && citizenIssues.length > 0) {
      const issuesData = citizenIssues.slice(0, requestedCount).map((issue, index) => ({
        rank: index + 1,
        title: issue.title,
        location: issue.location,
        category: issue.category,
        priority: issue.priority,
        status: issue.status,
        reports: issue.upvotes || 0,
        description: issue.description || 'N/A'
      }));

      contextData = `\n\nAVAILABLE CITIZEN ISSUES DATA (Top ${requestedCount}):\n${issuesData.map(issue => 
        `${issue.rank}. ${issue.title}\n   Location: ${issue.location}\n   Category: ${issue.category}\n   Priority: ${issue.priority}\n   Status: ${issue.status}\n   Community Reports: ${issue.reports}\n   Description: ${issue.description}`
      ).join('\n\n')}`;
      
      instructions = 'Use the above citizen issues data to answer the user\'s question. Focus on the specific information they requested.';
    }
    
    if (isAskingForProposal) {
      const currentFormData = `\n\nCURRENT FORM DATA:\n- Project Title: ${projectTitle || 'Not set'}\n- Problem Statement: ${problemStatement || 'Not set'}\n- Proposed Solution: ${proposedSolution || 'Not set'}\n- Estimated Budget: ${estimatedBudget || 'Not set'}\n- Department: ${department || 'Not set'}`;
      
      contextData += currentFormData;
      
      if (citizenIssues.length > 0 && !isAskingForIssues) {
        // Only include top 3 issues as context for proposal help
        const topIssues = citizenIssues.slice(0, 3);
        contextData += `\n\nTOP COMMUNITY ISSUES FOR REFERENCE:\n${topIssues.map((issue, i) => 
          `${i + 1}. ${issue.title} (${issue.location}) - Priority: ${issue.priority}`
        ).join('\n')}`;
      }
      
      instructions = 'Help the user with their budget proposal. Use the form data and community issues as context to provide relevant suggestions.';
    }
    
    return { contextData, instructions, hasRelevantData: contextData.length > 0 };
  };

  const handleAttachClick = () => fileInputRef.current?.click();
  // read file as dataUrl helper
  const fileToDataUrl = (file: File) => new Promise<string>((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const arr = Array.from(files);

    // validate sizes and counts before reading
    const existingTotal = attachments.reduce((s, a) => s + (a.size || 0), 0);
    const existingCount = attachments.length;

    const acceptable: File[] = [];
    for (const f of arr) {
      if (f.size > MAX_FILE_SIZE) {
        setToast(`File ${f.name} is too large (max ${Math.round(MAX_FILE_SIZE/1024/1024)}MB)`);
        continue;
      }
      if (existingCount + acceptable.length >= MAX_COUNT) {
        setToast(`Maximum ${MAX_COUNT} attachments allowed`);
        break;
      }
      const projectedTotal = existingTotal + acceptable.reduce((s, x) => s + x.size, 0) + f.size;
      if (projectedTotal > MAX_TOTAL_SIZE) {
        setToast('Adding these files would exceed total attachments size limit');
        break;
      }
      acceptable.push(f);
    }

    if (acceptable.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const mapped: Attachment[] = await Promise.all(acceptable.map(async (f) => ({
      name: f.name,
      type: f.type,
      size: f.size,
      dataUrl: await fileToDataUrl(f),
      file: f
    })));
    setAttachments(prev => [...prev, ...mapped]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const arr = Array.from(files);

    const existingTotal = attachments.reduce((s, a) => s + (a.size || 0), 0);
    const existingCount = attachments.length;

    const acceptable: File[] = [];
    for (const f of arr) {
      if (f.size > MAX_FILE_SIZE) {
        setToast(`File ${f.name} is too large (max ${Math.round(MAX_FILE_SIZE/1024/1024)}MB)`);
        continue;
      }
      if (existingCount + acceptable.length >= MAX_COUNT) {
        setToast(`Maximum ${MAX_COUNT} attachments allowed`);
        break;
      }
      const projectedTotal = existingTotal + acceptable.reduce((s, x) => s + x.size, 0) + f.size;
      if (projectedTotal > MAX_TOTAL_SIZE) {
        setToast('Adding these files would exceed total attachments size limit');
        break;
      }
      acceptable.push(f);
    }

    if (acceptable.length === 0) return;

    const mapped: Attachment[] = await Promise.all(acceptable.map(async (f) => ({
      name: f.name,
      type: f.type,
      size: f.size,
      dataUrl: await fileToDataUrl(f),
      file: f
    })));
    setAttachments(prev => [...prev, ...mapped]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const removeAttachment = (idx: number) => setAttachments(prev => prev.filter((_, i) => i !== idx));

  // save (create or update) draft into localStorage array 'proposal_drafts'
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const id = editingDraftId || `draft_${Date.now()}`;
      const draftObj = {
        id,
        projectTitle,
        problemStatement,
        proposedSolution,
        estimatedBudget,
        estimatedDuration,
        department,
        updatedAt: new Date().toISOString(),
        attachments: attachments.map(a => ({ name: a.name, type: a.type, size: a.size, dataUrl: a.dataUrl }))
      };

      const raw = localStorage.getItem('proposal_drafts');
      const list = raw ? JSON.parse(raw) : [];
      const existingIndex = list.findIndex((d: any) => d.id === id);
      if (existingIndex >= 0) {
        list[existingIndex] = draftObj;
      } else {
        list.unshift(draftObj);
      }
      localStorage.setItem('proposal_drafts', JSON.stringify(list));
      setDraftsList(list);
      setHasDraft(list.length > 0);
      setEditingDraftId(null);
      setToast(editingDraftId ? 'Draft updated' : 'Draft saved');
    } catch (err) {
      setToast('Unable to save draft');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    // simulate upload/submit
    await new Promise((r) => setTimeout(r, 900));
    // pretend successful
    setSubmitting(false);
    setToast('Proposal submitted for review');
    // clear form
    setProjectTitle(''); setProblemStatement(''); setProposedSolution(''); setAttachments([]);
  };

  const handleBackClick = () => {
    router.push('/dashboard');
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = { text: chatInput, sender: 'user' as const };
    setChatMessages(prev => [...prev, userMessage]);
    
    const currentInput = chatInput;
    setChatInput('');
    
    setChatMessages(prev => [...prev, { text: 'Thinking...', sender: 'bot' as const }]);
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      
      if (!apiKey) {
        throw new Error('API key not configured. Add NEXT_PUBLIC_GOOGLE_API_KEY to .env.local and restart server');
      }

      // Analyze user input and create appropriate payload
      const { contextData, instructions, hasRelevantData } = analyzeUserInputAndCreatePayload(currentInput);
      
      // Create dynamic prompt based on user intent
      let enhancedPrompt = `You are a helpful AI assistant for government budget proposals in Nepal. You help government administrators with citizen budget proposals and community issues analysis.

CAPABILITIES:
- Answer questions about citizen issues and community problems
- Help draft budget proposals
- Provide analysis of community priorities
- Suggest solutions based on real citizen reports
- Assist with form filling and proposal writing

INSTRUCTIONS: ${instructions || 'Provide helpful, practical responses related to budget proposals and community issues.'}${contextData}

USER QUESTION: ${currentInput}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: enhancedPrompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            }
          })
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
        "I received your message but couldn't generate a proper response. Please try rephrasing your question.";
      
      // Convert markdown formatting to HTML for better display
      const formatBotResponse = (text: string) => {
        return text
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold** to <strong>bold</strong>
          .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic* to <em>italic</em>
          .replace(/###\s*(.*)/g, '<h3 style="font-weight: bold; font-size: 1.1em; margin: 10px 0 5px 0;">$1</h3>') // ### heading
          .replace(/##\s*(.*)/g, '<h2 style="font-weight: bold; font-size: 1.2em; margin: 12px 0 6px 0;">$1</h2>') // ## heading
          .replace(/#\s*(.*)/g, '<h1 style="font-weight: bold; font-size: 1.3em; margin: 15px 0 8px 0;">$1</h1>') // # heading
          .replace(/\n\n/g, '<br><br>') // Double line breaks
          .replace(/\n/g, '<br>'); // Single line breaks
      };
      
      const formattedResponse = formatBotResponse(botResponse);
      
      setChatMessages(prev => {
        const updated = prev.slice(0, -1);
        return [...updated, { text: formattedResponse, sender: 'bot' as const }];
      });
      
    } catch (error: any) {
      console.error('Chatbot Error:', error);
      
      let errorMessage = 'Connection error. ';
      
      if (error.message.includes('API key')) {
        errorMessage += 'Please check your API key configuration.';
      } else if (error.message.includes('not found')) {
        errorMessage += 'The AI model is temporarily unavailable.';
      } else if (error.message.includes('quota')) {
        errorMessage += 'API quota exceeded. Please try again later.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      setChatMessages(prev => {
        const updated = prev.slice(0, -1);
        return [...updated, { 
          text: errorMessage, 
          sender: 'bot' as const 
        }];
      });
    }
  };

  const aiSuggestion = "Based on 45 citizen reports, the primary issue is vehicle damage and traffic congestion caused by severe road degradation on Prithivi Highway";

  const problemStatementText = `The current state of Prithive Highway (between Mangaltar and Khurkot) presents a significant safety hazard to motorists and Passengers. Multiple deep potholes have been reported, causing vehicle damage and forcing traffic to slow dangerously.`;

  const proposedSolutionText = `We propose a complete resurfacing of the affected road. This includes:
1. Milling the existing surface
2. Repairing the base layer where necessary
3. Laying new asphalt
4. Restriping all lane markers and crosswalks`;

  const handleOpenDrafts = () => {
    const raw = localStorage.getItem('proposal_drafts');
    const list = raw ? JSON.parse(raw) : [];
    setDraftsList(list);
    setShowDraftModal(true);
  };

  // load a specific draft into the form (used for edit/load)
  const handleLoadDraft = (d: any) => {
    if (!d) { setToast('No draft to load'); return; }
    setProjectTitle(d.projectTitle || '');
    setProblemStatement(d.problemStatement || '');
    setProposedSolution(d.proposedSolution || '');
    setEstimatedBudget(d.estimatedBudget || '');
    setEstimatedDuration(d.estimatedDuration || '');
    setDepartment(d.department || 'Public Works');
    // restore attachments as Attachment objects (dataUrl present)
    setAttachments((d.attachments || []).map((a: any) => ({
      name: a.name, type: a.type, size: a.size, dataUrl: a.dataUrl
    })));
    setToast('Draft loaded');
    setShowDraftModal(false);
    setEditingDraftId(d.id || null);
  };

  const handleDeleteDraft = (id: string) => {
    const raw = localStorage.getItem('proposal_drafts');
    const list = raw ? JSON.parse(raw) : [];
    const next = list.filter((x: any) => x.id !== id);
    localStorage.setItem('proposal_drafts', JSON.stringify(next));
    setDraftsList(next);
    setHasDraft(next.length > 0);
    setToast('Draft deleted');
  };

  const handleClearAllDrafts = () => {
    localStorage.removeItem('proposal_drafts');
    setDraftsList([]);
    setHasDraft(false);
    setShowDraftModal(false);
    setToast('All drafts cleared');
  };

  // image/open helpers
  const openAttachmentInNewTab = async (a: Attachment) => {
    try {
      if (!a) return;
      // if we have original File object use object URL
      if (a.file) {
        const obj = URL.createObjectURL(a.file);
        const win = window.open(obj, '_blank');
        setTimeout(() => URL.revokeObjectURL(obj), 10000);
        if (!win) window.location.href = obj;
        return;
      }
      // otherwise convert dataUrl to blob then open
      if (a.dataUrl) {
        const res = await fetch(a.dataUrl);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        if (!win) window.location.href = url;
        return;
      }
    } catch (err) {
      console.error(err);
      setToast?.('Unable to open attachment');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="ml-64 flex flex-col min-h-screen">
        <div className="sticky top-0 z-20">
          <Topbar activeTab={activeTab} onLogout={handleLogout} />
        </div>
        
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleBackClick}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-[#19295C]">New Budget Proposal</h1>
                    <p className="text-slate-500">Drafting proposal for FY 2025-Q3 Cycle</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Floating Chatbot Button */}
                  <button
                    onClick={() => setShowChatbot(!showChatbot)}
                    className="w-12 h-12 bg-[#2D3F7B] hover:bg-[#19295C] text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                    aria-label="Toggle chatbot"
                  >
                    {showChatbot ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={handleSaveDraft}
                    disabled={savingDraft}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-[#2D3F7B] bg-white hover:shadow-sm transition"
                    title="Save draft locally"
                  >
                    {savingDraft ? 'Saving...' : 'Save Draft'}
                  </button>

                  <button
                    onClick={handleOpenDrafts}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[#2D3F7B] hover:shadow-sm"
                    title="View saved drafts"
                  >
                    View Drafts
                  </button>

                  <button
                    onClick={handleSubmitForReview}
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2D3F7B] text-white rounded-lg hover:bg-[#19295C] transition"
                  >
                    {submitting ? 'Submitting...' : 'Submit for Review'}
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Project Title */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <label className="block text-sm font-semibold text-slate-900 mb-3">Project Title</label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    placeholder="Enter a clear, descriptive title"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2D3F7B] focus:border-[#19295C]"
                  />
                </div>

                {/* Problem Statement */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <label className="block text-sm font-semibold text-slate-900 mb-3">Problem Statement</label>
                  


                  <textarea
                    value={problemStatement}
                    onChange={(e) => setProblemStatement(e.target.value)}
                    placeholder={problemStatementText}
                    rows={6}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2D3F7B] focus:border-[#19295C] resize-none"
                  />
                </div>

                {/* Proposed Solution */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <label className="block text-sm font-semibold text-slate-900 mb-3">Proposed Solution</label>
                  <textarea
                    value={proposedSolution}
                    onChange={(e) => setProposedSolution(e.target.value)}
                    placeholder={proposedSolutionText}
                    rows={8}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2D3F7B] focus:border-[#19295C] resize-none"
                  />
                </div>

                {/* Attachments */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <label className="block text-sm font-semibold text-slate-900 mb-3">Attachments</label>
                  <div
                    className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-200 transition-colors cursor-pointer"
                    onClick={handleAttachClick}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    role="button"
                    aria-label="Add attachments"
                  >
                    <svg className="w-10 h-10 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-slate-600 font-medium">Click to upload files</p>
                    <p className="text-sm text-slate-500">or drag and drop</p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFilesChange}
                      className="hidden"
                    />
                  </div>

                  {attachments.length > 0 && (
                    <div className="mt-4 grid gap-2">
                      {attachments.map((a, i) => (
                        <div key={i} className="flex items-center justify-between bg-white border border-slate-100 rounded-md p-2">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-8 bg-slate-100 rounded-md flex items-center justify-center text-slate-600 text-sm overflow-hidden">
                              {a.type?.startsWith('image') && a.dataUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={a.dataUrl} alt={a.name} className="w-full h-full object-cover cursor-pointer" onClick={(e)=>{ e.stopPropagation(); openAttachmentInNewTab(a); }} />
                              ) : (
                                '📎'
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-[#19295C] truncate">{a.name}</div>
                              <div className="text-xs text-slate-500">{a.size ? `${Math.round(a.size / 1024)} KB` : ''}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); openAttachmentInNewTab(a); }}
                              className="text-sm text-[#2D3F7B] hover:underline"
                            >
                              Open
                            </button>
                            <button onClick={() => removeAttachment(i)} className="text-sm text-slate-500 hover:text-red-500">
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Budget & Timeline + Impact Analysis */}
              <div className="space-y-6">
                {/* Budget & Timeline */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Budget & Timeline</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Estimated Budget</label>
                      <div className="flex items-center gap-3">
                        <span className="text-lg text-slate-700">रु</span>
                        <input
                          value={estimatedBudget}
                          onChange={(e) => setEstimatedBudget(e.target.value)}
                          placeholder="0"
                          className="text-2xl font-bold text-[#19295C] w-40 px-2 py-1 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D3F7B]"
                        />
                      </div>
                    </div>
 
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Estimated Duration</label>
                      <input
                        value={estimatedDuration}
                        onChange={(e) => setEstimatedDuration(e.target.value)}
                        placeholder="e.g. 2 weeks"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2D3F7B] focus:border-[#19295C]"
                      />
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                      <button
                        type="button"
                        onClick={() => setDepartmentOpen(!departmentOpen)}
                        className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#2D3F7B]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                          </svg>
                          <span className="truncate">{department}</span>
                        </div>
                        <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {departmentOpen && (
                        <div className="absolute mt-2 w-full bg-white border border-slate-200 rounded-md shadow-lg z-30">
                          {departments.map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => selectDepartment(d)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${department === d ? 'font-semibold text-[#2D3F7B]' : 'text-slate-700'}`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Impact Analysis */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Impact Analysis</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Beneficiaries</span>
                      <span className="font-semibold text-slate-900">~12,000 Residents</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Priority Score</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        High (92)
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600">Alignment with City Goals</span>
                        <span className="text-sm font-medium text-slate-900">85%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-[#2D3F7B] h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* toast */}
          {toast && (
            <div className="fixed right-6 bottom-24 z-50 bg-[#19295C] text-white px-4 py-2 rounded-lg shadow-lg">
              {toast}
            </div>
          )}

          {/* Chatbot Panel */}
          {showChatbot && (
            <div className="fixed right-6 top-32 z-50 w-96 h-[550px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
              {/* Chatbot Header */}
              <div className="bg-gradient-to-r from-[#2D3F7B] to-[#19295C] text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">Hamro Sir</h3>
                    <p className="text-xs text-white/80">Online</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowChatbot(false)}
                  className="hover:bg-white/20 p-1 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.sender === 'user' 
                        ? 'bg-[#2D3F7B] text-white rounded-br-sm' 
                        : 'bg-white text-slate-800 rounded-bl-sm shadow-sm border border-slate-200'
                    }`}>
                      {msg.sender === 'bot' ? (
                        <div 
                          className="text-sm"
                          dangerouslySetInnerHTML={{ __html: msg.text }}
                        />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatMessagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-slate-200">
                {/* Hint buttons */}
                <div className="mb-3 flex gap-2 flex-wrap">
                  <button
                    onClick={() => setChatInput("Top issues")}
                    className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                  >
                    Top Issues
                  </button>
                  <button
                    onClick={() => setChatInput("Help draft")}
                    className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                  >
                    Help Draft
                  </button>
                  <button
                    onClick={() => setChatInput("Budget estimate")}
                    className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                  >
                    Budget Estimate
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder="Ask me anything..."
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#2D3F7B] focus:border-transparent text-sm text-slate-900"
                  />
                  <button
                    onClick={handleSendChat}
                    className="bg-[#2D3F7B] hover:bg-[#19295C] text-white p-2 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 12 6-6 6 6M12 6v12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Drafts Modal (shows all saved drafts with edit/load/delete) */}
          {showDraftModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-[#2D3F7B]/20">
              <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Saved Drafts</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={handleClearAllDrafts} className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-md">Clear All</button>
                    <button onClick={() => setShowDraftModal(false)} className="px-3 py-1 text-sm bg-slate-700 rounded-md">Close</button>
                  </div>
                </div>

                {draftsList.length === 0 ? (
                  <p className="text-center text-slate-500 text-sm py-8">No drafts saved yet.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-auto">
                    {draftsList.map((d) => (
                      <div key={d.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-md font-semibold text-[#19295C] truncate">{d.projectTitle || 'Untitled draft'}</h4>
                            <span className="text-xs text-slate-500">• {new Date(d.updatedAt).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-slate-600 max-w-2xl truncate">{d.problemStatement}</p>
                          <div className="mt-2 text-xs text-slate-500 flex gap-4">
                            <div>Budget: {d.estimatedBudget}</div>
                            <div>Duration: {d.estimatedDuration}</div>
                            <div>Dept: {d.department}</div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-end gap-2">
                          <button onClick={() => handleLoadDraft(d)} className="px-3 py-1 bg-[#2D3F7B] text-white rounded-md hover:bg-[#19295C]">Load</button>
                          <button onClick={() => handleDeleteDraft(d.id)} className="px-3 py-1 bg-red-50 text-red-600 rounded-md hover:bg-red-100">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}