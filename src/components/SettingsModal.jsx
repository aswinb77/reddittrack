import React, { useState } from 'react';
import { X, Key, Download, Upload, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  hasCredentials,
  onSaveCredentials,
  allPosts,
  onImportPosts,
  onClearAll,
}) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSaveApi = async (e) => {
    e.preventDefault();
    await onSaveCredentials(clientId, clientSecret);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allPosts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `reddit_track_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e) => {
    e.preventDefault();
    setImportError('');
    try {
      const parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON backup must be an array of posts.');
      }
      onImportPosts(parsed);
      setImportJsonText('');
      onClose();
    } catch (err) {
      setImportError(err.message || 'Invalid JSON syntax');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0C0C0E] border border-[#2B2B30] w-full max-w-lg max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="p-5 border-b border-[#1E1E22] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-white"></span>
            <h3 className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-white">
              SETTINGS & INTEGRATIONS
            </h3>
          </div>
          <button onClick={onClose} className="text-[#71717A] hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          
          {/* Section 1: Official Reddit API Credentials */}
          <div className="border border-[#1E1E22] bg-[#08080A] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-white" />
                <h4 className="text-xs font-mono font-bold tracking-wider uppercase text-white">
                  REDDIT DEVELOPER API (OPTIONAL)
                </h4>
              </div>
              {hasCredentials && (
                <span className="flex items-center space-x-1 text-[10px] font-mono text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>CONNECTED</span>
                </span>
              )}
            </div>

            <p className="text-[11px] font-mono text-[#71717A] mb-3 leading-relaxed">
              For high-volume background crawling without Reddit anti-bot challenges, supply free Reddit script app credentials from <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noreferrer" className="text-white underline">reddit.com/prefs/apps</a>.
            </p>

            <form onSubmit={handleSaveApi} className="space-y-3">
              <div>
                <label className="block text-[9px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1">
                  CLIENT ID
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="e.g. 14-char string under app name"
                  className="w-full bg-[#0C0C0E] border border-[#222226] text-white p-2 text-xs font-mono focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1">
                  CLIENT SECRET
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="e.g. 27-char secret"
                  className="w-full bg-[#0C0C0E] border border-[#222226] text-white p-2 text-xs font-mono focus:border-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {saveSuccess ? (
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Credentials Saved</span>
                  </span>
                ) : <span />}

                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-white text-black font-bold hover:bg-neutral-200 transition-all"
                >
                  SAVE KEYS
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Data Backup & Restore */}
          <div className="border border-[#1E1E22] bg-[#08080A] p-4">
            <h4 className="text-xs font-mono font-bold tracking-wider uppercase text-white mb-2 flex items-center space-x-2">
              <Download className="w-4 h-4 text-white" />
              <span>DATA BACKUP & RESTORE</span>
            </h4>

            <div className="flex items-center space-x-3 mb-4">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center space-x-1.5 px-3 py-2 text-xs font-mono uppercase tracking-wider border border-[#2B2B30] bg-[#121215] text-white hover:border-white transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>EXPORT JSON ({allPosts.length})</span>
              </button>
            </div>

            {/* Paste JSON to import */}
            <div>
              <label className="block text-[9px] font-mono tracking-widest uppercase text-[#A1A1AA] mb-1">
                IMPORT / RESTORE FROM JSON
              </label>
              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="Paste backup JSON array here..."
                rows={3}
                className="w-full bg-[#0C0C0E] border border-[#222226] text-white p-2 text-xs font-mono focus:border-white focus:outline-none placeholder:text-[#52525B]"
              />
              {importError && (
                <p className="text-red-400 text-[10px] font-mono mt-1">{importError}</p>
              )}
              {importJsonText.trim() && (
                <button
                  type="button"
                  onClick={handleImportJson}
                  className="mt-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-white text-black font-bold hover:bg-neutral-200 transition-all"
                >
                  IMPORT POSTS
                </button>
              )}
            </div>
          </div>

          {/* Section 3: Reset / Clear */}
          <div className="border border-[#1E1E22] bg-[#08080A] p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-mono font-bold uppercase text-white">
                PURGE ALL TRACKED POSTS
              </div>
              <p className="text-[10px] font-mono text-[#71717A] mt-0.5">
                Permanently wipes all saved posts and resets database.
              </p>
            </div>

            {showClearConfirm ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    onClearAll();
                    setShowClearConfirm(false);
                    onClose();
                  }}
                  className="px-2.5 py-1 text-xs font-mono font-bold bg-red-600 text-white hover:bg-red-700"
                >
                  CONFIRM WIPE
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="text-xs font-mono text-[#A1A1AA] hover:text-white"
                >
                  CANCEL
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all"
              >
                CLEAR ALL
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

