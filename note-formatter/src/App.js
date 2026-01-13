import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  // ========== STATE MANAGEMENT ==========
  const [rawText, setRawText] = useState('');
  const [fontSize, setFontSize] = useState('medium');
  const [highlightColor, setHighlightColor] = useState('#ffeb3b');
  const [textColor, setTextColor] = useState('#2c2416');
  const [savedNotes, setSavedNotes] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Stages 1-5
  const [selectedTheme, setSelectedTheme] = useState('warm');
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [highlightPalette] = useState(['#ffeb3b', '#ffd4d4', '#d4e4ff', '#d4ffd4', '#ffe4cc']);
  const [currentHighlight, setCurrentHighlight] = useState(0);
  const [showDiagramView, setShowDiagramView] = useState(false);
  const [diagramType, setDiagramType] = useState('flowchart');
  const [showMindMap, setShowMindMap] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [viewMode, setViewMode] = useState('editor');
  const [currentPage, setCurrentPage] = useState(0);
  const [journeyProgress, setJourneyProgress] = useState(0);

  // Stage 6: Smart Formatting
  const [showSettings, setShowSettings] = useState(false);
  const [autoFormatSettings, setAutoFormatSettings] = useState({
    enhanceTopics: true,
    enhanceSubtopics: true,
    highlightKeywords: true,
    formatDefinitions: true,
    detectQuestions: true,
    addIcons: true,
    improveSpacing: true,
    colorCode: true
  });

  // STAGE 7: AI Chat
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 25 minutes
  const [pomodoroInterval, setPomodoroInterval] = useState(null);

  // STAGE 8: Analytics
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [studyStats, setStudyStats] = useState({
    totalNotes: 0,
    totalStudyTime: 0,
    notesThisWeek: 0,
    longestStreak: 0,
    currentStreak: 0,
    lastStudyDate: null,
    topicsStudied: {},
    dailyActivity: {}
  });
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());

  // STAGE 9: Advanced Visuals
  const [layoutMode, setLayoutMode] = useState('standard'); // standard, magazine, grid, asymmetric
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [customTemplate, setCustomTemplate] = useState(null);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);

  // STAGE 10: Topic Organization
  const [selectedTopic, setSelectedTopic] = useState('general');
  const [tags, setTags] = useState([]);
  const [currentNoteTags, setCurrentNoteTags] = useState([]);
  const [showTagManager, setShowTagManager] = useState(false);
  const [folders, setFolders] = useState(['General', 'Math', 'Science', 'History', 'Languages', 'Other']);
  const [currentFolder, setCurrentFolder] = useState('General');
  const [searchQuery, setSearchQuery] = useState('');

  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // ========== LOAD DATA ON MOUNT ==========
  useEffect(() => {
    loadSavedNotes();
    loadSettings();
    loadAnalytics();
    loadTags();
    loadFolders();
    initializeVoiceRecognition();
    trackStudySession();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Track study time
  useEffect(() => {
    const interval = setInterval(() => {
      const sessionTime = Math.floor((Date.now() - sessionStartTime) / 1000);
      updateStudyTime(sessionTime);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Pomodoro timer
  useEffect(() => {
    if (pomodoroActive && pomodoroTime > 0) {
      const interval = setInterval(() => {
        setPomodoroTime(time => {
          if (time <= 1) {
            setPomodoroActive(false);
            showNotification('⏰ Pomodoro complete! Take a break!', 'success');
            return 25 * 60;
          }
          return time - 1;
        });
      }, 1000);
      setPomodoroInterval(interval);
      return () => clearInterval(interval);
    }
  }, [pomodoroActive, pomodoroTime]);

  // ========== STAGE 7: AI CHAT FUNCTIONS ==========
  
  const sendMessageToAI = async (message) => {
    const userMessage = { role: 'user', content: message, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsAIThinking(true);

    try {
      // Simulate AI response (in production, call actual AI API)
      const aiResponse = generateAIResponse(message);
      
      setTimeout(() => {
        const assistantMessage = { 
          role: 'assistant', 
          content: aiResponse, 
          timestamp: Date.now() 
        };
        setChatMessages(prev => [...prev, assistantMessage]);
        setIsAIThinking(false);
      }, 1500);
    } catch (error) {
      console.error('AI error:', error);
      setIsAIThinking(false);
      showNotification('AI error occurred', 'error');
    }
  };

  const generateAIResponse = (message) => {
    const lower = message.toLowerCase();
    
    // Question answering
    if (lower.includes('what is') || lower.includes('define')) {
      const context = rawText.substring(0, 500);
      return `Based on your notes: ${context ? 'I can see you\'re studying topics related to this. ' : ''}Let me help explain that concept. This is a simulated response - in production, this would use Claude AI API to analyze your notes and provide intelligent answers.`;
    }
    
    // Summarization
    if (lower.includes('summarize') || lower.includes('summary')) {
      return `Here's a summary of your notes:\n\n• Main topics covered\n• Key concepts highlighted\n• Important definitions\n\nNote: This is a demo. Production version would use AI to generate real summaries.`;
    }
    
    // Quiz generation
    if (lower.includes('quiz') || lower.includes('test me')) {
      return `Great! Here are some quiz questions based on your notes:\n\n1. What is the main concept?\n2. Define the key terms\n3. How do these ideas connect?\n\nNote: Production version would generate actual questions from your content.`;
    }
    
    // Suggestions
    if (lower.includes('suggest') || lower.includes('improve')) {
      return `Suggestions to improve your notes:\n\n✓ Add more examples\n✓ Create visual diagrams\n✓ Include practice questions\n✓ Highlight key definitions\n\nNote: AI would provide specific suggestions based on content analysis.`;
    }
    
    // Default response
    return `I'm here to help with your notes! Ask me to:\n• Explain concepts\n• Summarize sections\n• Generate quiz questions\n• Suggest improvements\n• Find connections\n\nNote: This is a demo interface. Production version uses Claude AI API.`;
  };

  const toggleFocusMode = () => {
    setFocusMode(!focusMode);
    if (!focusMode) {
      showNotification('🎯 Focus Mode activated! Distractions dimmed.', 'info');
    }
  };

  const startPomodoro = () => {
    setPomodoroActive(true);
    setPomodoroTime(25 * 60);
    showNotification('⏱️ Pomodoro started! 25 minutes of focused study.', 'info');
  };

  const stopPomodoro = () => {
    setPomodoroActive(false);
    if (pomodoroInterval) clearInterval(pomodoroInterval);
    setPomodoroTime(25 * 60);
  };

  const formatPomodoroTime = () => {
    const minutes = Math.floor(pomodoroTime / 60);
    const seconds = pomodoroTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // ========== STAGE 8: ANALYTICS FUNCTIONS ==========
  
  const loadAnalytics = () => {
    try {
      const saved = localStorage.getItem('noteFormatter_analytics');
      if (saved) {
        setStudyStats(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const saveAnalytics = (stats) => {
    setStudyStats(stats);
    localStorage.setItem('noteFormatter_analytics', JSON.stringify(stats));
  };

  const trackStudySession = () => {
    const today = new Date().toDateString();
    const stats = { ...studyStats };
    
    // Update last study date and streaks
    if (stats.lastStudyDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      if (stats.lastStudyDate === yesterday) {
        stats.currentStreak++;
      } else {
        stats.currentStreak = 1;
      }
      
      if (stats.currentStreak > stats.longestStreak) {
        stats.longestStreak = stats.currentStreak;
      }
      
      stats.lastStudyDate = today;
    }
    
    // Track daily activity
    if (!stats.dailyActivity[today]) {
      stats.dailyActivity[today] = 0;
    }
    
    saveAnalytics(stats);
  };

  const updateStudyTime = (additionalSeconds) => {
    const stats = { ...studyStats };
    stats.totalStudyTime += additionalSeconds;
    
    const today = new Date().toDateString();
    if (!stats.dailyActivity[today]) {
      stats.dailyActivity[today] = 0;
    }
    stats.dailyActivity[today] += additionalSeconds;
    
    saveAnalytics(stats);
  };

  const trackNoteCreation = (topic) => {
    const stats = { ...studyStats };
    stats.totalNotes++;
    stats.notesThisWeek++; // Simplified - would track actual week
    
    if (!stats.topicsStudied[topic]) {
      stats.topicsStudied[topic] = 0;
    }
    stats.topicsStudied[topic]++;
    
    saveAnalytics(stats);
  };

  const getTopTopics = () => {
    const topics = Object.entries(studyStats.topicsStudied);
    return topics.sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  const formatStudyTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // ========== STAGE 9: ADVANCED VISUAL FUNCTIONS ==========
  
  const changeLayoutMode = (mode) => {
    setLayoutMode(mode);
    showNotification(`📐 Layout changed to ${mode}`, 'success');
  };

  const saveCustomTemplate = () => {
    const template = {
      name: prompt('Template name:') || 'Custom Template',
      content: rawText,
      theme: selectedTheme,
      fontSize: fontSize,
      createdAt: Date.now()
    };
    
    setCustomTemplate(template);
    localStorage.setItem('noteFormatter_customTemplate', JSON.stringify(template));
    showNotification('✨ Template saved!', 'success');
  };

  const loadCustomTemplate = () => {
    if (customTemplate) {
      setRawText(customTemplate.content);
      setSelectedTheme(customTemplate.theme);
      setFontSize(customTemplate.fontSize);
      showNotification('📄 Template loaded!', 'success');
    }
  };

  // ========== STAGE 10: ORGANIZATION FUNCTIONS ==========
  
  const loadTags = () => {
    try {
      const saved = localStorage.getItem('noteFormatter_tags');
      if (saved) {
        setTags(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const saveTags = (newTags) => {
    setTags(newTags);
    localStorage.setItem('noteFormatter_tags', JSON.stringify(newTags));
  };

  const addTag = (tag) => {
    if (!tags.includes(tag)) {
      const newTags = [...tags, tag];
      saveTags(newTags);
    }
    
    if (!currentNoteTags.includes(tag)) {
      setCurrentNoteTags([...currentNoteTags, tag]);
    }
  };

  const removeTag = (tag) => {
    setCurrentNoteTags(currentNoteTags.filter(t => t !== tag));
  };

  const loadFolders = () => {
    try {
      const saved = localStorage.getItem('noteFormatter_folders');
      if (saved) {
        setFolders(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const saveFolders = (newFolders) => {
    setFolders(newFolders);
    localStorage.setItem('noteFormatter_folders', JSON.stringify(newFolders));
  };

  const addFolder = () => {
    const name = prompt('Folder name:');
    if (name && !folders.includes(name)) {
      const newFolders = [...folders, name];
      saveFolders(newFolders);
      showNotification(`📁 Folder "${name}" created!`, 'success');
    }
  };

  const applyTopicFormat = (topic) => {
    setSelectedTopic(topic);
    
    // Auto-apply topic-specific formatting
    const topicTemplates = {
      math: '## Problem\n\n## Solution\n\n## Answer\n\n',
      science: '## Hypothesis\n\n## Experiment\n\n## Results\n\n## Conclusion\n\n',
      history: '## Event\n\n## Date\n\n## Significance\n\n## Key Figures\n\n',
      languages: '## Vocabulary\n\n## Grammar\n\n## Examples\n\n',
      programming: '```\n// Code here\n```\n\n## Explanation\n\n'
    };
    
    if (topicTemplates[topic.toLowerCase()] && !rawText.trim()) {
      setRawText(topicTemplates[topic.toLowerCase()]);
    }
    
    showNotification(`📚 Topic set to ${topic}`, 'info');
  };

  const searchNotes = (query) => {
    setSearchQuery(query);
    if (!query) return savedNotes;
    
    const lower = query.toLowerCase();
    return savedNotes.filter(note => 
      note.title.toLowerCase().includes(lower) ||
      note.rawContent.toLowerCase().includes(lower) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(lower)))
    );
  };

  // ========== STAGE 6: SMART FORMATTING (from previous) ==========
  
  const applySmartFormatting = () => {
    let formatted = rawText;
    if (!formatted.trim()) {
      showNotification('⚠️ Nothing to format!', 'warning');
      return;
    }

    if (autoFormatSettings.enhanceTopics) formatted = enhanceMainTopics(formatted);
    if (autoFormatSettings.enhanceSubtopics) formatted = enhanceSubtopics(formatted);
    if (autoFormatSettings.highlightKeywords) formatted = highlightImportantKeywords(formatted);
    if (autoFormatSettings.formatDefinitions) formatted = formatDefinitions(formatted);
    if (autoFormatSettings.detectQuestions) formatted = formatQuestions(formatted);
    if (autoFormatSettings.addIcons) formatted = addContextualIcons(formatted);
    if (autoFormatSettings.improveSpacing) formatted = improveSpacing(formatted);
    if (autoFormatSettings.colorCode) formatted = addColorCoding(formatted);

    setRawText(formatted);
    showNotification('✨ Notes formatted beautifully!', 'success');
  };

  const enhanceMainTopics = (text) => {
    const lines = text.split('\n');
    return lines.map(line => {
      if (line.length > 0 && line.length < 50) {
        const upper = line.toUpperCase();
        if (line === upper && !line.startsWith('#')) return `# ${line}`;
        const topicWords = ['chapter', 'unit', 'section', 'overview', 'introduction'];
        if (topicWords.some(word => line.toLowerCase().includes(word)) && !line.startsWith('#')) {
          return `# ${line}`;
        }
      }
      return line;
    }).join('\n');
  };

  const enhanceSubtopics = (text) => {
    const lines = text.split('\n');
    const formatted = [];
    let inList = false;
    
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || trimmed.startsWith('-') || trimmed.startsWith('*') || 
          trimmed.startsWith('→') || trimmed.startsWith('•')) {
        formatted.push(line);
        return;
      }
      const prevLine = i > 0 ? lines[i - 1].trim() : '';
      if (prevLine.startsWith('#') && trimmed.length > 0 && trimmed.length < 60) {
        formatted.push(`  → ${trimmed}`);
        inList = true;
      } else if (inList && trimmed.length > 0 && trimmed.length < 60) {
        formatted.push(`  → ${trimmed}`);
      } else {
        formatted.push(line);
        if (trimmed.length === 0) inList = false;
      }
    });
    return formatted.join('\n');
  };

  const highlightImportantKeywords = (text) => {
    const keywords = ['important', 'crucial', 'essential', 'key', 'critical', 'remember', 'exam', 'test'];
    let formatted = text;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b(?![^<]*>|[^<>]*</)`, 'gi');
      formatted = formatted.replace(regex, (match) => {
        if (formatted.indexOf(`==${match}==`) !== -1) return match;
        return `==${match}==`;
      });
    });
    return formatted;
  };

  const formatDefinitions = (text) => {
    return text.split('\n').map(line => {
      const colonMatch = line.match(/^([^:]{2,30}):\s*(.+)$/);
      if (colonMatch && !line.startsWith('#')) {
        const [, term, definition] = colonMatch;
        return `**${term.trim()}**: *${definition.trim()}*`;
      }
      return line;
    }).join('\n');
  };

  const formatQuestions = (text) => {
    return text.split('\n').map(line => {
      if (line.trim().endsWith('?') && !line.startsWith('[?]')) {
        return `[?] ${line.trim()}`;
      }
      return line;
    }).join('\n');
  };

  const addContextualIcons = (text) => {
    const patterns = [
      { regex: /\b(complete|completed|done|finished)\b/gi, icon: '[x]' },
      { regex: /\b(important|critical|crucial)\b/gi, icon: '[!]' },
      { regex: /\b(question|unclear)\b/gi, icon: '[?]' },
      { regex: /\b(excellent|great|perfect)\b/gi, icon: '[*]' }
    ];
    
    return text.split('\n').map(line => {
      if (line.includes('[x]') || line.includes('[!]') || line.includes('[?]') || line.includes('[*]')) {
        return line;
      }
      for (const pattern of patterns) {
        if (pattern.regex.test(line)) {
          return `${pattern.icon} ${line}`;
        }
      }
      return line;
    }).join('\n');
  };

  const improveSpacing = (text) => {
    let formatted = text;
    formatted = formatted.replace(/(^#{1,3}\s+.+$)/gm, '$1\n');
    formatted = formatted.replace(/([^\n])\n(#{1,3}\s+)/gm, '$1\n\n$2');
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    return formatted;
  };

  const addColorCoding = (text) => {
    return text.split('\n').map(line => {
      if (line.includes('[box]') || line.includes('[note]') || line.includes('[tip]') || line.includes('[warning]')) {
        return line;
      }
      const lower = line.toLowerCase();
      if (lower.includes('warning') || lower.includes('exam') || lower.includes('test')) {
        return `[warning]${line}[/warning]`;
      }
      if (lower.includes('tip') || lower.includes('remember')) {
        return `[tip]${line}[/tip]`;
      }
      if (lower.includes('example')) {
        return `[note]${line}[/note]`;
      }
      return line;
    }).join('\n');
  };

  // ========== FORMATTING ENGINE ==========
  const formatText = (text) => {
    if (!text.trim()) {
      return '<p class="preview-placeholder">Your formatted notes will appear here...</p>';
    }

    let formatted = text;
    formatted = formatHeadings(formatted);
    formatted = formatBold(formatted);
    formatted = formatItalic(formatted);
    formatted = formatUnderline(formatted);
    formatted = formatHighlights(formatted);
    formatted = formatSymbols(formatted);
    formatted = formatBoxes(formatted);
    formatted = formatLists(formatted);
    formatted = formatParagraphs(formatted);

    return `<div class="formatted-content size-${fontSize} theme-${selectedTheme} layout-${layoutMode}">${formatted}</div>`;
  };

  const formatSymbols = (text) => {
    text = text.replace(/->|→/g, '<span class="arrow">→</span>');
    text = text.replace(/<-|←/g, '<span class="arrow">←</span>');
    text = text.replace(/\[!\]/g, '<span class="symbol-important">⚠️</span>');
    text = text.replace(/\[x\]/g, '<span class="symbol-done">✓</span>');
    text = text.replace(/\[\?\]/g, '<span class="symbol-question">❓</span>');
    text = text.replace(/\[\*\]/g, '<span class="symbol-star">⭐</span>');
    return text;
  };

  const formatBoxes = (text) => {
    text = text.replace(/\[box\]([\s\S]*?)\[\/box\]/g, '<div class="content-box">$1</div>');
    text = text.replace(/\[note\]([\s\S]*?)\[\/note\]/g, '<div class="content-note">📝 $1</div>');
    text = text.replace(/\[warning\]([\s\S]*?)\[\/warning\]/g, '<div class="content-warning">⚠️ $1</div>');
    text = text.replace(/\[tip\]([\s\S]*?)\[\/tip\]/g, '<div class="content-tip">💡 $1</div>');
    return text;
  };

  const formatHeadings = (text) => {
    text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    return text;
  };

  const formatBold = (text) => text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const formatItalic = (text) => text.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, '<em>$1</em>');
  const formatUnderline = (text) => text.replace(/__(.+?)__/g, '<u>$1</u>');
  const formatHighlights = (text) => {
    const color = highlightPalette[currentHighlight];
    return text.replace(/==(.+?)==/g, `<mark style="background-color: ${color};">$1</mark>`);
  };

  const formatLists = (text) => {
    const lines = text.split('\n');
    let result = [];
    let inList = false;
    let listType = null;

    lines.forEach((line) => {
      const bulletMatch = line.match(/^[\s]*[-*→•]\s+(.+)$/);
      const numberedMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);

      if (bulletMatch) {
        if (!inList || listType !== 'ul') {
          if (inList) result.push(`</${listType}>`);
          result.push('<ul>');
          inList = true;
          listType = 'ul';
        }
        result.push(`<li>${bulletMatch[1]}</li>`);
      } else if (numberedMatch) {
        if (!inList || listType !== 'ol') {
          if (inList) result.push(`</${listType}>`);
          result.push('<ol>');
          inList = true;
          listType = 'ol';
        }
        result.push(`<li>${numberedMatch[1]}</li>`);
      } else {
        if (inList) {
          result.push(`</${listType}>`);
          inList = false;
          listType = null;
        }
        result.push(line);
      }
    });

    if (inList) result.push(`</${listType}>`);
    return result.join('\n');
  };

  const formatParagraphs = (text) => {
    let paragraphs = text.split(/\n\s*\n/);
    paragraphs = paragraphs.map((para) => {
      if (para.trim().startsWith('<')) return para;
      para = para.replace(/\n/g, '<br>');
      return `<p>${para}</p>`;
    });
    return paragraphs.join('\n');
  };

  // ========== VOICE & OTHER UTILITIES ==========
  const initializeVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        processVoiceCommand(transcript);
      };
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
      showNotification('🎤 Listening...', 'info');
    }
  };

  const processVoiceCommand = (command) => {
    const lower = command.toLowerCase();
    if (lower.includes('make aesthetic')) applySmartFormatting();
    else if (lower.includes('analytics')) setShowAnalytics(true);
    else if (lower.includes('chat')) setShowAIChat(true);
    else if (lower.includes('focus')) toggleFocusMode();
  };

  const wrapSelection = (before, after) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = rawText.substring(start, end);
    if (selectedText) {
      const newText = rawText.substring(0, start) + before + selectedText + after + rawText.substring(end);
      setRawText(newText);
    }
  };

  const insertSymbol = (symbol) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const newText = rawText.substring(0, start) + symbol + rawText.substring(start);
    setRawText(newText);
  };

  const saveNote = () => {
    if (!rawText.trim()) {
      showNotification('Nothing to save!', 'warning');
      return;
    }
    const title = prompt('Enter a title:') || 'Untitled Note';
    const note = {
      id: Date.now(),
      title,
      rawContent: rawText,
      formattedContent: formatText(rawText),
      createdAt: new Date().toISOString(),
      theme: selectedTheme,
      template: selectedTemplate,
      topic: selectedTopic,
      tags: currentNoteTags,
      folder: currentFolder
    };
    const notes = [...savedNotes, note];
    setSavedNotes(notes);
    localStorage.setItem('noteFormatter_savedNotes', JSON.stringify(notes));
    trackNoteCreation(selectedTopic);
    showNotification('📝 Note saved!', 'success');
  };

  const loadSavedNotes = () => {
    try {
      const notes = JSON.parse(localStorage.getItem('noteFormatter_savedNotes') || '[]');
      setSavedNotes(notes);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('noteFormatter_settings');
      if (saved) setAutoFormatSettings(JSON.parse(saved));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = (newSettings) => {
    setAutoFormatSettings(newSettings);
    localStorage.setItem('noteFormatter_settings', JSON.stringify(newSettings));
    showNotification('⚙️ Settings saved!', 'success');
  };

  const loadNote = (note) => {
    setRawText(note.rawContent);
    setSelectedTheme(note.theme || 'warm');
    setSelectedTopic(note.topic || 'general');
    setCurrentNoteTags(note.tags || []);
    setCurrentFolder(note.folder || 'General');
    setShowSidebar(false);
    showNotification('✅ Note loaded!', 'success');
  };

  const deleteNote = (id) => {
    if (window.confirm('Delete this note?')) {
      const notes = savedNotes.filter((n) => n.id !== id);
      setSavedNotes(notes);
      localStorage.setItem('noteFormatter_savedNotes', JSON.stringify(notes));
      showNotification('🗑️ Note deleted!', 'info');
    }
  };

  const exportToPDF = async () => {
    if (!rawText.trim()) {
      showNotification('Nothing to export!', 'warning');
      return;
    }
    try {
      const element = document.getElementById('preview');
      if (window.html2pdf) {
        await window.html2pdf().set({
          margin: 1,
          filename: 'my-notes.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        }).from(element).save();
        showNotification('📄 Exporting PDF...', 'info');
      }
    } catch (error) {
      console.error('PDF export error:', error);
    }
  };

  const copyHTML = () => {
    if (!rawText.trim()) return;
    navigator.clipboard.writeText(document.getElementById('preview').innerHTML)
      .then(() => showNotification('📋 HTML copied!', 'success'));
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  const splitIntoPages = () => rawText.split(/\n\s*\n/);
  const nextPage = () => { if (currentPage < splitIntoPages().length - 1) setCurrentPage(currentPage + 1); };
  const prevPage = () => { if (currentPage > 0) setCurrentPage(currentPage - 1); };

  // ========== RENDER ==========
  return (
    <div className={`app theme-${selectedTheme} ${focusMode ? 'focus-mode' : ''}`}>
      <header className="header">
        <h1>✨ Note Formatter Ultimate</h1>
        <p>AI Chat • Analytics • Smart Formatting • Visual Tools • Full Organization</p>
      </header>

      <div className="view-mode-switcher">
        <button className={`mode-btn ${viewMode === 'editor' ? 'active' : ''}`} onClick={() => setViewMode('editor')}>
          ✏️ Editor
        </button>
        <button className={`mode-btn ${showAIChat ? 'active' : ''}`} onClick={() => setShowAIChat(!showAIChat)}>
          💬 AI Chat
        </button>
        <button className={`mode-btn ${showAnalytics ? 'active' : ''}`} onClick={() => setShowAnalytics(!showAnalytics)}>
          📊 Analytics
        </button>
        <button className={`mode-btn ${showTemplateLibrary ? 'active' : ''}`} onClick={() => setShowTemplateLibrary(!showTemplateLibrary)}>
          🎨 Templates
        </button>
        <button className="mode-btn settings-btn" onClick={() => setShowSettings(true)}>
          ⚙️ Settings
        </button>
      </div>

      {viewMode === 'editor' && (
        <main className="main-content">
          <section className="editor-section">
            <div className="section-header">
              <h2>Your Notes</h2>
              <div className="header-controls">
                <button className="btn btn-magic" onClick={applySmartFormatting}>
                  ✨ Make Aesthetic
                </button>
                <button className={`btn ${focusMode ? 'btn-primary' : 'btn-secondary'}`} onClick={toggleFocusMode}>
                  {focusMode ? '🎯 Focused' : '🎯 Focus'}
                </button>
                <button className={`btn btn-voice ${isListening ? 'listening' : ''}`} onClick={toggleVoiceInput}>
                  🎤
                </button>
              </div>
            </div>

            {/* STAGE 10: Topic & Folder Selector */}
            <div className="organization-bar">
              <select value={currentFolder} onChange={(e) => setCurrentFolder(e.target.value)} className="folder-select">
                {folders.map(folder => (
                  <option key={folder} value={folder}>📁 {folder}</option>
                ))}
              </select>
              
              <select value={selectedTopic} onChange={(e) => applyTopicFormat(e.target.value)} className="topic-select">
                <option value="general">📚 General</option>
                <option value="math">🔢 Math</option>
                <option value="science">🔬 Science</option>
                <option value="history">📜 History</option>
                <option value="languages">🗣️ Languages</option>
                <option value="programming">💻 Programming</option>
              </select>

              <button className="btn btn-sm" onClick={() => setShowTagManager(!showTagManager)}>
                🏷️ Tags ({currentNoteTags.length})
              </button>
              
              <button className="btn btn-sm" onClick={addFolder}>➕ Folder</button>
            </div>

            {showTagManager && (
              <div className="tag-manager">
                <div className="tag-input-group">
                  <input 
                    type="text" 
                    placeholder="Add tag..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value) {
                        addTag(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="tag-input"
                  />
                </div>
                <div className="current-tags">
                  {currentNoteTags.map(tag => (
                    <span key={tag} className="tag">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="tag-remove">×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Type your notes here..."
              className="note-input"
            />

            <div className="toolbar-enhanced">
              <div className="toolbar-section">
                <h4>Format</h4>
                <button onClick={() => wrapSelection('**', '**')} className="tool-btn"><strong>B</strong></button>
                <button onClick={() => wrapSelection('*', '*')} className="tool-btn"><em>I</em></button>
                <button onClick={() => wrapSelection('==', '==')} className="tool-btn"><mark>H</mark></button>
              </div>

              <div className="toolbar-section">
                <h4>Highlights</h4>
                <div className="color-palette">
                  {highlightPalette.map((color, i) => (
                    <button key={i} className={`color-btn ${i === currentHighlight ? 'active' : ''}`}
                      style={{ backgroundColor: color }} onClick={() => setCurrentHighlight(i)} />
                  ))}
                </div>
              </div>

              <div className="toolbar-section">
                <h4>Theme</h4>
                <select value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)}>
                  <option value="warm">Warm</option>
                  <option value="cool">Cool</option>
                  <option value="dark">Dark</option>
                  <option value="pastel">Pastel</option>
                  <option value="vibrant">Vibrant</option>
                </select>
              </div>

              {/* STAGE 9: Layout Mode */}
              <div className="toolbar-section">
                <h4>Layout</h4>
                <select value={layoutMode} onChange={(e) => changeLayoutMode(e.target.value)}>
                  <option value="standard">Standard</option>
                  <option value="magazine">Magazine</option>
                  <option value="grid">Grid</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
            </div>
          </section>

          <section className="preview-section">
            <div className="section-header">
              <h2>Preview</h2>
              <div className="action-buttons">
                <button onClick={saveNote} className="btn btn-primary">💾</button>
                <button onClick={exportToPDF} className="btn btn-primary">📄</button>
                <button onClick={copyHTML} className="btn btn-secondary">📋</button>
              </div>
            </div>
            <div id="preview" className="preview-content" dangerouslySetInnerHTML={{ __html: formatText(rawText) }} />
          </section>
        </main>
      )}

      {/* STAGE 7: AI CHAT PANEL */}
      {showAIChat && (
        <div className="ai-chat-panel">
          <div className="chat-header">
            <h2>💬 AI Study Assistant</h2>
            <button onClick={() => setShowAIChat(false)} className="close-btn">✕</button>
          </div>
          
          <div className="chat-messages">
            {chatMessages.length === 0 && (
              <div className="chat-welcome">
                <h3>👋 Hi! I'm your AI study assistant</h3>
                <p>Ask me to:</p>
                <ul>
                  <li>Explain concepts from your notes</li>
                  <li>Summarize sections</li>
                  <li>Generate quiz questions</li>
                  <li>Suggest improvements</li>
                </ul>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
            {isAIThinking && <div className="chat-message assistant thinking">Thinking...</div>}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-container">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && chatInput && sendMessageToAI(chatInput)}
              placeholder="Ask me anything about your notes..."
              className="chat-input"
            />
            <button onClick={() => chatInput && sendMessageToAI(chatInput)} className="btn btn-primary">
              Send
            </button>
          </div>

          <div className="focus-mode-controls">
            <button onClick={toggleFocusMode} className={`btn ${focusMode ? 'btn-primary' : 'btn-secondary'}`}>
              {focusMode ? '🎯 Focused' : '🎯 Focus Mode'}
            </button>
            <button 
              onClick={pomodoroActive ? stopPomodoro : startPomodoro} 
              className={`btn ${pomodoroActive ? 'btn-secondary' : 'btn-primary'}`}
            >
              {pomodoroActive ? `⏸️ ${formatPomodoroTime()}` : '⏱️ Pomodoro'}
            </button>
          </div>
        </div>
      )}

      {/* STAGE 8: ANALYTICS DASHBOARD */}
      {showAnalytics && (
        <div className="analytics-overlay">
          <div className="analytics-modal">
            <div className="analytics-header">
              <h2>📊 Study Analytics</h2>
              <button onClick={() => setShowAnalytics(false)} className="close-btn">✕</button>
            </div>

            <div className="analytics-content">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📝</div>
                  <div className="stat-value">{studyStats.totalNotes}</div>
                  <div className="stat-label">Total Notes</div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-value">{formatStudyTime(studyStats.totalStudyTime)}</div>
                  <div className="stat-label">Study Time</div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🔥</div>
                  <div className="stat-value">{studyStats.currentStreak}</div>
                  <div className="stat-label">Day Streak</div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🏆</div>
                  <div className="stat-value">{studyStats.longestStreak}</div>
                  <div className="stat-label">Best Streak</div>
                </div>
              </div>

              <div className="analytics-section">
                <h3>📚 Top Topics</h3>
                <div className="topic-list">
                  {getTopTopics().map(([topic, count]) => (
                    <div key={topic} className="topic-item">
                      <span className="topic-name">{topic}</span>
                      <span className="topic-count">{count} notes</span>
                    </div>
                  ))}
                  {getTopTopics().length === 0 && <p>No topics yet. Start taking notes!</p>}
                </div>
              </div>

              <div className="analytics-section">
                <h3>📈 This Week</h3>
                <p className="week-stat">You've created {studyStats.notesThisWeek} notes this week!</p>
                <p className="week-stat">Keep up the great work! 🎉</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 9: TEMPLATE LIBRARY */}
      {showTemplateLibrary && (
        <div className="template-overlay">
          <div className="template-modal">
            <div className="template-header">
              <h2>🎨 Template Library</h2>
              <button onClick={() => setShowTemplateLibrary(false)} className="close-btn">✕</button>
            </div>

            <div className="template-content">
              <div className="template-grid">
                <div className="template-card" onClick={() => setSelectedTemplate('cornell')}>
                  <h3>Cornell Notes</h3>
                  <p>Structured note-taking with cues and summary</p>
                </div>

                <div className="template-card" onClick={() => setSelectedTemplate('outline')}>
                  <h3>Outline</h3>
                  <p>Hierarchical organization</p>
                </div>

                <div className="template-card" onClick={() => setSelectedTemplate('flashcard')}>
                  <h3>Flashcards</h3>
                  <p>Question-answer format</p>
                </div>

                <div className="template-card" onClick={saveCustomTemplate}>
                  <h3>💾 Save Custom</h3>
                  <p>Save current as template</p>
                </div>

                {customTemplate && (
                  <div className="template-card" onClick={loadCustomTemplate}>
                    <h3>📄 {customTemplate.name}</h3>
                    <p>Your custom template</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 6: SETTINGS MODAL */}
      {showSettings && (
        <div className="settings-overlay">
          <div className="settings-modal">
            <div className="settings-header">
              <h2>⚙️ Smart Formatting Settings</h2>
              <button onClick={() => setShowSettings(false)} className="close-btn">✕</button>
            </div>

            <div className="settings-content">
              <div className="settings-grid">
                {Object.entries({
                  enhanceTopics: { title: '📏 Enhance Main Topics', desc: 'Convert topics to headings' },
                  enhanceSubtopics: { title: '→ Format Subtopics', desc: 'Add arrows to subtopics' },
                  highlightKeywords: { title: '🎨 Highlight Keywords', desc: 'Auto-highlight important words' },
                  formatDefinitions: { title: '📖 Format Definitions', desc: 'Format term: definition' },
                  detectQuestions: { title: '❓ Detect Questions', desc: 'Add icons to questions' },
                  addIcons: { title: '🎭 Add Context Icons', desc: 'Smart icons based on meaning' },
                  improveSpacing: { title: '📏 Improve Spacing', desc: 'Better readability' },
                  colorCode: { title: '🎨 Color-Code Content', desc: 'Colored boxes by type' }
                }).map(([key, { title, desc }]) => (
                  <div key={key} className="setting-item">
                    <label className="setting-label">
                      <input
                        type="checkbox"
                        checked={autoFormatSettings[key]}
                        onChange={(e) => saveSettings({ ...autoFormatSettings, [key]: e.target.checked })}
                      />
                      <div className="setting-info">
                        <h4>{title}</h4>
                        <p>{desc}</p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="settings-footer">
                <button className="btn btn-primary" onClick={() => { applySmartFormatting(); setShowSettings(false); }}>
                  ✨ Apply & Format Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Notes Sidebar */}
      <aside className={`saved-notes-sidebar ${showSidebar ? 'active' : ''}`}>
        <div className="sidebar-header">
          <h3>Saved Notes</h3>
          <button onClick={() => setShowSidebar(false)} className="close-btn">✕</button>
        </div>

        {/* STAGE 10: Search */}
        <div className="sidebar-search">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search notes..."
            className="search-input"
          />
        </div>

        <div className="saved-notes-list">
          {(searchQuery ? searchNotes(searchQuery) : savedNotes).length === 0 ? (
            <p className="no-notes">No notes found</p>
          ) : (
            (searchQuery ? searchNotes(searchQuery) : savedNotes).slice().reverse().map((note) => (
              <div key={note.id} className="saved-note-item">
                <h4>{note.title}</h4>
                <div className="note-meta">
                  <span className="note-folder">📁 {note.folder || 'General'}</span>
                  <span className="note-date">{formatDate(note.createdAt)}</span>
                </div>
                {note.tags && note.tags.length > 0 && (
                  <div className="note-tags">
                    {note.tags.map(tag => (
                      <span key={tag} className="tag-small">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="note-actions">
                  <button onClick={() => loadNote(note)} className="btn btn-sm btn-primary">Load</button>
                  <button onClick={() => deleteNote(note.id)} className="btn btn-sm btn-secondary">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <button onClick={() => setShowSidebar(!showSidebar)} className="toggle-sidebar-btn">
        📚 Notes ({savedNotes.length})
      </button>

      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Focus Mode Overlay */}
      {focusMode && <div className="focus-overlay" />}
    </div>
  );
}

export default App;