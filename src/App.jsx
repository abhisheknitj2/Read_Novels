import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Sidebar from './Sidebar';
import Reader from './Reader';
import './index.css';

function App() {
  const [articles, setArticles] = useState([]);
  const [currentArticle, setCurrentArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  // Typography preferences state
  const [preferences, setPreferences] = useState({
    'font-size': '1.125rem',
    'line-height': '1.7',
    'font-family': "'Inter', system-ui, sans-serif",
    'max-width': '768px'
  });

  // Apply initial preferences
  useEffect(() => {
    Object.entries(preferences).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--reader-${key}`, value);
    });
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
      
      // Select the first article if none selected and articles exist
      if (!currentArticle && data && data.length > 0) {
        setCurrentArticle(data[0]);
      } else if (currentArticle) {
        // Keep current article sync'd with fetched data if it exists
        const updatedCurrent = data?.find(a => a.id === currentArticle.id);
        if (updatedCurrent) setCurrentArticle(updatedCurrent);
        else if (data && data.length > 0) setCurrentArticle(data[0]);
        else setCurrentArticle(null);
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading your library...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar 
        articles={articles} 
        currentArticle={currentArticle} 
        setCurrentArticle={setCurrentArticle} 
        fetchArticles={fetchArticles}
      />
      <Reader 
        article={currentArticle} 
        preferences={preferences}
        setPreferences={setPreferences}
      />
    </div>
  );
}

export default App;
