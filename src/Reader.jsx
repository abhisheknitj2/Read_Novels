import React, { useEffect, useRef, useState } from 'react';
import { Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import { supabase } from './supabaseClient';
import Settings from './Settings';

export default function Reader({ article, onBack, preferences, setPreferences }) {
  const containerRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const saveProgressTimeout = useRef(null);

  // Restore scroll progress when article changes
  useEffect(() => {
    if (article && containerRef.current) {
      // Small timeout to ensure DOM is painted
      setTimeout(() => {
        containerRef.current.scrollTop = article.scroll_progress || 0;
      }, 50);
    }
  }, [article?.id]);

  // Handle scrolling: Hide topbar and debounce save progress
  const handleScroll = () => {
    if (!containerRef.current || !article) return;
    
    const scrollTop = containerRef.current.scrollTop;
    setIsScrolled(scrollTop > 50);

    // Debounced save to Supabase (wait 1 second after last scroll)
    if (saveProgressTimeout.current) clearTimeout(saveProgressTimeout.current);
    
    saveProgressTimeout.current = setTimeout(async () => {
      try {
        await supabase
          .from('articles')
          .update({ scroll_progress: scrollTop })
          .eq('id', article.id);
      } catch (err) {
        console.error("Failed to save progress", err);
      }
    }, 1000);
  };

  if (!article) {
    return (
      <div className="main-area">
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 2.5 0 0 1 0-5H20"/>
          </svg>
          <h2>No Article Selected</h2>
          <p>Select an article from the sidebar or add a new one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-area">
      <div className={`topbar ${isScrolled ? 'scrolled' : ''}`}>
        <button 
          className="icon-btn" 
          onClick={onBack}
          title="Back to Library"
        >
          <ArrowLeft size={20} />
          <span style={{ marginLeft: '8px', fontWeight: 500 }}>Library</span>
        </button>
        <div style={{ flex: 1 }} /> {/* Spacer */}
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
          <div className="article-body">
            {article.content}
          </div>
        </div>
      </div>
    </div>
  );
}
