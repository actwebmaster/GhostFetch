
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, X } from 'lucide-react';
import axios from 'axios';

const SettingsModal = ({ isOpen, onClose, onSettingsChanged }) => {
    const [settings, setSettings] = useState({
        crawl_delay: 1.0,
        default_format: 'markdown',
        theme_accent: 'cyan'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSettings();
        }
    }, [isOpen]);

    const fetchSettings = async () => {
        try {
            const res = await axios.get('http://localhost:8000/settings');
            // Ensure types
            setSettings({
                crawl_delay: parseFloat(res.data.crawl_delay || 1.0),
                default_format: res.data.default_format || 'markdown',
                theme_accent: res.data.theme_accent || 'cyan'
            });
        } catch (err) {
            console.error("Failed to load settings:", err);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await axios.post('http://localhost:8000/settings', settings);
            if (onSettingsChanged) onSettingsChanged(settings);
            onClose();
        } catch (err) {
            console.error("Failed to save settings:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <SettingsIcon className="w-6 h-6 text-cyan-400" />
                    <h2 className="text-xl font-bold text-white">Einstellungen</h2>
                </div>

                <div className="space-y-6">
                    {/* Crawl Delay */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">
                            Crawl Geschwindigkeit (Verzögerung)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="0.1"
                                max="5.0"
                                step="0.1"
                                value={settings.crawl_delay}
                                onChange={(e) => setSettings({ ...settings, crawl_delay: parseFloat(e.target.value) })}
                                className="flex-1 accent-cyan-500"
                            />
                            <span className="text-slate-400 font-mono w-16 text-right">
                                {settings.crawl_delay}s
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            Höhere Werte reduzieren das Risiko geblockt zu werden.
                        </p>
                    </div>

                    {/* Default Format */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300">
                            Standard Export Format
                        </label>
                        <select
                            value={settings.default_format}
                            onChange={(e) => setSettings({ ...settings, default_format: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-cyan-500"
                        >
                            <option value="markdown">Markdown (.md)</option>
                            <option value="jsonl">JSON Lines (.jsonl)</option>
                            <option value="xml">XML (.xml)</option>
                            <option value="html">HTML (.html)</option>
                        </select>
                    </div>

                    {/* Theme Accent (Visual Only for now) */}
                    <div className="space-y-2 opacity-50 cursor-not-allowed">
                        <label className="block text-sm font-medium text-slate-300">
                            Akzentfarbe (Coming Soon)
                        </label>
                        <div className="flex gap-2">
                            {['cyan', 'purple', 'orange'].map(color => (
                                <div
                                    key={color}
                                    className={`w-8 h-8 rounded-full border-2 ${settings.theme_accent === color ? 'border-white' : 'border-transparent'}`}
                                    style={{ backgroundColor: color === 'cyan' ? '#06b6d4' : color === 'purple' ? '#9333ea' : '#f97316' }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-medium flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Speichern
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
