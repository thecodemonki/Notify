import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  // Core state
  const [rawText, setRawText] = useState('');
  const [fontSize, setFontSize] = useState('medium');
  const [savedNotes, setSavedNotes] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Visual states
  const [selectedTheme, setSelectedTheme] = useState('luxury');
  const [highlightPalette] = useState(['#FFD700', '#FFB6C1', '#B0E0E6', '#98FB98', '#FFDAB9']);
  const [currentHighlight, setCurrentHighlight] = useState(0);
  const [viewMode, setViewMode] = useState('editor');
  
  // Smart formatting
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

  // AI Chat
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  
  // NEW: AI Command Mode
  const [commandMode, setCommandMode] = useState(false);
  const [isListeningCommand, setIsListeningCommand] = useState(false);
  
  // NEW: Photo Scanner
  const [showPhotoScanner, setShowPhotoScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedImages, setScannedImages] = useState([]);
  
  // Pomodoro
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);

  // Organization
  const [currentFolder, setCurrentFolder] = useState('General');
  const [folders] = useState(['General', 'Math', 'Science', 'History', 'Languages']);
  const [currentNoteTags, setCurrentNoteTags] = useState([]);
  const [showTagManager, setShowTagManager] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const textareaRef = useRef(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const commandRecognitionRef = useRef(null);

  useEffect(() => {
    loadSavedNotes();
    loadSettings();
    initializeVoiceRecognition();
    initializeCommandVoice();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (pomodoroActive && pomodoroTime > 0) {
      const interval = setInterval(() => {
        setPomodoroTime(time => {
          if (time <= 1) {
            setPomodoroActive(false);
            showNotification('⏰ Pomodoro complete!', 'success');
            return 25 * 60;
          }
          return time - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [pomodoroActive, pomodoroTime]);

  // ========== NEW: VOICE COMMAND SYSTEM ==========
  
  const initializeCommandVoice = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      commandRecognitionRef.current = new SpeechRecognition();
      commandRecognitionRef.current.continuous = false;
      commandRecognitionRef.current.interimResults = false;
      
      commandRecognitionRef.current.onresult = (event) => {
        const command = event.results[0][0].transcript;
        processAICommand(command);
        setIsListeningCommand(false);
      };

      commandRecognitionRef.current.onerror = () => {
        setIsListeningCommand(false);
        showNotification('Voice error - try again!', 'warning');
      };

      commandRecognitionRef.current.onend = () => {
        setIsListeningCommand(false);
      };
    }
  };

  const startCommandListening = () => {
    if (commandRecognitionRef.current) {
      setIsListeningCommand(true);
      commandRecognitionRef.current.start();
      showNotification('🎤 Listening for command...', 'info');
    }
  };

  const processAICommand = async (command) => {
    showNotification(`Processing: "${command}"`, 'info');
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: `You are a note formatting assistant. The user has these notes:

"""
${rawText}
"""

User command: "${command}"

Analyze the command and return ONLY the modified notes with the requested changes applied. Common commands:
- "make X bigger" → Convert to # heading
- "highlight X" → Wrap in ==X==
- "bold X" → Wrap in **X**
- "make X a list" → Convert to bullet points
- "change X to red" → Wrap in [warning]X[/warning]
- "add arrows" → Add → symbols
- "number this" → Convert to numbered list

Return ONLY the formatted text, no explanations.`
          }]
        })
      });

      const data = await response.json();
      if (data.content && data.content[0]) {
        setRawText(data.content[0].text);
        showNotification('✨ Command applied!', 'success');
      }
    } catch (error) {
      console.error('Command error:', error);
      showNotification('Command failed - try again!', 'error');
    }
  };

  // ========== NEW: PHOTO OCR SYSTEM ==========
  
  const handlePhotoUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsScanning(true);
    showNotification('📸 Scanning images...', 'info');

    try {
      // Load Tesseract.js dynamically
      if (!window.Tesseract) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';
        document.head.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
      }

      const scannedTexts = [];
      
      for (const file of files) {
        const imageUrl = URL.createObjectURL(file);
        
        // Scan with Tesseract
        const result = await window.Tesseract.recognize(
          imageUrl,
          'eng',
          {
            logger: m => {
              if (m.status === 'recognizing text') {
                showNotification(`📸 Scanning... ${Math.round(m.progress * 100)}%`, 'info');
              }
            }
          }
        );

        scannedTexts.push(result.data.text);
        setScannedImages(prev => [...prev, { url: imageUrl, text: result.data.text }]);
      }

      // Add scanned text to notes
      const combinedText = scannedTexts.join('\n\n---\n\n');
      setRawText(prev => prev ? `${prev}\n\n${combinedText}` : combinedText);
      
      setIsScanning(false);
      setShowPhotoScanner(false);
      showNotification(`✅ Scanned ${files.length} image(s)!`, 'success');
    } catch (error) {
      console.error('OCR error:', error);
      setIsScanning(false);
      showNotification('Scanning failed - try again!', 'error');
    }
  };

  const triggerPhotoUpload = () => {
    fileInputRef.current?.click();
  };

  // ========== REAL CLAUDE AI CHAT ==========
  
  const sendMessageToAI = async (message) => {
    const userMessage = { role: 'user', content: message, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsAIThinking(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are a helpful study assistant. Here are the user's notes:

"${rawText.substring(0, 500)}..."

User question: ${message}

Provide a helpful, concise response.`
          }]
        })
      });

      const data = await response.json();
      if (data.content && data.content[0]) {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.content[0].text, 
          timestamp: Date.now() 
        }]);
      }
      setIsAIThinking(false);
    } catch (error) {
      console.error('AI error:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: '✨ I apologize, but I encountered an error. Please try again!',
        timestamp: Date.now()
      }]);
      setIsAIThinking(false);
    }
  };

  // ========== SMART FORMATTING ==========
  
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
    showNotification('✨ Notes beautified!', 'success');
  };

  const enhanceMainTopics = (text) => {
    return text.split('\n').map(line => {
      if (line.length > 0 && line.length < 50) {
        if (line === line.toUpperCase() && !line.startsWith('#')) return `# ${line}`;
        const topicWords = ['chapter', 'unit', 'section', 'overview'];
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
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || trimmed.startsWith('-') || trimmed.startsWith('→')) {
        formatted.push(line);
        return;
      }
      const prevLine = i > 0 ? lines[i - 1].trim() : '';
      if (prevLine.startsWith('#') && trimmed.length > 0 && trimmed.length < 60) {
        formatted.push(`  → ${trimmed}`);
      } else {
        formatted.push(line);
      }
    });
    return formatted.join('\n');
  };

  const highlightImportantKeywords = (text) => {
    const keywords = ['important', 'crucial', 'essential', 'key', 'exam', 'test', 'remember'];
    let formatted = text;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      formatted = formatted.replace(regex, (match) => {
        if (formatted.indexOf(`==${match}==`) !== -1) return match;
        return `==${match}==`;
      });
    });
    return formatted;
  };

  const formatDefinitions = (text) => {
    return text.split('\n').map(line => {
      const match = line.match(/^([^:]{2,30}):\s*(.+)$/);
      if (match && !line.startsWith('#')) {
        return `**${match[1].trim()}**: *${match[2].trim()}*`;
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
      { regex: /\b(complete|done|finished)\b/gi, icon: '[x]' },
      { regex: /\b(important|critical)\b/gi, icon: '[!]' },
    ];
    return text.split('\n').map(line => {
      if (line.includes('[x]') || line.includes('[!]')) return line;
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
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    return formatted;
  };

  const addColorCoding = (text) => {
    return text.split('\n').map(line => {
      if (line.includes('[warning]') || line.includes('[tip]')) return line;
      const lower = line.toLowerCase();
      if (lower.includes('warning') || lower.includes('exam')) {
        return `[warning]${line}[/warning]`;
      }
      if (lower.includes('tip') || lower.includes('remember')) {
        return `[tip]${line}[/tip]`;
      }
      return line;
    }).join('\n');
  };

  // ========== FORMATTING ENGINE ==========
  
  const formatText = (text) => {
    if (!text.trim()) {
      return '<p class="preview-placeholder">✨ Your beautiful notes will appear here...</p>';
    }

    let formatted = text;
    formatted = formatHeadings(formatted);
    formatted = formatBold(formatted);
    formatted = formatItalic(formatted);
    formatted = formatHighlights(formatted);
    formatted = formatSymbols(formatted);
    formatted = formatBoxes(formatted);
    formatted = formatLists(formatted);
    formatted = formatParagraphs(formatted);

    return `<div class="formatted-content size-${fontSize} theme-${selectedTheme}">${formatted}</div>`;
  };

  const formatSymbols = (text) => {
    text = text.replace(/->|→/g, '<span class="arrow">→</span>');
    text = text.replace(/\[!\]/g, '<span class="symbol-important">⚠️</span>');
    text = text.replace(/\[x\]/g, '<span class="symbol-done">✓</span>');
    text = text.replace(/\[\?\]/g, '<span class="symbol-question">❓</span>');
    return text;
  };

  const formatBoxes = (text) => {
    text = text.replace(/\[warning\]([\s\S]*?)\[\/warning\]/g, '<div class="content-warning">⚠️ $1</div>');
    text = text.replace(/\[tip\]([\s\S]*?)\[\/tip\]/g, '<div class="content-tip">💡 $1</div>');
    text = text.replace(/\[note\]([\s\S]*?)\[\/note\]/g, '<div class="content-note">📝 $1</div>');
    return text;
  };

  const formatHeadings = (text) => {
    text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    return text;
  };

  const formatBold = (text) => text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const formatItalic = (text) => text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  const formatHighlights = (text) => {
    const color = highlightPalette[currentHighlight];
    return text.replace(/==(.+?)==/g, `<mark style="background-color: ${color};">$1</mark>`);
  };

  const formatLists = (text) => {
    const lines = text.split('\n');
    let result = [];
    let inList = false;

    lines.forEach((line) => {
      const match = line.match(/^[\s]*[-*→]\s+(.+)$/);
      if (match) {
        if (!inList) {
          result.push('<ul>');
          inList = true;
        }
        result.push(`<li>${match[1]}</li>`);
      } else {
        if (inList) {
          result.push('</ul>');
          inList = false;
        }
        result.push(line);
      }
    });

    if (inList) result.push('</ul>');
    return result.join('\n');
  };

  const formatParagraphs = (text) => {
    return text.split(/\n\s*\n/).map(para => {
      if (para.trim().startsWith('<')) return para;
      para = para.replace(/\n/g, '<br>');
      return `<p>${para}</p>`;
    }).join('\n');
  };

  // ========== VOICE RECOGNITION ==========
  
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
        setRawText(prev => prev + ' ' + transcript);
      };
    }
  };

  // ========== UTILITIES ==========
  
  const wrapSelection = (before, after) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = rawText.substring(start, end);
    if (selected) {
      const newText = rawText.substring(0, start) + before + selected + after + rawText.substring(end);
      setRawText(newText);
    }
  };

  const saveNote = () => {
    if (!rawText.trim()) {
      showNotification('Nothing to save!', 'warning');
      return;
    }
    const title = prompt('Note title:') || 'Untitled';
    const note = {
      id: Date.now(),
      title,
      rawContent: rawText,
      createdAt: new Date().toISOString(),
      folder: currentFolder,
      tags: currentNoteTags
    };
    const notes = [...savedNotes, note];
    setSavedNotes(notes);
    localStorage.setItem('notify_notes', JSON.stringify(notes));
    showNotification('✨ Note saved!', 'success');
  };

  const loadSavedNotes = () => {
    try {
      const notes = JSON.parse(localStorage.getItem('notify_notes') || '[]');
      setSavedNotes(notes);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('notify_settings');
      if (saved) setAutoFormatSettings(JSON.parse(saved));
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = (newSettings) => {
    setAutoFormatSettings(newSettings);
    localStorage.setItem('notify_settings', JSON.stringify(newSettings));
    showNotification('⚙️ Settings saved!', 'success');
  };

  const loadNote = (note) => {
    setRawText(note.rawContent);
    setCurrentFolder(note.folder || 'General');
    setCurrentNoteTags(note.tags || []);
    setShowSidebar(false);
    showNotification('✅ Note loaded!', 'success');
  };

  const deleteNote = (id) => {
    if (window.confirm('Delete this note?')) {
      const notes = savedNotes.filter(n => n.id !== id);
      setSavedNotes(notes);
      localStorage.setItem('notify_notes', JSON.stringify(notes));
      showNotification('🗑️ Deleted!', 'info');
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  const addTag = (tag) => {
    if (!currentNoteTags.includes(tag)) {
      setCurrentNoteTags([...currentNoteTags, tag]);
    }
  };

  const removeTag = (tag) => {
    setCurrentNoteTags(currentNoteTags.filter(t => t !== tag));
  };

  const searchNotes = (query) => {
    if (!query) return savedNotes;
    const lower = query.toLowerCase();
    return savedNotes.filter(note => 
      note.title.toLowerCase().includes(lower) ||
      note.rawContent.toLowerCase().includes(lower)
    );
  };

  const formatPomodoroTime = () => {
    const minutes = Math.floor(pomodoroTime / 60);
    const seconds = pomodoroTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // ========== RENDER ==========
  return (
    <div className={`app theme-${selectedTheme}`}>
      <header className="header">
        <div className="header-glow"></div>
        <h1 className="app-title">
          <span className="title-icon">✨</span>
          Notify
        </h1>
        <p className="app-subtitle">AI Voice Commands • Photo Scanner • Real Intelligence</p>
      </header>

      <nav className="main-nav">
        <button className={`nav-btn ${viewMode === 'editor' ? 'active' : ''}`} onClick={() => setViewMode('editor')}>
          <span className="nav-icon">✏️</span>
          Editor
        </button>
        <button className={`nav-btn ${showAIChat ? 'active' : ''}`} onClick={() => setShowAIChat(!showAIChat)}>
          <span className="nav-icon">💬</span>
          AI Chat
        </button>
        <button className={`nav-btn ${showPhotoScanner ? 'active' : ''}`} onClick={() => setShowPhotoScanner(!showPhotoScanner)}>
          <span className="nav-icon">📸</span>
          Scan Photo
        </button>
        <button className="nav-btn" onClick={() => setShowSettings(true)}>
          <span className="nav-icon">⚙️</span>
          Settings
        </button>
      </nav>

      {viewMode === 'editor' && (
        <main className="main-content">
          <section className="editor-section">
            <div className="section-header">
              <h2>Your Notes</h2>
              <div className="header-actions">
                <button className="btn-magic" onClick={applySmartFormatting}>
                  <span className="btn-sparkle">✨</span>
                  Make Aesthetic
                </button>
              </div>
            </div>

            {/* NEW: AI COMMAND BAR */}
            <div className="command-bar">
              <div className="command-controls">
                <button 
                  className={`btn-command ${isListeningCommand ? 'listening' : ''}`}
                  onClick={startCommandListening}
                >
                  <span className="command-icon">🎤</span>
                  {isListeningCommand ? 'Listening...' : 'Voice Command'}
                </button>
                
                <input
                  type="text"
                  placeholder="Or type a command: 'make this bigger', 'highlight important', etc."
                  className="command-input"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value) {
                      processAICommand(e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
              
              <div className="command-hints">
                <span className="hint">💡 Try: "make topics bigger" • "highlight key words" • "bold the definitions"</span>
              </div>
            </div>

            <div className="organization-bar">
              <select value={currentFolder} onChange={(e) => setCurrentFolder(e.target.value)} className="select-elegant">
                {folders.map(folder => (
                  <option key={folder}>{folder}</option>
                ))}
              </select>
              
              <button className="btn-tag" onClick={() => setShowTagManager(!showTagManager)}>
                🏷️ Tags ({currentNoteTags.length})
              </button>
              
              <button className="btn-photo" onClick={triggerPhotoUpload}>
                📸 Scan Photo
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
            </div>

            {showTagManager && (
              <div className="tag-manager">
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
                <div className="tag-list">
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
              placeholder="Type notes or scan a photo..."
              className="note-input"
            />

            <div className="toolbar">
              <button onClick={() => wrapSelection('**', '**')} className="tool-btn" title="Bold">
                <strong>B</strong>
              </button>
              <button onClick={() => wrapSelection('*', '*')} className="tool-btn" title="Italic">
                <em>I</em>
              </button>
              <button onClick={() => wrapSelection('==', '==')} className="tool-btn" title="Highlight">
                <mark>H</mark>
              </button>
              
              <div className="toolbar-divider"></div>
              
              <div className="color-swatches">
                {highlightPalette.map((color, i) => (
                  <button 
                    key={i} 
                    className={`swatch ${i === currentHighlight ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setCurrentHighlight(i)}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="preview-section">
            <div className="section-header">
              <h2>Preview</h2>
              <div className="header-actions">
                <button onClick={saveNote} className="btn-icon" title="Save">💾</button>
              </div>
            </div>
            <div className="preview-content" dangerouslySetInnerHTML={{ __html: formatText(rawText) }} />
          </section>
        </main>
      )}

      {/* AI CHAT PANEL */}
      {showAIChat && (
        <div className="ai-chat-panel">
          <div className="chat-header">
            <h3>✨ Claude AI</h3>
            <button onClick={() => setShowAIChat(false)} className="close-btn">×</button>
          </div>
          
          <div className="chat-messages">
            {chatMessages.length === 0 && (
              <div className="chat-welcome">
                <div className="welcome-icon">🤖</div>
                <h4>Hi! I'm Claude</h4>
                <p>Ask me anything about your notes</p>
                <p className="command-tip">💡 Use voice commands to format your notes!</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {isAIThinking && <div className="chat-message assistant thinking">Thinking...</div>}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && chatInput && sendMessageToAI(chatInput)}
              placeholder="Ask me anything..."
              className="chat-input"
            />
            <button onClick={() => chatInput && sendMessageToAI(chatInput)} className="btn-send">
              Send
            </button>
          </div>

          <div className="pomodoro-section">
            <button 
              onClick={() => pomodoroActive ? setPomodoroActive(false) : (setPomodoroActive(true), setPomodoroTime(25 * 60))} 
              className={`btn-pomodoro ${pomodoroActive ? 'active' : ''}`}
            >
              {pomodoroActive ? `⏸️ ${formatPomodoroTime()}` : '⏱️ Pomodoro'}
            </button>
          </div>
        </div>
      )}

      {/* PHOTO SCANNER MODAL */}
      {showPhotoScanner && (
        <div className="modal-overlay">
          <div className="modal scanner-modal">
            <div className="modal-header">
              <h2>📸 Photo Scanner</h2>
              <button onClick={() => setShowPhotoScanner(false)} className="close-btn">×</button>
            </div>
            <div className="modal-content">
              {isScanning ? (
                <div className="scanning-status">
                  <div className="scan-spinner"></div>
                  <p>Scanning your image...</p>
                </div>
              ) : (
                <div className="scanner-content">
                  <div className="scanner-instructions">
                    <h3>📷 Upload Photos to Extract Text</h3>
                    <ul>
                      <li>✅ Handwritten notes</li>
                      <li>✅ Printed documents</li>
                      <li>✅ Textbooks & papers</li>
                      <li>✅ Multiple images at once</li>
                    </ul>
                  </div>
                  
                  <button className="btn-upload-large" onClick={triggerPhotoUpload}>
                    <span className="upload-icon">📸</span>
                    Choose Images to Scan
                  </button>

                  {scannedImages.length > 0 && (
                    <div className="scanned-images">
                      <h4>Recently Scanned:</h4>
                      {scannedImages.map((img, i) => (
                        <div key={i} className="scanned-item">
                          <img src={img.url} alt={`Scan ${i + 1}`} />
                          <p className="scanned-text">{img.text.substring(0, 100)}...</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS */}
      {showSettings && (
        <div className="modal-overlay">
          <div className="modal settings-modal">
            <div className="modal-header">
              <h2>⚙️ Format Settings</h2>
              <button onClick={() => setShowSettings(false)} className="close-btn">×</button>
            </div>
            <div className="modal-content">
              <div className="settings-list">
                {Object.entries({
                  enhanceTopics: 'Enhance Main Topics',
                  enhanceSubtopics: 'Format Subtopics',
                  highlightKeywords: 'Highlight Keywords',
                  formatDefinitions: 'Format Definitions',
                  detectQuestions: 'Detect Questions',
                  addIcons: 'Add Icons',
                  improveSpacing: 'Improve Spacing',
                  colorCode: 'Color Code'
                }).map(([key, label]) => (
                  <label key={key} className="setting-item">
                    <input
                      type="checkbox"
                      checked={autoFormatSettings[key]}
                      onChange={(e) => saveSettings({ ...autoFormatSettings, [key]: e.target.checked })}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <button className="btn-apply" onClick={() => { applySmartFormatting(); setShowSettings(false); }}>
                Apply & Format
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${showSidebar ? 'active' : ''}`}>
        <div className="sidebar-header">
          <h3>Saved Notes</h3>
          <button onClick={() => setShowSidebar(false)} className="close-btn">×</button>
        </div>
        
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Search..."
          className="search-input"
        />

        <div className="notes-list">
          {(searchQuery ? searchNotes(searchQuery) : savedNotes).slice().reverse().map(note => (
            <div key={note.id} className="note-item">
              <h4>{note.title}</h4>
              <p className="note-date">{formatDate(note.createdAt)}</p>
              <div className="note-actions">
                <button onClick={() => loadNote(note)} className="btn-sm">Load</button>
                <button onClick={() => deleteNote(note.id)} className="btn-sm btn-danger">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <button onClick={() => setShowSidebar(!showSidebar)} className="fab">
        📚 {savedNotes.length}
      </button>

      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

export default App;