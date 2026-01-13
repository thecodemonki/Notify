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
  
  // STAGE 1: Enhanced Formatting
  const [selectedTheme, setSelectedTheme] = useState('warm');
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [highlightPalette, setHighlightPalette] = useState([
    '#ffeb3b', '#ffd4d4', '#d4e4ff', '#d4ffd4', '#ffe4cc'
  ]);
  const [currentHighlight, setCurrentHighlight] = useState(0);
  
  // STAGE 2: Visual Depictions
  const [showDiagramView, setShowDiagramView] = useState(false);
  const [diagramType, setDiagramType] = useState('flowchart');
  
  // STAGE 3: Mind Map
  const [showMindMap, setShowMindMap] = useState(false);
  
  // STAGE 4: Voice Input
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  
  // STAGE 5: Book/Journey Mode
  const [viewMode, setViewMode] = useState('editor'); // 'editor', 'book', 'journey'
  const [currentPage, setCurrentPage] = useState(0);
  const [journeyProgress, setJourneyProgress] = useState(0);
  const [journeyPaused, setJourneyPaused] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);

  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  // ========== LOAD SAVED NOTES ==========
  useEffect(() => {
    loadSavedNotes();
    initializeVoiceRecognition();
  }, []);

  // ========== STAGE 4: VOICE RECOGNITION SETUP ==========
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
      showNotification('🎤 Listening... Try: "Make this bigger" or "Highlight this"', 'info');
    }
  };

  const processVoiceCommand = (command) => {
    const lower = command.toLowerCase();
    
    if (lower.includes('bigger') || lower.includes('larger')) {
      setFontSize('large');
      showNotification('✅ Font size increased', 'success');
    } else if (lower.includes('smaller')) {
      setFontSize('small');
      showNotification('✅ Font size decreased', 'success');
    } else if (lower.includes('highlight')) {
      const selection = window.getSelection().toString();
      if (selection) {
        wrapSelection('==', '==');
        showNotification('✅ Text highlighted', 'success');
      }
    } else if (lower.includes('bold')) {
      wrapSelection('**', '**');
      showNotification('✅ Text bolded', 'success');
    } else if (lower.includes('save')) {
      saveNote();
    } else if (lower.includes('journey')) {
      setViewMode('journey');
      showNotification('✅ Journey mode activated', 'success');
    }
  };

  // ========== FORMATTING ENGINE ==========
  const formatText = (text) => {
    if (!text.trim()) {
      return '<p class="preview-placeholder">Your formatted notes will appear here...</p>';
    }

    let formatted = text;

    // Apply template-specific formatting
    if (selectedTemplate === 'cornell') {
      formatted = formatCornellNotes(formatted);
    } else if (selectedTemplate === 'outline') {
      formatted = formatOutlineStyle(formatted);
    } else if (selectedTemplate === 'flashcard') {
      formatted = formatFlashcards(formatted);
    }

    // Standard formatting
    formatted = formatHeadings(formatted);
    formatted = formatBold(formatted);
    formatted = formatItalic(formatted);
    formatted = formatUnderline(formatted);
    formatted = formatHighlights(formatted);
    formatted = formatSymbols(formatted); // STAGE 1: Arrows and symbols
    formatted = formatBoxes(formatted); // STAGE 1: Section boxes
    formatted = formatLists(formatted);
    formatted = formatParagraphs(formatted);

    return `<div class="formatted-content size-${fontSize} theme-${selectedTheme} template-${selectedTemplate}">${formatted}</div>`;
  };

  // ========== STAGE 1: ENHANCED FORMATTING ==========
  const formatSymbols = (text) => {
    // Convert text arrows to Unicode arrows
    text = text.replace(/->|→/g, '<span class="arrow">→</span>');
    text = text.replace(/<-|←/g, '<span class="arrow">←</span>');
    text = text.replace(/\^|↑/g, '<span class="arrow">↑</span>');
    text = text.replace(/v|↓/g, '<span class="arrow-down">↓</span>');
    
    // Special symbols
    text = text.replace(/\[!\]/g, '<span class="symbol-important">⚠️</span>');
    text = text.replace(/\[x\]/g, '<span class="symbol-done">✓</span>');
    text = text.replace(/\[\?\]/g, '<span class="symbol-question">❓</span>');
    text = text.replace(/\[\*\]/g, '<span class="symbol-star">⭐</span>');
    
    return text;
  };

  const formatBoxes = (text) => {
    // Format boxed sections: [box]content[/box]
    text = text.replace(/\[box\]([\s\S]*?)\[\/box\]/g, '<div class="content-box">$1</div>');
    text = text.replace(/\[note\]([\s\S]*?)\[\/note\]/g, '<div class="content-note">📝 $1</div>');
    text = text.replace(/\[warning\]([\s\S]*?)\[\/warning\]/g, '<div class="content-warning">⚠️ $1</div>');
    text = text.replace(/\[tip\]([\s\S]*?)\[\/tip\]/g, '<div class="content-tip">💡 $1</div>');
    
    return text;
  };

  // Template formatters
  const formatCornellNotes = (text) => {
    const lines = text.split('\n');
    let result = '<div class="cornell-layout">';
    result += '<div class="cornell-cue">📌 Cues</div>';
    result += '<div class="cornell-notes"><div class="cornell-main">';
    
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
        result += `
          <div class="flashcard">
            <div class="flashcard-front">${front.trim()}</div>
            <div class="flashcard-back">${back.trim()}</div>
          </div>`;
      }
    });
    result += '</div>';
    return result;
  };

  // Standard formatters
  const formatHeadings = (text) => {
    text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    return text;
  };

  const formatBold = (text) => {
    return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  };

  const formatItalic = (text) => {
    return text.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, '<em>$1</em>');
  };

  const formatUnderline = (text) => {
    return text.replace(/__(.+?)__/g, '<u>$1</u>');
  };

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
      const bulletMatch = line.match(/^[\s]*[-*]\s+(.+)$/);
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

  // ========== STAGE 2: DIAGRAM GENERATION ==========
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
    } else if (diagramType === 'mindmap') {
      mermaidCode = 'mindmap\n  root((Study Notes))\n';
      lines.forEach(line => {
        if (line.startsWith('#')) {
          mermaidCode += `    ${line.replace(/^#+\s*/, '')}\n`;
        } else if (line.startsWith('-')) {
          mermaidCode += `      ${line.replace(/^-\s*/, '')}\n`;
        }
      });
    }

    return mermaidCode;
  };

  // ========== STAGE 3: MIND MAP GENERATION ==========
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
          edges.push({
            from: `node-${nodeId - 1}`,
            to: `node-${nodeId}`
          });
        }

        nodeId++;
      }
    });

    return { nodes, edges };
  };

  // ========== STAGE 5: JOURNEY MODE ==========
  const startJourney = () => {
    setViewMode('journey');
    setJourneyProgress(0);
    setJourneyPaused(false);
    
    // Auto-scroll through content
    const sections = rawText.split(/\n\s*\n/);
    let currentSection = 0;

    const journeyInterval = setInterval(() => {
      if (!journeyPaused) {
        currentSection++;
        setJourneyProgress((currentSection / sections.length) * 100);

        // Randomly pause for quiz
        if (Math.random() > 0.7 && currentSection < sections.length) {
          setJourneyPaused(true);
          setQuizMode(true);
          generateQuiz(sections[currentSection]);
          clearInterval(journeyInterval);
        }

        if (currentSection >= sections.length) {
          clearInterval(journeyInterval);
          showNotification('🎉 Journey complete!', 'success');
          setViewMode('editor');
        }
      }
    }, 3000);
  };

  const generateQuiz = (content) => {
    // Simple quiz generation
    const words = content.split(' ').filter(w => w.length > 5);
    if (words.length > 0) {
      const word = words[Math.floor(Math.random() * words.length)];
      setCurrentQuiz({
        question: `What does "${word}" refer to in this context?`,
        answer: word,
        options: [word, 'Option 2', 'Option 3', 'Option 4'].sort(() => Math.random() - 0.5)
      });
    }
  };

  const answerQuiz = (answer) => {
    if (answer === currentQuiz.answer) {
      showNotification('✅ Correct!', 'success');
    } else {
      showNotification('❌ Try again', 'error');
    }
    setQuizMode(false);
    setJourneyPaused(false);
    setCurrentQuiz(null);
    startJourney();
  };

  // ========== BOOK VIEW ==========
  const splitIntoPages = () => {
    const sections = rawText.split(/\n\s*\n/);
    return sections;
  };

  const nextPage = () => {
    const pages = splitIntoPages();
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // ========== TEXT MANIPULATION ==========
  const wrapSelection = (before, after) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = rawText.substring(start, end);

    if (selectedText) {
      const newText =
        rawText.substring(0, start) +
        before +
        selectedText +
        after +
        rawText.substring(end);
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

  // ========== SAVE/LOAD ==========
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

  // ========== EXPORT ==========
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

  // ========== NOTIFICATIONS ==========
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // ========== RENDER ==========
  return (
    <div className={`app theme-${selectedTheme}`}>
      {/* Header */}
      <header className="header">
        <h1>✨ Note Formatter Pro</h1>
        <p>Enhanced with Visuals, Mind Maps, Voice & Journey Mode</p>
      </header>

      {/* View Mode Switcher */}
      <div className="view-mode-switcher">
        <button 
          className={`mode-btn ${viewMode === 'editor' ? 'active' : ''}`}
          onClick={() => setViewMode('editor')}
        >
          ✏️ Editor
        </button>
        <button 
          className={`mode-btn ${viewMode === 'book' ? 'active' : ''}`}
          onClick={() => setViewMode('book')}
        >
          📖 Book View
        </button>
        <button 
          className={`mode-btn ${viewMode === 'journey' ? 'active' : ''}`}
          onClick={() => startJourney()}
        >
          🚀 Journey Mode
        </button>
        <button 
          className={`mode-btn ${showDiagramView ? 'active' : ''}`}
          onClick={() => setShowDiagramView(!showDiagramView)}
        >
          📊 Diagrams
        </button>
        <button 
          className={`mode-btn ${showMindMap ? 'active' : ''}`}
          onClick={() => setShowMindMap(!showMindMap)}
        >
          🧠 Mind Map
        </button>
      </div>

      {/* EDITOR VIEW */}
      {viewMode === 'editor' && (
        <main className="main-content">
          {/* Editor Section */}
          <section className="editor-section">
            <div className="section-header">
              <h2>Your Notes</h2>
              <div className="header-controls">
                <button 
                  className={`btn btn-voice ${isListening ? 'listening' : ''}`}
                  onClick={toggleVoiceInput}
                  title="Voice Commands"
                >
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

✨ NEW FEATURES:
→ Arrows: -> <- ^ v
📦 Boxes: [box]content[/box]
🎨 Symbols: [!] [x] [?] [*]
💡 Tips: [tip]...[/tip]
⚠️ Warnings: [warning]...[/warning]

Templates: Cornell, Outline, Flashcards`}
              className="note-input"
            />

            {/* Enhanced Toolbar */}
            <div className="toolbar-enhanced">
              <div className="toolbar-section">
                <h4>Format</h4>
                <button onClick={() => wrapSelection('**', '**')} className="tool-btn">
                  <strong>B</strong>
                </button>
                <button onClick={() => wrapSelection('*', '*')} className="tool-btn">
                  <em>I</em>
                </button>
                <button onClick={() => wrapSelection('__', '__')} className="tool-btn">
                  <u>U</u>
                </button>
                <button onClick={() => wrapSelection('==', '==')} className="tool-btn">
                  <mark>H</mark>
                </button>
              </div>

              <div className="toolbar-section">
                <h4>Symbols</h4>
                <button onClick={() => insertSymbol(' → ')} className="tool-btn">→</button>
                <button onClick={() => insertSymbol(' ← ')} className="tool-btn">←</button>
                <button onClick={() => insertSymbol(' [!] ')} className="tool-btn">⚠️</button>
                <button onClick={() => insertSymbol(' [x] ')} className="tool-btn">✓</button>
                <button onClick={() => insertSymbol(' [*] ')} className="tool-btn">⭐</button>
              </div>

              <div className="toolbar-section">
                <h4>Boxes</h4>
                <button onClick={() => wrapSelection('[box]', '[/box]')} className="tool-btn">📦</button>
                <button onClick={() => wrapSelection('[note]', '[/note]')} className="tool-btn">📝</button>
                <button onClick={() => wrapSelection('[tip]', '[/tip]')} className="tool-btn">💡</button>
                <button onClick={() => wrapSelection('[warning]', '[/warning]')} className="tool-btn">⚠️</button>
              </div>

              <div className="toolbar-section">
                <h4>Highlights</h4>
                <div className="color-palette">
                  {highlightPalette.map((color, i) => (
                    <button
                      key={i}
                      className={`color-btn ${i === currentHighlight ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setCurrentHighlight(i)}
                    />
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

          {/* Preview Section */}
          <section className="preview-section">
            <div className="section-header">
              <h2>Preview</h2>
              <div className="action-buttons">
                <button onClick={saveNote} className="btn btn-primary">💾</button>
                <button onClick={exportToPDF} className="btn btn-primary">📄</button>
                <button onClick={copyHTML} className="btn btn-secondary">📋</button>
              </div>
            </div>

            <div
              id="preview"
              className="preview-content"
              dangerouslySetInnerHTML={{ __html: formatText(rawText) }}
            />
          </section>
        </main>
      )}

      {/* BOOK VIEW */}
      {viewMode === 'book' && (
        <div className="book-view">
          <div className="book-container">
            <div className="book-page">
              <div className="page-content" dangerouslySetInnerHTML={{ 
                __html: formatText(splitIntoPages()[currentPage] || '')
              }} />
              <div className="page-number">Page {currentPage + 1} of {splitIntoPages().length}</div>
            </div>
            <div className="book-controls">
              <button onClick={prevPage} disabled={currentPage === 0} className="btn btn-primary">
                ← Previous
              </button>
              <button onClick={nextPage} disabled={currentPage >= splitIntoPages().length - 1} className="btn btn-primary">
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JOURNEY MODE */}
      {viewMode === 'journey' && (
        <div className="journey-view">
          <div className="journey-progress-bar">
            <div className="progress-fill" style={{ width: `${journeyProgress}%` }} />
          </div>
          
          {!quizMode ? (
            <div className="journey-content">
              <div className="journey-text" dangerouslySetInnerHTML={{ __html: formatText(rawText) }} />
            </div>
          ) : (
            <div className="quiz-modal">
              <h2>📝 Quick Quiz!</h2>
              <p className="quiz-question">{currentQuiz?.question}</p>
              <div className="quiz-options">
                {currentQuiz?.options.map((option, i) => (
                  <button key={i} onClick={() => answerQuiz(option)} className="btn btn-quiz">
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* DIAGRAM VIEW */}
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

      {/* MIND MAP VIEW */}
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
                return (
                  <line
                    key={i}
                    x1={fromNode?.x}
                    y1={fromNode?.y}
                    x2={toNode?.x}
                    y2={toNode?.y}
                    stroke="#8b6f47"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* Saved Notes Sidebar */}
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

      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

export default App;