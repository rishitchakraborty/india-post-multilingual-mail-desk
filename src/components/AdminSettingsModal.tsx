import React, { useState } from 'react';
import {
  X,
  Server,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Shield,
  HelpCircle,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import { LLMConfig } from '../types/index.ts';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LLMConfig;
  onSaveConfig: (newConfig: LLMConfig) => Promise<void>;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<LLMConfig>(config);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    sampleReply?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'guide'>('config');

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/settings/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: formData.provider,
          qwenEndpoint: formData.qwenEndpoint,
          qwenModel: formData.qwenModel,
          qwenApiKey: formData.qwenApiKey,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Connection successful!',
          latencyMs: data.latencyMs,
          sampleReply: data.sampleReply,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed. Please check host URL and model ID.',
          latencyMs: data.latencyMs,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error attempting to reach backend server.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveConfig(formData);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#b31317] to-[#8f0e13] px-6 py-4 text-white flex items-center justify-between border-b-2 border-[#ffcb05]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Server className="w-5 h-5 text-[#ffcb05]" />
            </div>
            <div>
              <h3 className="font-bold text-lg">AI Model & Self-Hosted Qwen Admin Panel</h3>
              <p className="text-xs text-red-100">
                Configure private LLM access for India Post (Zero-Subscription & Privacy Compliant)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-2.5 px-4 font-semibold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === 'config'
                ? 'border-[#c91d24] text-[#c91d24] bg-white rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Engine Configuration</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-2.5 px-4 font-semibold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === 'guide'
                ? 'border-[#c91d24] text-[#c91d24] bg-white rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Self-Hosted Qwen Setup Guide</span>
          </button>
        </div>

        {activeTab === 'config' ? (
          <form onSubmit={handleSave} className="p-6 space-y-6">
            {/* Active Provider Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Active Translation Engine
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Gemini Option */}
                <div
                  onClick={() => setFormData({ ...formData, provider: 'gemini' })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition relative ${
                    formData.provider === 'gemini'
                      ? 'border-[#c91d24] bg-red-50/50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#c91d24]" />
                      <span className="font-bold text-gray-900 text-sm">Gemini 3.8 Flash</span>
                    </div>
                    {formData.provider === 'gemini' && (
                      <span className="bg-[#c91d24] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Default high-speed multilingual model for fast turnarounds across 22+ Indian
                    languages.
                  </p>
                </div>

                {/* Self-Hosted Qwen Option */}
                <div
                  onClick={() => setFormData({ ...formData, provider: 'qwen_self_hosted' })}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition relative ${
                    formData.provider === 'qwen_self_hosted'
                      ? 'border-purple-600 bg-purple-50/50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="w-5 h-5 text-purple-600" />
                      <span className="font-bold text-gray-900 text-sm">
                        Custom LLM / Self-Hosted LLM
                      </span>
                    </div>
                    {formData.provider === 'qwen_self_hosted' && (
                      <span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    OpenAI-format streaming endpoint (vLLM, Qwen, or Ollama). Zero API key required.
                  </p>
                </div>
              </div>
            </div>

            {/* Qwen Configuration Fields (Shown if Qwen is active or configuring) */}
            <div
              className={`p-4 rounded-xl border transition ${
                formData.provider === 'qwen_self_hosted'
                  ? 'border-purple-300 bg-purple-50/30'
                  : 'border-gray-200 bg-gray-50 opacity-90'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-purple-600" />
                  LLM Endpoint Settings
                </span>
                <span className="text-[11px] text-gray-500">vLLM • OpenAI Compatible</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    API Base URL / Stream Endpoint
                  </label>
                  <input
                    type="text"
                    value={formData.qwenEndpoint}
                    onChange={(e) => setFormData({ ...formData, qwenEndpoint: e.target.value })}
                    placeholder="e.g. https://fastllm.quarkgen.ai/vllm/chat/stream or http://localhost:8000/v1"
                    className="w-full text-xs font-mono px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white text-gray-900"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Accepts OpenAI-format chat endpoints (e.g. local vLLM).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Model Identifier / Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.qwenModel}
                      onChange={(e) => setFormData({ ...formData, qwenModel: e.target.value })}
                      placeholder="e.g. default, qwen-3.8-27b"
                      className="w-full text-xs font-mono px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Internal Auth Token / Key (Optional)
                    </label>
                    <input
                      type="password"
                      value={formData.qwenApiKey || ''}
                      onChange={(e) => setFormData({ ...formData, qwenApiKey: e.target.value })}
                      placeholder="Leave blank if no auth required"
                      className="w-full text-xs font-mono px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white text-gray-900"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-purple-200/60">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={formData.fallbackToGemini}
                      onChange={(e) =>
                        setFormData({ ...formData, fallbackToGemini: e.target.checked })
                      }
                      className="rounded text-[#c91d24] focus:ring-[#c91d24]"
                    />
                    <span>Auto-fallback to Gemini if Qwen is unreachable</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Diagnostics & Test Connection Result */}
            {testResult && (
              <div
                className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-red-50 border-red-300 text-red-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 flex-1">
                  <div className="font-semibold flex items-center justify-between">
                    <span>{testResult.message}</span>
                    {testResult.latencyMs !== undefined && (
                      <span className="font-mono bg-white/60 px-1.5 py-0.5 rounded text-[11px]">
                        {testResult.latencyMs} ms
                      </span>
                    )}
                  </div>
                  {testResult.sampleReply && (
                    <p className="text-[11px] font-mono bg-white/80 p-1.5 rounded border border-emerald-200">
                      Response: "{testResult.sampleReply}"
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Testing Endpoint...' : 'Ping & Test Connection'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs px-4 py-2 font-medium text-gray-600 hover:text-gray-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs font-bold px-5 py-2 rounded-lg bg-[#c91d24] hover:bg-[#a6141a] text-white shadow transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4 text-xs text-gray-700">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-amber-900 flex items-start gap-2">
              <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Zero Recurring Cost & Complete Privacy Policy:</span>
                <p className="mt-0.5 text-amber-800">
                  By running Qwen 27B / 3.8 on India Post's on-premise servers (or NIC cloud), all
                  sensitive customer mail, pensions, and address details remain strictly inside the
                  department network with zero external API fees.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-gray-900 text-sm">
                How to deploy Qwen on India Post GPU Server:
              </h4>

              <div className="bg-gray-900 text-gray-100 p-3.5 rounded-lg font-mono text-[11px] space-y-2">
                <p className="text-gray-400"># Option 1: Fast vLLM deployment (Recommended for production)</p>
                <p className="text-emerald-400">
                  pip install vllm
                  <br />
                  vllm serve Qwen/Qwen2.5-32B-Instruct --host 0.0.0.0 --port 8000
                </p>
              </div>

              <div className="bg-gray-900 text-gray-100 p-3.5 rounded-lg font-mono text-[11px] space-y-2">
                <p className="text-gray-400"># Option 2: Lightweight Ollama deployment (For branch offices)</p>
                <p className="text-emerald-400">
                  ollama run qwen2.5:32b
                  <br />
                  # Endpoint URL: http://localhost:11434/v1
                </p>
              </div>

              <p className="text-gray-500 text-[11px]">
                Once running, enter the server's IP address (e.g.{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">
                  http://10.20.1.15:8000/v1
                </code>
                ) in the Endpoint field and click "Ping & Test Connection".
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('config')}
                className="text-xs font-bold px-4 py-2 rounded-lg bg-[#c91d24] text-white hover:bg-[#a6141a]"
              >
                Back to Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
