import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import { supabase } from './supabaseClient';
import Settings from './Settings';

const HIGHLIGHT_OPEN = '[[hl]]';
const HIGHLIGHT_CLOSE = '[[/hl]]';

function parseHighlightedContent(content = '') {
  const segments = [];
  let cursor = 0;

  while (cursor < content.length) {
    const highlightStart = content.indexOf(HIGHLIGHT_OPEN, cursor);

    if (highlightStart === -1) {
      segments.push({ text: content.slice(cursor), highlighted: false });
      break;
    }

    if (highlightStart > cursor) {
      segments.push({ text: content.slice(cursor, highlightStart), highlighted: false });
    }

    const textStart = highlightStart + HIGHLIGHT_OPEN.length;
    const highlightEnd = content.indexOf(HIGHLIGHT_CLOSE, textStart);

    if (highlightEnd === -1) {
      segments.push({ text: content.slice(highlightStart), highlighted: false });
      break;
    }

    segments.push({
      text: content.slice(textStart, highlightEnd),
      highlighted: true,
    });

    cursor = highlightEnd + HIGHLIGHT_CLOSE.length;
  }

  return segments.filter(segment => segment.text.length > 0);
}

function getPlainText(content = '') {
  return content.split(HIGHLIGHT_OPEN).join('').split(HIGHLIGHT_CLOSE).join('');
}

function getMarkedIndexFromPlainIndex(content, plainIndex) {
  let visibleCount = 0;

  for (let index = 0; index < content.length;) {
    if (content.startsWith(HIGHLIGHT_OPEN, index)) {
      index += HIGHLIGHT_OPEN.length;
      continue;
    }

    if (content.startsWith(HIGHLIGHT_CLOSE, index)) {
      index += HIGHLIGHT_CLOSE.length;
      continue;
    }

    if (visibleCount === plainIndex) {
      return index;
    }

    visibleCount += 1;
    index += 1;
  }

  return content.length;
}

function getSelectionOffsets(root) {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);

  if (!root.contains(range.commonAncestorContainer)) {
    return null;
  }

  const textNodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();

  while (currentNode) {
    textNodes.push(currentNode);
    currentNode = walker.nextNode();
  }

  let offset = 0;
  let start = null;
  let end = null;

  for (const node of textNodes) {
    const textLength = node.textContent?.length ?? 0;

    if (node === range.startContainer) {
      start = offset + range.startOffset;
    }

    if (node === range.endContainer) {
      end = offset + range.endOffset;
    }

    offset += textLength;
  }

  if (start === null || end === null || start === end) {
    return null;
  }

  return { start, end };
}

function isExactHighlightSelection(content, markedStart, markedEnd) {
  return (
    markedStart >= HIGHLIGHT_OPEN.length &&
    content.slice(markedStart - HIGHLIGHT_OPEN.length, markedStart) === HIGHLIGHT_OPEN &&
    content.slice(markedEnd, markedEnd + HIGHLIGHT_CLOSE.length) === HIGHLIGHT_CLOSE
  );
}

export default function Reader({
  article,
  onBack,
  preferences,
  setPreferences,
  onArticleUpdate,
}) {
  const containerRef = useRef(null);
  const articleBodyRef = useRef(null);
  const saveProgressTimeout = useRef(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pageInfo, setPageInfo] = useState({ current: 1, total: 1 });
  const [menuState, setMenuState] = useState(null);
  const [isSavingHighlight, setIsSavingHighlight] = useState(false);

  const renderedSegments = useMemo(
    () => parseHighlightedContent(article?.content ?? ''),
    [article?.content]
  );

  useEffect(() => {
    if (!article && saveProgressTimeout.current) {
      clearTimeout(saveProgressTimeout.current);
    }

    return () => {
      if (saveProgressTimeout.current) {
        clearTimeout(saveProgressTimeout.current);
      }
    };
  }, [article]);

  useEffect(() => {
    if (article && containerRef.current) {
      setTimeout(() => {
        containerRef.current.scrollTop = article.scroll_progress || 0;
        updatePageInfo();
      }, 50);
    }
  }, [article?.id, article?.content, preferences]);

  useEffect(() => {
    const handleWindowResize = () => updatePageInfo();
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [article?.id, article?.content, preferences]);

  useEffect(() => {
    const hideMenu = () => setMenuState(null);
    document.addEventListener('click', hideMenu);
    document.addEventListener('scroll', hideMenu, true);
    return () => {
      document.removeEventListener('click', hideMenu);
      document.removeEventListener('scroll', hideMenu, true);
    };
  }, []);

  const updatePageInfo = () => {
    const container = containerRef.current;
    if (!container) return;

    const viewportHeight = container.clientHeight || 1;
    const totalPages = Math.max(1, Math.ceil(container.scrollHeight / viewportHeight));
    const currentPage = Math.min(
      totalPages,
      Math.max(1, Math.floor(container.scrollTop / viewportHeight) + 1)
    );

    setPageInfo({ current: currentPage, total: totalPages });
  };

  const handleScroll = () => {
    if (!containerRef.current || !article) return;

    const scrollTop = containerRef.current.scrollTop;
    updatePageInfo();

    if (saveProgressTimeout.current) clearTimeout(saveProgressTimeout.current);

    saveProgressTimeout.current = setTimeout(async () => {
      try {
        await supabase
          .from('articles')
          .update({ scroll_progress: scrollTop })
          .eq('id', article.id);

        onArticleUpdate?.(article.id, { scroll_progress: scrollTop });
      } catch (err) {
        console.error('Failed to save progress', err);
      }
    }, 1000);
  };

  const handleContextMenu = (event) => {
    const root = articleBodyRef.current;
    if (!root) return;

    const offsets = getSelectionOffsets(root);
    if (!offsets) {
      setMenuState(null);
      return;
    }

    const selection = window.getSelection();
    const selectedText = selection?.toString() ?? '';

    if (!selectedText.trim()) {
      setMenuState(null);
      return;
    }

    const markedStart = getMarkedIndexFromPlainIndex(article.content, offsets.start);
    const markedEnd = getMarkedIndexFromPlainIndex(article.content, offsets.end);

    event.preventDefault();
    setMenuState({
      x: event.clientX,
      y: event.clientY,
      start: offsets.start,
      end: offsets.end,
      markedStart,
      markedEnd,
      selectedText,
      highlighted: isExactHighlightSelection(article.content, markedStart, markedEnd),
    });
  };

  const toggleHighlight = async () => {
    if (!menuState || isSavingHighlight) return;

    const {
      markedStart,
      markedEnd,
      highlighted,
    } = menuState;

    let nextContent;

    if (highlighted) {
      nextContent =
        article.content.slice(0, markedStart - HIGHLIGHT_OPEN.length) +
        article.content.slice(markedStart, markedEnd) +
        article.content.slice(markedEnd + HIGHLIGHT_CLOSE.length);
    } else {
      nextContent =
        article.content.slice(0, markedStart) +
        HIGHLIGHT_OPEN +
        article.content.slice(markedStart, markedEnd) +
        HIGHLIGHT_CLOSE +
        article.content.slice(markedEnd);
    }

    setIsSavingHighlight(true);

    try {
      const { error } = await supabase
        .from('articles')
        .update({ content: nextContent })
        .eq('id', article.id);

      if (error) throw error;

      onArticleUpdate?.(article.id, { content: nextContent });
      setMenuState(null);
      window.getSelection()?.removeAllRanges();

      requestAnimationFrame(() => {
        updatePageInfo();
      });
    } catch (err) {
      console.error('Failed to update highlight', err);
      alert('Failed to save highlight.');
    } finally {
      setIsSavingHighlight(false);
    }
  };

  if (!article) {
    return (
      <div className="main-area">
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 2.5 0 0 1 0-5H20"/>
          </svg>
          <h2>No Article Selected</h2>
          <p>Select an article from the sidebar or add a new one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-area">
      <div className="topbar">
        <button
          className="icon-btn"
          onClick={onBack}
          title="Back to Library"
        >
          <ArrowLeft size={20} />
          <span style={{ marginLeft: '8px', fontWeight: 500 }}>Library</span>
        </button>

        <div className="reader-progress-indicator">
          Page {pageInfo.current} / {pageInfo.total}
        </div>

        <button
          className="icon-btn"
          onClick={() => setSettingsOpen(!settingsOpen)}
          title="Reader Settings"
        >
          <SettingsIcon size={20} />
        </button>
      </div>

      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        preferences={preferences}
        setPreferences={setPreferences}
      />

      <div
        className="reader-container"
        ref={containerRef}
        onScroll={handleScroll}
      >
        <div className="article-content">
          <h1 className="article-title">{article.title}</h1>
          <div
            className="article-body"
            ref={articleBodyRef}
            onContextMenu={handleContextMenu}
          >
            {renderedSegments.map((segment, index) => (
              <span
                key={`${index}-${segment.highlighted ? 'hl' : 'plain'}`}
                className={segment.highlighted ? 'article-highlight' : undefined}
              >
                {segment.text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {menuState && (
        <button
          type="button"
          className="selection-menu"
          style={{ top: menuState.y, left: menuState.x }}
          onClick={toggleHighlight}
          disabled={isSavingHighlight}
        >
          {menuState.highlighted ? 'Remove highlight' : 'Highlight in green'}
        </button>
      )}
    </div>
  );
}
