import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  // State management
  const [rawText, setRawText] = useState('');
  const [fontSize, setFontSize] = useState('medium');
  const [highlightColor, setHighlightColor] = useState('#ffeb3b');
  const [textColor, setTextColor] = useState('#000000');
  const [savedNotes, setSavedNotes] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [notification, setNotification] = useState(null);

  const textareaRef = useRef(null);

  // Load saved notes on mount
  useEffect(() => {
    loadSavedNotes();
  }, []);

  // Format text to HTML
  const formatText = (text) => {
    if (!text.trim()) {
      return '<p class="preview-placeholder">Your formatted notes will appear here...</p>';
    }

    let formatted = text;

    // Headings
    formatted = formatted.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    formatted = formatted.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    formatted = formatted.replace(/^### (.+)$/gm, '<h3>$1</h3>');

    // Bold
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic (single * but not **)
    formatted = formatted.replace(/(?<!\*)\*(?!\*)(.+?)\*(?!\*)/g, '<em>$1</em>');

    // Underline
    formatted = formatted.replace(/__(.+?)__/g, '<u>$1</u>');

    // Highlights with custom color
    formatted = formatted.replace(
      /==(.+?)==/g,
      `<mark style="background-color: ${highlightColor}; padding: 0.2em 0.4em; border-radius: 4px;">$1</mark>`
    );

    // Lists
    formatted = formatLists(formatted);

    // Paragraphs
    formatted = formatParagraphs(formatted);

    return `<div class="formatted-content size-${fontSize}">${formatted}</div>`;
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

  // Wrap selected text with formatting markers
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

      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        const newPos = start + before.length + selectedText.length + after.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    } else {
      // No selection, just insert markers
      const newText = rawText.substring(0, start) + before + after + rawText.substring(end);
      setRawText(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + before.length, start + before.length);
      }, 0);
    }
  };

  // Save note to localStorage
  const saveNote = () => {
    if (!rawText.trim()) {
      showNotification('Nothing to save! Please enter some content first.', 'warning');
      return;
    }

    const title = prompt('Enter a title for this note:') || 'Untitled Note';
    if (title === null) return;

    const note = {
      id: Date.now(),
      title: title.substring(0, 100),
      rawContent: rawText,
      formattedContent: formatText(rawText),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const notes = [...savedNotes, note];
    setSavedNotes(notes);
    localStorage.setItem('noteFormatter_savedNotes', JSON.stringify(notes));

    showNotification('Note saved successfully! 📝', 'success');
  };

  // Load saved notes from localStorage
  const loadSavedNotes = () => {
    try {
      const notes = JSON.parse(localStorage.getItem('noteFormatter_savedNotes') || '[]');
      setSavedNotes(notes);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  // Load a specific note
  const loadNote = (note) => {
    setRawText(note.rawContent);
    setShowSidebar(false);
    showNotification('Note loaded! ✅', 'success');
  };

  // Delete a note
  const deleteNote = (id) => {
    if (window.confirm('Delete this note?')) {
      const notes = savedNotes.filter((n) => n.id !== id);
      setSavedNotes(notes);
      localStorage.setItem('noteFormatter_savedNotes', JSON.stringify(notes));
      showNotification('Note deleted! 🗑️', 'info');
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    if (!rawText.trim()) {
      showNotification('Nothing to export! Please format some notes first.', 'warning');
      return;
    }

    try {
      const element = document.getElementById('preview');
      const opt = {
        margin: 1,
        filename: 'my-notes.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      };

      // Check if html2pdf is loaded
      if (window.html2pdf) {
        await window.html2pdf().set(opt).from(element).save();
        showNotification('Exporting as PDF... 📄', 'info');
      } else {
        showNotification('PDF export library not loaded. Install html2pdf.js', 'error');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      showNotification('Failed to export PDF', 'error');
    }
  };

  // Copy formatted HTML
  const copyHTML = () => {
    if (!rawText.trim()) {
      showNotification('Nothing to copy! Please format some notes first.', 'warning');
      return;
    }

    const html = document.getElementById('preview').innerHTML;
    navigator.clipboard
      .writeText(html)
      .then(() => {
        showNotification('HTML copied to clipboard! 📋', 'success');
      })
      .catch(() => {
        showNotification('Failed to copy to clipboard', 'error');
      });
  };

  // Clear all text
  const clearText = () => {
    if (window.confirm('Clear all content?')) {
      setRawText('');
      showNotification('Content cleared!', 'info');
    }
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        wrapSelection('**', '**');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        wrapSelection('*', '*');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        wrapSelection('__', '__');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveNote();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [rawText, savedNotes]);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>✨ Note Formatter</h1>
        <p>Transform plain text into beautiful, study-ready notes</p>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Editor Section */}
        <section className="editor-section">
          <div className="section-header">
            <h2>Your Notes</h2>
            <button onClick={clearText} className="btn btn-secondary">
              Clear
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Paste or type your notes here...

Tips:
- Use # for headings (# Main Topic, ## Subtopic)
- Use **text** for bold
- Use *text* for italic
- Use ==text== for highlights
- Start lines with - or * for bullet points`}
            className="note-input"
          />

          {/* Toolbar */}
          <div className="toolbar">
            <div className="toolbar-group">
              <button
                onClick={() => wrapSelection('**', '**')}
                className="tool-btn"
                title="Bold (Ctrl+B)"
              >
                <strong>B</strong>
              </button>
              <button
                onClick={() => wrapSelection('*', '*')}
                className="tool-btn"
                title="Italic (Ctrl+I)"
              >
                <em>I</em>
              </button>
              <button
                onClick={() => wrapSelection('__', '__')}
                className="tool-btn"
                title="Underline (Ctrl+U)"
              >
                <u>U</u>
              </button>
              <button
                onClick={() => wrapSelection('==', '==')}
                className="tool-btn"
                title="Highlight"
              >
                <mark>H</mark>
              </button>
            </div>

            <div className="toolbar-group">
              <label htmlFor="fontSize">Size:</label>
              <select
                id="fontSize"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="select-input"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div className="toolbar-group">
              <label htmlFor="highlightColor">Highlight:</label>
              <input
                type="color"
                id="highlightColor"
                value={highlightColor}
                onChange={(e) => setHighlightColor(e.target.value)}
                className="color-input"
              />
            </div>
          </div>
        </section>

        {/* Preview Section */}
        <section className="preview-section">
          <div className="section-header">
            <h2>Preview</h2>
            <div className="action-buttons">
              <button onClick={saveNote} className="btn btn-primary">
                💾 Save
              </button>
              <button onClick={exportToPDF} className="btn btn-primary">
                📄 PDF
              </button>
              <button onClick={copyHTML} className="btn btn-secondary">
                📋 Copy
              </button>
            </div>
          </div>

          <div
            id="preview"
            className="preview-content"
            dangerouslySetInnerHTML={{ __html: formatText(rawText) }}
          />
        </section>
      </main>

      {/* Saved Notes Sidebar */}
      <aside className={`saved-notes-sidebar ${showSidebar ? 'active' : ''}`}>
        <div className="sidebar-header">
          <h3>Saved Notes</h3>
          <button onClick={() => setShowSidebar(false)} className="close-btn">
            ✕
          </button>
        </div>

        <div className="saved-notes-list">
          {savedNotes.length === 0 ? (
            <p className="no-notes">No saved notes yet</p>
          ) : (
            savedNotes
              .slice()
              .reverse()
              .map((note) => (
                <div key={note.id} className="saved-note-item">
                  <div className="saved-note-header">
                    <h4>{note.title}</h4>
                    <span className="saved-note-date">{formatDate(note.updatedAt)}</span>
                  </div>
                  <div className="saved-note-preview">
                    {note.rawContent.substring(0, 100)}...
                  </div>
                  <div className="saved-note-actions">
                    <button onClick={() => loadNote(note)} className="btn btn-sm btn-primary">
                      Load
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="btn btn-sm btn-secondary"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </aside>

      {/* Toggle Sidebar Button */}
      <button onClick={() => setShowSidebar(!showSidebar)} className="toggle-sidebar-btn">
        📚 Saved Notes {savedNotes.length > 0 && `(${savedNotes.length})`}
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
