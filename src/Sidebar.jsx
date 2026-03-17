import React, { useState } from 'react';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function Sidebar({ articles, currentArticle, setCurrentArticle, fetchArticles }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSaving(true);
    const { data, error } = await supabase
      .from('articles')
      .insert([{ title: newTitle, content: newContent, scroll_progress: 0 }])
      .select();

    if (error) {
      console.error('Error creating article:', error);
      alert('Failed to save article.');
    } else {
      setIsModalOpen(false);
      setNewTitle('');
      setNewContent('');
      await fetchArticles();
      if (data && data.length > 0) {
        setCurrentArticle(data[0]);
      }
    }
    setIsSaving(false);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // prevent selecting the article
    if (!window.confirm("Are you sure you want to delete this article?")) return;

    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (!error) {
      await fetchArticles();
      if (currentArticle?.id === id) {
        setCurrentArticle(null);
      }
    }
  };

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} color="var(--text-accent)" />
            <h1>Read</h1>
          </div>
          <button 
            className="icon-btn primary" 
            onClick={() => setIsModalOpen(true)}
            title="Add new article"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="article-list">
          {articles.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No articles saved yet. Click + to add one.
            </div>
          ) : (
            articles.map(article => (
              <div 
                key={article.id}
                className={`article-item ${currentArticle?.id === article.id ? 'active' : ''}`}
                onClick={() => setCurrentArticle(article)}
              >
                <div className="article-info">
                  <h3>{article.title}</h3>
                  {/* Basic estimation: 250 words per minute */}
                  <span>{~~(article.content.split(' ').length / 250) + 1} min read</span>
                </div>
                <button 
                  className="icon-btn delete-btn"
                  onClick={(e) => handleDelete(e, article.id)}
                  title="Delete article"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !isSaving && setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Read</h2>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateArticle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                placeholder="Article Title..."
                className="input-field"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
                autoFocus
              />
              <textarea
                placeholder="Paste your article content here..."
                className="input-field"
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  className="icon-btn" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSaving || !newTitle.trim() || !newContent.trim()}
                >
                  {isSaving ? 'Saving...' : 'Save & Read'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Need to import X for modal close
import { X } from 'lucide-react';
