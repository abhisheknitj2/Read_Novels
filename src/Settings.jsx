import React from 'react';
import { Settings2, X } from 'lucide-react';

export default function Settings({ open, onClose, preferences, setPreferences }) {
  if (!open) return null;

  const updatePreference = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    document.documentElement.style.setProperty(`--reader-${key}`, value);
  };

  const fonts = [
    { name: 'Inter', value: "'Inter', system-ui, sans-serif" },
    { name: 'Merriweather', value: "'Merriweather', serif" },
    { name: 'Fira Code', value: "'Fira Code', monospace" }
  ];

  return (
    <div className="settings-panel">
      <div className="modal-header" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Reading Preferences</h3>
        <button onClick={onClose} className="icon-btn">
          <X size={18} />
        </button>
      </div>

      <div className="setting-group">
        <label>Font Family</label>
        <select 
          className="input-field" 
          style={{ padding: '8px' }}
          value={preferences['font-family']}
          onChange={(e) => updatePreference('font-family', e.target.value)}
        >
          {fonts.map(f => (
            <option key={f.name} value={f.value}>{f.name}</option>
          ))}
        </select>
      </div>

      <div className="setting-group">
        <label>Font Size</label>
        <div className="controls-row">
          <button onClick={() => updatePreference('font-size', `${parseFloat(preferences['font-size']) - 0.125}rem`)}>-</button>
          <span>{parseFloat(preferences['font-size']).toFixed(2)}</span>
          <button onClick={() => updatePreference('font-size', `${parseFloat(preferences['font-size']) + 0.125}rem`)}>+</button>
        </div>
      </div>

      <div className="setting-group">
        <label>Line Spacing</label>
        <div className="controls-row">
          <button onClick={() => updatePreference('line-height', (parseFloat(preferences['line-height']) - 0.1).toString())}>-</button>
          <span>{parseFloat(preferences['line-height']).toFixed(1)}</span>
          <button onClick={() => updatePreference('line-height', (parseFloat(preferences['line-height']) + 0.1).toString())}>+</button>
        </div>
      </div>

      <div className="setting-group">
        <label>Reading Width</label>
        <div className="controls-row">
          <button onClick={() => updatePreference('max-width', `${parseInt(preferences['max-width']) - 50}px`)}>-</button>
          <span>{parseInt(preferences['max-width'])}</span>
          <button onClick={() => updatePreference('max-width', `${parseInt(preferences['max-width']) + 50}px`)}>+</button>
        </div>
      </div>
    </div>
  );
}
