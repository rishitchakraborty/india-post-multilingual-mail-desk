import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { DakInputSection } from './components/DakInputSection.tsx';
import { DakAnalysisResult } from './components/DakAnalysisResult.tsx';
import { ReplyGeneratorSection } from './components/ReplyGeneratorSection.tsx';
import { AdminSettingsModal } from './components/AdminSettingsModal.tsx';
import { DakHistoryModal } from './components/DakHistoryModal.tsx';
import {
  LLMConfig,
  PostalCategory,
  ReplyTone,
  TranslationResult,
  ReplyResult,
  DakRecord,
} from './types/index.ts';
import {
  POSTAL_CIRCLES,
  generateDocketNumber,
  extractEntitiesRegex,
  autoDetectPostalMetadata,
  INDIAN_LANGUAGES,
} from './utils/dakUtils.ts';
import {
  Building2,
  Shield,
  Layers,
  Sparkles,
  Server,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

const STORAGE_KEY = 'indiapost_dak_register_v1';

export default function App() {
  // LLM Engine Configuration
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    provider: 'qwen_self_hosted',
    geminiModel: 'gemini-3.8-flash',
    qwenEndpoint: 'https://fastllm.quarkgen.ai/vllm/chat/stream',
    qwenModel: 'default',
    qwenApiKey: '',
    temperature: 0.2,
    maxTokens: 2048,
    fallbackToGemini: false,
  });

  // Postal Office Metadata
  const [postalCircle, setPostalCircle] = useState(POSTAL_CIRCLES[0]);
  const [staffLanguage, setStaffLanguage] = useState('English');
  const [postalCategory, setPostalCategory] = useState<PostalCategory>('Speed Post');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [docketNumber, setDocketNumber] = useState(generateDocketNumber(POSTAL_CIRCLES[0]));

  // Mail Input & State
  const [mailText, setMailText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);

  // Reply Desk State
  const [staffReply, setStaffReply] = useState('');
  const [replyTone, setReplyTone] = useState<ReplyTone>('formal');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [replyResult, setReplyResult] = useState<ReplyResult | null>(null);

  // Archive & History
  const [records, setRecords] = useState<DakRecord[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Error Banner
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch initial server config & load stored records
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.provider) {
          setLlmConfig((prev) => ({
            ...prev,
            ...data,
          }));
        }
      })
      .catch((err) => console.warn('Could not load remote settings, using local defaults', err));

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setRecords(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Error reading from localStorage', e);
    }
  }, []);

  // Update docket when circle changes
  const handleCircleChange = (newCircle: string) => {
    setPostalCircle(newCircle);
    if (!translationResult) {
      setDocketNumber(generateDocketNumber(newCircle));
    }
  };

  // Analyze & Translate Incoming Dak
  const handleAnalyzeAndTranslate = async () => {
    if (!mailText.trim()) return;
    setIsTranslating(true);
    setErrorMessage(null);

    // Auto extract fallback regex entities if needed
    const clientEntities = extractEntitiesRegex(mailText);
    const effectiveTracking = trackingNumber || clientEntities.trackingNumber || '';
    if (!trackingNumber && clientEntities.trackingNumber) {
      setTrackingNumber(clientEntities.trackingNumber);
    }

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: mailText,
          preferredLanguage: staffLanguage,
          postalCategory,
          trackingNumber: effectiveTracking,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to translate postal mail');
      }

      setTranslationResult(data);
      setIsSaved(false);

      // If backend detected category or tracking and state was default/empty, sync them
      if (data.detectedCategory && data.detectedCategory !== postalCategory) {
        setPostalCategory(data.detectedCategory);
      }
      if (data.extractedEntities?.trackingNumber && !trackingNumber) {
        setTrackingNumber(data.extractedEntities.trackingNumber);
      }

      // Auto scroll to result
      setTimeout(() => {
        const el = document.getElementById('analysis-result-card');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with translation server.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Generate Reply in Sender's Language
  const handleGenerateReply = async () => {
    if (!staffReply.trim() || !translationResult) return;
    setIsGeneratingReply(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffReply,
          originalText: mailText,
          sourceLanguage: translationResult.detectedLanguage,
          staffLanguage,
          tone: replyTone,
          docketNumber,
          trackingNumber: trackingNumber || translationResult.extractedEntities.trackingNumber,
          customerName: translationResult.extractedEntities.senderName,
          customerEmail: translationResult.extractedEntities.senderEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate regional reply');
      }

      setReplyResult(data);
      setIsSaved(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error generating regional postal reply.');
    } finally {
      setIsGeneratingReply(false);
    }
  };

  // Save current Dak into local register
  const handleSaveToRegister = () => {
    if (!translationResult) return;

    const newRecord: DakRecord = {
      id: `dak-${Date.now()}`,
      docketNumber,
      createdAt: new Date().toISOString(),
      postalCircle,
      category: postalCategory,
      trackingNumber: trackingNumber || translationResult.extractedEntities.trackingNumber,
      customerName: translationResult.extractedEntities.senderName,
      customerEmail: translationResult.extractedEntities.senderEmail,
      subjectLine: translationResult.subjectLine,
      originalText: mailText,
      sourceLanguage: translationResult.detectedLanguage,
      staffLanguage,
      translatedText: translationResult.translatedText,
      summary: translationResult.summary,
      urgency: translationResult.urgency,
      extractedEntities: translationResult.extractedEntities,
      suggestedActionPoints: translationResult.suggestedActionPoints,
      staffReplyDraft: staffReply,
      replySubject: replyResult?.subjectLine,
      senderLanguageReply: replyResult?.senderLanguageReply,
      reverseTranslation: replyResult?.reverseTranslation,
      replyTone,
      status: replyResult ? 'Dispatched' : 'Translated',
      modelUsed: replyResult?.modelUsed || translationResult.modelUsed,
    };

    const updated = [newRecord, ...records];
    setRecords(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
    setIsSaved(true);
  };

  // Load a past record
  const handleSelectRecord = (record: DakRecord) => {
    setDocketNumber(record.docketNumber);
    setPostalCircle(record.postalCircle);
    setPostalCategory(record.category);
    if (record.trackingNumber) setTrackingNumber(record.trackingNumber);
    setMailText(record.originalText);
    setStaffLanguage(record.staffLanguage);

    setTranslationResult({
      detectedLanguage: record.sourceLanguage,
      detectedLanguageCode: 'unknown',
      confidence: 0.95,
      subjectLine: record.subjectLine || record.summary,
      translatedText: record.translatedText,
      summary: record.summary,
      postalIntent: record.summary,
      urgency: record.urgency,
      extractedEntities: record.extractedEntities,
      suggestedActionPoints: record.suggestedActionPoints,
      modelUsed: record.modelUsed,
    });

    if (record.staffReplyDraft) {
      setStaffReply(record.staffReplyDraft);
    }

    if (record.senderLanguageReply) {
      setReplyResult({
        subjectLine: record.replySubject || `[India Post] Ref: ${record.docketNumber}`,
        reverseSubjectLine: `[India Post] Ref: ${record.docketNumber}`,
        senderLanguageReply: record.senderLanguageReply,
        reverseTranslation: record.reverseTranslation || '',
        senderLanguage: record.sourceLanguage,
        staffLanguage: record.staffLanguage,
        officialSalutation: 'Dear Customer',
        officialSignOff: 'India Post',
        senderEmail: record.customerEmail,
        modelUsed: record.modelUsed,
      });
    } else {
      setReplyResult(null);
    }

    setIsSaved(true);
  };

  const handleClearHistory = () => {
    if (confirm('Clear all stored dak register records?')) {
      setRecords([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleDeleteRecord = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Reset form for New Dak
  const handleNewDak = () => {
    setMailText('');
    setTrackingNumber('');
    setTranslationResult(null);
    setStaffReply('');
    setReplyResult(null);
    setDocketNumber(generateDocketNumber(postalCircle));
    setIsSaved(false);
    setErrorMessage(null);
  };

  // Save LLM Config
  const handleSaveConfig = async (newConfig: LLMConfig) => {
    setLlmConfig(newConfig);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
    } catch (e) {
      console.warn('Could not persist settings to server', e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* India Post Institutional Header */}
      <Header
        llmConfig={llmConfig}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={records.length}
        onNewDak={handleNewDak}
      />

      {/* Main Mail Desk Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Error Notice */}
        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg shadow-sm flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-red-900 uppercase tracking-wide">
                  Processing Notice (सूचना)
                </h4>
                <p className="text-xs text-red-800 mt-0.5">{errorMessage}</p>
                {llmConfig.provider === 'qwen_self_hosted' && (
                  <p className="text-[11px] text-red-700 mt-1">
                    Tip: Verify your local Qwen endpoint or switch to Gemini in Admin Settings (top right).
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-gray-400 hover:text-gray-700 font-bold ml-4 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Operating Circle & Postmaster Desk Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#c91d24]" />
              <span className="font-bold text-gray-700">Operating Postal Circle:</span>
            </div>
            <select
              value={postalCircle}
              onChange={(e) => handleCircleChange(e.target.value)}
              className="font-medium text-xs border border-gray-300 rounded-md px-2.5 py-1 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#c91d24]"
            >
              {POSTAL_CIRCLES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-[11px] bg-red-50 text-red-900 px-2.5 py-1 rounded border border-red-200">
              <span className="text-gray-500 font-sans">Active Docket:</span>
              <strong>{docketNumber}</strong>
            </div>

            <button
              onClick={handleNewDak}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-[#c91d24] transition font-medium px-2 py-1 rounded hover:bg-gray-50 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset / New Dak</span>
            </button>
          </div>
        </div>

        {/* Step 1: Input Section with Auto-detect */}
        <DakInputSection
          mailText={mailText}
          onMailTextChange={setMailText}
          postalCategory={postalCategory}
          onPostalCategoryChange={setPostalCategory}
          trackingNumber={trackingNumber}
          onTrackingNumberChange={setTrackingNumber}
          staffLanguage={staffLanguage}
          onStaffLanguageChange={setStaffLanguage}
          onAnalyzeAndTranslate={handleAnalyzeAndTranslate}
          isLoading={isTranslating}
          onClear={() => {
            setMailText('');
            setTrackingNumber('');
          }}
        />

        {/* Translation & Grievance Analysis Result (Formatted Letter Display) */}
        {translationResult && (
          <div id="analysis-result-card" className="transition-all duration-300">
            <DakAnalysisResult
              result={translationResult}
              originalText={mailText}
              staffLanguage={staffLanguage}
              onProceedToReply={() => {
                const el = document.getElementById('reply-desk-card');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* Step 2: Bi-directional Reply Generator & Email Copy Desk */}
        {translationResult && (
          <div id="reply-desk-card" className="transition-all duration-300">
            <ReplyGeneratorSection
              staffLanguage={staffLanguage}
              sourceLanguage={translationResult.detectedLanguage}
              trackingNumber={trackingNumber || translationResult.extractedEntities.trackingNumber}
              customerName={translationResult.extractedEntities.senderName}
              customerEmail={translationResult.extractedEntities.senderEmail}
              docketNumber={docketNumber}
              staffReply={staffReply}
              onStaffReplyChange={setStaffReply}
              replyTone={replyTone}
              onReplyToneChange={setReplyTone}
              onGenerateReply={handleGenerateReply}
              isLoading={isGeneratingReply}
              replyResult={replyResult}
              onSaveToRegister={handleSaveToRegister}
              isSaved={isSaved}
            />
          </div>
        )}

        {/* Institutional Assurance / Department Footnote */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              <strong>Zero-Subscription & Privacy Compliant:</strong> Configured to use India Post
              private self-hosted Qwen LLM or Gemini without recurring third-party API licensing fees.
            </span>
          </div>
          <span className="text-[11px] text-gray-400 font-mono">
            Department of Posts (डाक विभाग), Govt. of India
          </span>
        </div>
      </main>

      {/* Admin / Model Engine Settings Modal */}
      <AdminSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={llmConfig}
        onSaveConfig={handleSaveConfig}
      />

      {/* Dak Register / Archive Modal */}
      <DakHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        records={records}
        onSelectRecord={handleSelectRecord}
        onClearHistory={handleClearHistory}
        onDeleteRecord={handleDeleteRecord}
      />
    </div>
  );
}
