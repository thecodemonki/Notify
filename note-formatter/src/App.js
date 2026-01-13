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
  
  // STAGE 1-5: Previous features
  const [selectedTheme, setSelectedTheme] = useState('warm');
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [highlightPalette, setHighlightPalette] = useState([
    '#ffeb3b', '#ffd4d4', '#d4e4ff', '#d4ffd4', '#ffe4cc'
  ]);
  const [currentHighlight, setCurrentHighlight] = useState(0);
  const [showDiagramView, setShowDiagramView] = useState(false);
  const [diagramType, setDiagramType] = useState('flowchart');
  const [showMindMap, setShowMindMap] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [viewMode, setViewMode] = useState('editor');
  const [currentPage, setCurrentPage] = useState(0);
  const [journeyProgress, setJourneyProgress] = useState(0);
  const [journeyPaused, setJourneyPaused] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);

  // STAGE 6: Smart Auto-Formatting Settings
  const [showSettings, setShowSettings] = useState(false);
  const [autoFormatSettings, setAutoFormatSettings] = useState({
    enhanceTopics: true,        // Main topics → bigger/bolder
    enhanceSubtopics: true,     // Subtopics → indented with →
    highlightKeywords: true,    // Important words → highlighted
    formatDefinitions: true,    // "Word: definition" → special format
    detectQuestions: true,      // Questions → special format
    addIcons: true,            // Add icons (!, ?, ✓)
    improveSpacing: true,      // Better line spacing
    colorCode: true            // Color-code by importance
  });

  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  // ========== LOAD SAVED NOTES & SETTINGS ==========
  useEffect(() => {
    loadSavedNotes();
    loadSettings();
    initializeVoiceRecognition();
  }, []);

  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('noteFormatter_settings');
      if (saved) {
        setAutoFormatSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = (newSettings) => {
    setAutoFormatSettings(newSettings);
    localStorage.setItem('noteFormatter_settings', JSON.stringify(newSettings));
    showNotification('⚙️ Settings saved!', 'success');
  };

  // ========== STAGE 6: SMART AUTO-FORMATTING ==========
  
  const applySmartFormatting = () => {
    let formatted = rawText;
    
    if (!formatted.trim()) {
      showNotification('⚠️ Nothing to format!', 'warning');
      return;
    }

    // Apply each enabled transformation
    if (autoFormatSettings.enhanceTopics) {
      formatted = enhanceMainTopics(formatted);
    }
    
    if (autoFormatSettings.enhanceSubtopics) {
      formatted = enhanceSubtopics(formatted);
    }
    
    if (autoFormatSettings.highlightKeywords) {
      formatted = highlightImportantKeywords(formatted);
    }
    
    if (autoFormatSettings.formatDefinitions) {
      formatted = formatDefinitions(formatted);
    }
    
    if (autoFormatSettings.detectQuestions) {
      formatted = formatQuestions(formatted);
    }
    
    if (autoFormatSettings.addIcons) {
      formatted = addContextualIcons(formatted);
    }
    
    if (autoFormatSettings.improveSpacing) {
      formatted = improveSpacing(formatted);
    }
    
    if (autoFormatSettings.colorCode) {
      formatted = addColorCoding(formatted);
    }

    setRawText(formatted);
    showNotification('✨ Notes formatted beautifully!', 'success');
  };

  // Auto-formatting functions

  const enhanceMainTopics = (text) => {
    const lines = text.split('\n');
    const formatted = lines.map(line => {
      // Detect main topics (all caps, or short lines with important words)
      if (line.length > 0 && line.length < 50) {
        const upper = line.toUpperCase();
        if (line === upper && !line.startsWith('#')) {
          // All caps → make it a heading
          return `# ${line}`;
        }
        
        // Lines with key topic words
        const topicWords = ['chapter', 'unit', 'section', 'overview', 'introduction', 'summary'];
        const lowerLine = line.toLowerCase();
        if (topicWords.some(word => lowerLine.includes(word)) && !line.startsWith('#')) {
          return `# ${line}`;
        }
      }
      return line;
    });
    return formatted.join('\n');
  };

  const enhanceSubtopics = (text) => {
    const lines = text.split('\n');
    const formatted = [];
    let inList = false;
    
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      
      // Skip if already formatted
      if (trimmed.startsWith('#') || trimmed.startsWith('-') || trimmed.startsWith('*') || 
          trimmed.startsWith('→') || trimmed.startsWith('•')) {
        formatted.push(line);
        return;
      }
      
      // Check if this looks like a subtopic
      const prevLine = i > 0 ? lines[i - 1].trim() : '';
      const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
      
      // If previous line is a heading and this is short text
      if (prevLine.startsWith('#') && trimmed.length > 0 && trimmed.length < 60) {
        formatted.push(`  → ${trimmed}`);
        inList = true;
      }
      // If we're in a list context
      else if (inList && trimmed.length > 0 && trimmed.length < 60 && !nextLine.startsWith('#')) {
        formatted.push(`  → ${trimmed}`);
      }
      else {
        formatted.push(line);
        if (trimmed.length === 0) inList = false;
      }
    });
    
    return formatted.join('\n');
  };

  const highlightImportantKeywords = (text) => {
    // Keywords that should be highlighted
    const keywords = [
      'important', 'crucial', 'essential', 'key', 'critical', 'vital',
      'remember', 'note', 'warning', 'caution', 'attention',
      'always', 'never', 'must', 'required', 'mandatory',
      'exam', 'test', 'quiz', 'assignment', 'due',
      'main', 'primary', 'principal', 'major', 'fundamental'
    ];
    
    let formatted = text;
    keywords.forEach(keyword => {
      // Only highlight if not already formatted
      const regex = new RegExp(`\\b(${keyword})\\b(?![^<]*>|[^<>]*</)`, 'gi');
      formatted = formatted.replace(regex, (match) => {
        // Check if already in special formatting
        if (formatted.indexOf(`==${match}==`) !== -1 || 
            formatted.indexOf(`**${match}**`) !== -1) {
          return match;
        }
        return `==${match}==`;
      });
    });
    
    return formatted;
  };

  const formatDefinitions = (text) => {
    const lines = text.split('\n');
    const formatted = lines.map(line => {
      // Detect definition pattern: "Word: definition" or "Term - definition"
      const colonMatch = line.match(/^([^:]{2,30}):\s*(.+)$/);
      const dashMatch = line.match(/^([^-]{2,30})\s*-\s*(.+)$/);
      
      if (colonMatch && !line.startsWith('#')) {
        const [, term, definition] = colonMatch;
        return `**${term.trim()}**: *${definition.trim()}*`;
      }
      
      if (dashMatch && !line.startsWith('#')) {
        const [, term, definition] = dashMatch;
        return `**${term.trim()}**: *${definition.trim()}*`;
      }
      
      return line;
    });
    
    return formatted.join('\n');
  };

  const formatQuestions = (text) => {
    const lines = text.split('\n');
    const formatted = lines.map(line => {
      const trimmed = line.trim();
      
      // Detect questions
      if (trimmed.endsWith('?') && !trimmed.startsWith('[?]')) {
        return `[?] ${trimmed}`;
      }
      
      return line;
    });
    
    return formatted.join('\n');
  };

  const addContextualIcons = (text) => {
    let formatted = text;
    
    // Add icons based on context
    const patterns = [
      { regex: /\b(complete|completed|done|finished)\b/gi, icon: '[x]' },
      { regex: /\b(important|critical|crucial|vital)\b/gi, icon: '[!]' },
      { regex: /\b(question|unclear|confused|help)\b/gi, icon: '[?]' },
      { regex: /\b(excellent|great|perfect|amazing)\b/gi, icon: '[*]' }
    ];
    
    const lines = formatted.split('\n');
    const result = lines.map(line => {
      let modifiedLine = line;
      
      // Don't add icons if line already has them
      if (line.includes('[x]') || line.includes('[!]') || 
          line.includes('[?]') || line.includes('[*]')) {
        return line;
      }
      
      // Check each pattern
      for (const pattern of patterns) {
        if (pattern.regex.test(line)) {
          modifiedLine = `${pattern.icon} ${line}`;
          break; // Only add one icon per line
        }
      }
      
      return modifiedLine;
    });
    
    return result.join('\n');
  };

  const improveSpacing = (text) => {
    let formatted = text;
    
    // Add space after headings
    formatted = formatted.replace(/(^#{1,3}\s+.+$)/gm, '$1\n');
    
    // Add space before headings
    formatted = formatted.replace(/([^\n])\n(#{1,3}\s+)/gm, '$1\n\n$2');
    
    // Ensure lists have proper spacing
    formatted = formatted.replace(/([^\n])\n([→•\-\*]\s+)/gm, '$1\n\n$2');
    
    // Clean up multiple blank lines
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    
    return formatted;
  };

  const addColorCoding = (text) => {
    const lines = text.split('\n');
    const formatted = lines.map(line => {
      // Skip already formatted lines
      if (line.includes('[box]') || line.includes('[note]') || 
          line.includes('[tip]') || line.includes('[warning]')) {
        return line;
      }
      
      const lower = line.toLowerCase();
      
      // Warnings/Important
      if (lower.includes('warning') || lower.includes('danger') || 
          lower.includes('caution') || lower.includes('exam') || lower.includes('test')) {
        return `[warning]${line}[/warning]`;
      }
      
      // Tips/Helpful
      if (lower.includes('tip') || lower.includes('hint') || 
          lower.includes('remember') || lower.includes('note that')) {
        return `[tip]${line}[/tip]`;
      }
      
      // Examples
      if (lower.includes('example') || lower.includes('for instance') || 
          lower.includes('such as')) {
        return `[note]${line}[/note]`;
      }
      
      return line;
    });
    
    return formatted.join('\n');
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
        setVoiceTranscript(transcript);
        processVoiceCommand(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
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
    
    if (lower.includes('make aesthetic') || lower.includes('format notes')) {
      applySmartFormatting();
    } else if (lower.includes('bigger') || lower.includes('larger')) {
      setFontSize('large');
      showNotification('✅ Font size increased', 'success');
    } else if (lower.includes('smaller')) {
      setFontSize('small');
      showNotification('✅ Font size decreased', 'success');
    } else if (lower.includes('settings')) {
      setShowSettings(true);
      showNotification('⚙️ Opening settings', 'info');
    } else if (lower.includes('highlight')) {
      wrapSelection('==', '==');
    } else if (lower.includes('bold')) {
      wrapSelection('**', '**');
    } else if (lower.includes('save')) {
      saveNote();
    } else if (lower.includes('journey')) {
      setViewMode('journey');
    }
  };

  // ========== FORMATTING ENGINE (from previous stages) ==========
  const formatText = (text) => {
    if (!text.trim()) {
      return '<p class="preview-placeholder">Your formatted notes will appear here...</p>';
    }

    let formatted = text;

    if (selectedTemplate === 'cornell') {
      formatted = formatCornellNotes(formatted);
    } else if (selectedTemplate === 'outline') {
      formatted = formatOutlineStyle(formatted);
    } else if (selectedTemplate === 'flashcard') {
      formatted = formatFlashcards(formatted);
    }

    formatted = formatHeadings(formatted);
    formatted = formatBold(formatted);
    formatted = formatItalic(formatted);
    formatted = formatUnderline(formatted);
    formatted = formatHighlights(formatted);
    formatted = formatSymbols(formatted);
    formatted = formatBoxes(formatted);
    formatted = formatLists(formatted);
    formatted = formatParagraphs(formatted);

    return `<div class="formatted-content size-${fontSize} theme-${selectedTheme} template-${selectedTemplate}">${formatted}</div>`;
  };

  const formatSymbols = (text) => {
    text = text.replace(/->|→/g, '<span class="arrow">→</span>');
    text = text.replace(/<-|←/g, '<span class="arrow">←</span>');
    text = text.replace(/\^|↑/g, '<span class="arrow">↑</span>');
    text = text.replace(/v|↓/g, '<span class="arrow-down">↓</span>');
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

  const formatCornellNotes = (text) => {
    const lines = text.split('\n');
    let result = '<div class="cornell-layout"><div class="cornell-cue">📌 Cues</div><div class="cornell-notes"><div class="cornell-main">';
    lines.forEach(line => {
      if (line.startsWith('Q:')) {
        result += `<div class="cornell-question">${line.substring(2)}</div>`;
      } else if (line.startsWith('A:')) {
        result += `<div class="cornell-answer">${line.substring(2)}</div>`;
      } else {
        result += `<div>${line}</div>`;
      }
    });
    result += '</div></div><div class="cornell-summary">📝 Summary</div></div>';
    return result;
  };

  const formatOutlineStyle = (text) => {
    let formatted = text;
    formatted = formatted.replace(/^I\.\s+(.+)$/gm, '<div class="outline-level-1">I. $1</div>');
    formatted = formatted.replace(/^\s+A\.\s+(.+)$/gm, '<div class="outline-level-2">A. $1</div>');
    formatted = formatted.replace(/^\s+1\.\s+(.+)$/gm, '<div class="outline-level-3">1. $1</div>');
    return formatted;
  };

  const formatFlashcards = (text) => {
    const cards = text.split('---');
    let result = '<div class="flashcard-grid">';
    cards.forEach((card, i) => {
      const [front, back] = card.split('::');
      if (front && back) {
        result += `<div class="flashcard"><div class="flashcard-front">${front.trim()}</div><div class="flashcard-back">${back.trim()}</div></div>`;
      }
    });
    result += '</div>';
    return result;
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

  // [Previous Stage 2-5 functions: generateDiagram, generateMindMapData, startJourney, etc.]
  // [Keeping them but truncating here for brevity - they remain the same]

  const generateDiagram = () => {
    const lines = rawText.split('\n').filter(l => l.trim());
    let mermaidCode = '';
    if (diagramType === 'flowchart') {
      mermaidCode = 'graph TD\n';
      lines.forEach((line, i) => {
        const clean = line.replace(/[#*\-=]/g, '').trim();
        if (clean) {
          mermaidCode += `  A${i}["${clean}"]\n`;
          if (i > 0) mermaidCode += `  A${i-1} --> A${i}\n`;
        }
      });
    }
    return mermaidCode;
  };

  const generateMindMapData = () => {
    const lines = rawText.split('\n');
    const nodes = [];
    const edges = [];
    let nodeId = 0;
    lines.forEach((line, i) => {
      if (line.trim()) {
        const level = line.search(/\S/);
        const text = line.trim().replace(/[#*\-]/g, '').trim();
        nodes.push({
          id: `node-${nodeId}`,
          label: text,
          level: Math.floor(level / 2),
          x: 100 + (Math.floor(level / 2) * 200),
          y: 50 + (nodeId * 80)
        });
        if (nodeId > 0 && level > 0) {
          edges.push({ from: `node-${nodeId - 1}`, to: `node-${nodeId}` });
        }
        nodeId++;
      }
    });
    return { nodes, edges };
  };

  const startJourney = () => {
    setViewMode('journey');
    setJourneyProgress(0);
    setJourneyPaused(false);
    showNotification('🚀 Journey started!', 'success');
  };

  // [Other functions: wrapSelection, saveNote, loadNote, etc. remain the same]

  const wrapSelection = (before, after) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = rawText.substring(start, end);
    if (selectedText) {
      const newText = rawText.substring(0, start) + before + selectedText + after + rawText.substring(end);
      setRawText(newText);
      setTimeout(() => {
        textarea.focus();
        const newPos = start + before.length + selectedText.length + after.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
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
      template: selectedTemplate
    };
    const notes = [...savedNotes, note];
    setSavedNotes(notes);
    localStorage.setItem('noteFormatter_savedNotes', JSON.stringify(notes));
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

  const loadNote = (note) => {
    setRawText(note.rawContent);
    setSelectedTheme(note.theme || 'warm');
    setSelectedTemplate(note.template || 'default');
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const splitIntoPages = () => rawText.split(/\n\s*\n/);
  const nextPage = () => { if (currentPage < splitIntoPages().length - 1) setCurrentPage(currentPage + 1); };
  const prevPage = () => { if (currentPage > 0) setCurrentPage(currentPage - 1); };

  // ========== RENDER ==========
  return (
    <div className={`app theme-${selectedTheme}`}>
      <header className="header">
        <h1>✨ Note Formatter Pro</h1>
        <p>Smart Auto-Formatting • Visual Tools • Voice Control • Journey Mode</p>
      </header>

      <div className="view-mode-switcher">
        <button className={`mode-btn ${viewMode === 'editor' ? 'active' : ''}`} onClick={() => setViewMode('editor')}>
          ✏️ Editor
        </button>
        <button className={`mode-btn ${viewMode === 'book' ? 'active' : ''}`} onClick={() => setViewMode('book')}>
          📖 Book View
        </button>
        <button className={`mode-btn ${viewMode === 'journey' ? 'active' : ''}`} onClick={() => startJourney()}>
          🚀 Journey Mode
        </button>
        <button className={`mode-btn ${showDiagramView ? 'active' : ''}`} onClick={() => setShowDiagramView(!showDiagramView)}>
          📊 Diagrams
        </button>
        <button className={`mode-btn ${showMindMap ? 'active' : ''}`} onClick={() => setShowMindMap(!showMindMap)}>
          🧠 Mind Map
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
                <button className="btn btn-magic" onClick={applySmartFormatting} title="Smart Auto-Format">
                  ✨ Make Aesthetic
                </button>
                <button className={`btn btn-voice ${isListening ? 'listening' : ''}`} onClick={toggleVoiceInput}>
                  🎤 {isListening ? 'Listening...' : 'Voice'}
                </button>
                <button onClick={() => setRawText('')} className="btn btn-secondary">
                  Clear
                </button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Type your notes here...

✨ NEW: Click "Make Aesthetic" to auto-format!

Or use:
→ Arrows: -> <- ^ v
📦 Boxes: [box]content[/box]
🎨 Symbols: [!] [x] [?] [*]`}
              className="note-input"
            />

            <div className="toolbar-enhanced">
              <div className="toolbar-section">
                <h4>Format</h4>
                <button onClick={() => wrapSelection('**', '**')} className="tool-btn"><strong>B</strong></button>
                <button onClick={() => wrapSelection('*', '*')} className="tool-btn"><em>I</em></button>
                <button onClick={() => wrapSelection('__', '__')} className="tool-btn"><u>U</u></button>
                <button onClick={() => wrapSelection('==', '==')} className="tool-btn"><mark>H</mark></button>
              </div>

              <div className="toolbar-section">
                <h4>Symbols</h4>
                <button onClick={() => insertSymbol(' → ')} className="tool-btn">→</button>
                <button onClick={() => insertSymbol(' ← ')} className="tool-btn">←</button>
                <button onClick={() => insertSymbol(' [!] ')} className="tool-btn">⚠️</button>
                <button onClick={() => insertSymbol(' [x] ')} className="tool-btn">✓</button>
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
                <h4>Size</h4>
                <select value={fontSize} onChange={(e) => setFontSize(e.target.value)}>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="xlarge">X-Large</option>
                </select>
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

              <div className="toolbar-section">
                <h4>Template</h4>
                <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                  <option value="default">Default</option>
                  <option value="cornell">Cornell Notes</option>
                  <option value="outline">Outline</option>
                  <option value="flashcard">Flashcards</option>
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

      {/* STAGE 6: SETTINGS MODAL */}
      {showSettings && (
        <div className="settings-overlay">
          <div className="settings-modal">
            <div className="settings-header">
              <h2>⚙️ Smart Formatting Settings</h2>
              <button onClick={() => setShowSettings(false)} className="close-btn">✕</button>
            </div>

            <div className="settings-content">
              <p className="settings-description">
                Choose which automatic transformations to apply when you click "✨ Make Aesthetic"
              </p>

              <div className="settings-grid">
                <div className="setting-item">
                  <label className="setting-label">
                    <input type="checkbox" checked={autoFormatSettings.enhanceTopics}
                      onChange={(e) => saveSettings({...autoFormatSettings, enhanceTopics: e.target.checked})} />
                    <div className="setting-info">
                      <h4>📏 Enhance Main Topics</h4>
                      <p>Detect and convert main topics to larger, bold headings</p>
                      <span className="example">Example: "PHOTOSYNTHESIS" → # PHOTOSYNTHESIS</span>
                    </div>
                  </label>
                </div>

                <div className="setting-item">
                  <label className="setting-label">
                    <input type="checkbox" checked={autoFormatSettings.enhanceSubtopics}
                      onChange={(e) => saveSettings({...autoFormatSettings, enhanceSubtopics: e.target.checked})} />
                    <div className="setting-info">
                      <h4>→ Format Subtopics</h4>
                      <p>Add arrows (→) or bullets to subtopics under headings</p>
                      <span className="example">Example: "Cell structure" → → Cell structure</span>
                    </div>
                  </label>
                </div>

                <div className="setting-item">
                  <label className="setting-label">
                    <input type="checkbox" checked={autoFormatSettings.highlightKeywords}
                      onChange={(e) => saveSettings({...autoFormatSettings, highlightKeywords: e.target.checked})} />
                    <div className="setting-info">
                      <h4>🎨 Highlight Keywords</h4>
                      <p>Auto-highlight important words (important, key, essential, etc.)</p>
                      <span className="example">Example: "This is important" → This is ==important==</span>
                    </div>
                  </label>
                </div>

                <div className="setting-item">
                  <label className="setting-label">
                    <input type="checkbox" checked={autoFormatSettings.formatDefinitions}
                      onChange={(e) => saveSettings({...autoFormatSettings, formatDefinitions: e.target.checked})} />
                    <div className="setting-info">
                      <h4>📖 Format Definitions</h4>
                      <p>Convert "Term: definition" into bold term with italic definition</p>
                      <span className="example">Example: "Atom: smallest unit" → **Atom**: *smallest unit*</span>
                    </div>
                  </label>
                </div>

                <div className="setting-item">
                  <label className="setting-label">
                    <input type="checkbox" checked={autoFormatSettings.detectQuestions}
                      onChange={(e) => saveSettings({...autoFormatSettings, detectQuestions: e.target.checked})} />
                    <div className="setting-info">
                      <h4>❓ Detect Questions</h4>
                      <p>Add question icons to sentences ending with ?</p>
                      <span className="example">Example: "What is DNA?" → [?] What is DNA?</span>
                    </div>
                  </label>
                </div>

                <div className="setting-item">
                  <label className="setting-label">
                    <input type="checkbox" checked={autoFormatSettings.addIcons}
                      onChange={(e) => saveSettings({...autoFormatSettings, addIcons: e.target.checked})} />
                    <div className="setting-info">
                      <h4>🎭 Add Context Icons</h4>
                      <p>Add icons based on content (✓ for completed, ⚠️ for important, etc.)</p>
                      <span className="example">Example: "Task completed" → [x] Task completed</span>
                    </div>
                  </label>
                </div>

                <div className="setting-item">
                  <label className="setting-label">
                    <input type="checkbox" checked={autoFormatSettings.improveSpacing}
                      onChange={(e) => saveSettings({...autoFormatSettings, improveSpacing: e.target.checked})} />
                    <div className="setting-info">
                      <h4>📏 Improve Spacing</h4>
                      <p>Add proper spacing around headings and sections for better readability</p>
                      <span className="example">Adds blank lines before/after headings automatically</span>
                    </div>
                  </label>
                </div>

                <div className="setting-item">
                  <label className="setting-label">
                    <input type="checkbox" checked={autoFormatSettings.colorCode}
                      onChange={(e) => saveSettings({...autoFormatSettings, colorCode: e.target.checked})} />
                    <div className="setting-info">
                      <h4>🎨 Color-Code Content</h4>
                      <p>Wrap content in colored boxes based on keywords (warning, tip, example)</p>
                      <span className="example">Example: "Warning: Study this" → [warning]...[/warning]</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="settings-footer">
                <button className="btn btn-primary" onClick={() => {
                  applySmartFormatting();
                  setShowSettings(false);
                }}>
                  ✨ Apply & Format Now
                </button>
                <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book View, Journey, Diagrams, Mind Map - same as before */}
      {viewMode === 'book' && (
        <div className="book-view">
          <div className="book-container">
            <div className="book-page">
              <div className="page-content" dangerouslySetInnerHTML={{ __html: formatText(splitIntoPages()[currentPage] || '') }} />
              <div className="page-number">Page {currentPage + 1} of {splitIntoPages().length}</div>
            </div>
            <div className="book-controls">
              <button onClick={prevPage} disabled={currentPage === 0} className="btn btn-primary">← Previous</button>
              <button onClick={nextPage} disabled={currentPage >= splitIntoPages().length - 1} className="btn btn-primary">Next →</button>
            </div>
          </div>
        </div>
      )}

      {showDiagramView && (
        <div className="diagram-overlay">
          <div className="diagram-container">
            <div className="diagram-header">
              <h2>📊 Visual Diagram</h2>
              <select value={diagramType} onChange={(e) => setDiagramType(e.target.value)}>
                <option value="flowchart">Flowchart</option>
                <option value="mindmap">Mind Map</option>
              </select>
              <button onClick={() => setShowDiagramView(false)} className="btn btn-secondary">✕</button>
            </div>
            <div className="diagram-content">
              <pre className="mermaid-code">{generateDiagram()}</pre>
              <p className="diagram-info">
                💡 Copy this code to <a href="https://mermaid.live" target="_blank" rel="noopener noreferrer">Mermaid Live</a> to visualize!
              </p>
            </div>
          </div>
        </div>
      )}

      {showMindMap && (
        <div className="mindmap-overlay">
          <div className="mindmap-container">
            <div className="mindmap-header">
              <h2>🧠 Mind Map</h2>
              <button onClick={() => setShowMindMap(false)} className="btn btn-secondary">✕</button>
            </div>
            <svg className="mindmap-svg" width="100%" height="600">
              {generateMindMapData().nodes.map((node) => (
                <g key={node.id}>
                  <circle cx={node.x} cy={node.y} r="30" fill="#d4a574" />
                  <text x={node.x} y={node.y} textAnchor="middle" dy=".3em" fill="white" fontSize="12">
                    {node.label.substring(0, 10)}
                  </text>
                </g>
              ))}
              {generateMindMapData().edges.map((edge, i) => {
                const fromNode = generateMindMapData().nodes.find(n => n.id === edge.from);
                const toNode = generateMindMapData().nodes.find(n => n.id === edge.to);
                return fromNode && toNode ? (
                  <line key={i} x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y}
                    stroke="#8b6f47" strokeWidth="2" />
                ) : null;
              })}
            </svg>
          </div>
        </div>
      )}

      <aside className={`saved-notes-sidebar ${showSidebar ? 'active' : ''}`}>
        <div className="sidebar-header">
          <h3>Saved Notes</h3>
          <button onClick={() => setShowSidebar(false)} className="close-btn">✕</button>
        </div>
        <div className="saved-notes-list">
          {savedNotes.length === 0 ? (
            <p className="no-notes">No saved notes yet</p>
          ) : (
            savedNotes.slice().reverse().map((note) => (
              <div key={note.id} className="saved-note-item">
                <h4>{note.title}</h4>
                <p className="note-date">{formatDate(note.createdAt)}</p>
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
        📚 Saved ({savedNotes.length})
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