import React, { useState, useEffect } from 'react';
import {
  FileText,
  Languages,
  Sparkles,
  ArrowRight,
  Package,
  RotateCcw,
  CheckCircle,
  Zap,
  Mail,
  Barcode,
  ClipboardPaste,
  Check,
} from 'lucide-react';
import { PostalCategory } from '../types/index.ts';
import {
  INDIAN_LANGUAGES,
  POSTAL_CATEGORIES,
  SAMPLE_MAILS,
  detectScriptLanguage,
  autoDetectPostalMetadata,
  SampleMail,
} from '../utils/dakUtils.ts';

interface DakInputSectionProps {
  mailText: string;
  onMailTextChange: (text: string) => void;
  postalCategory: PostalCategory;
  onPostalCategoryChange: (cat: PostalCategory) => void;
  trackingNumber: string;
  onTrackingNumberChange: (trk: string) => void;
  staffLanguage: string;
  onStaffLanguageChange: (lang: string) => void;
  onAnalyzeAndTranslate: () => void;
  isLoading: boolean;
  onClear: () => void;
}

export const DakInputSection: React.FC<DakInputSectionProps> = ({
  mailText,
  onMailTextChange,
  postalCategory,
  onPostalCategoryChange,
  trackingNumber,
  onTrackingNumberChange,
  staffLanguage,
  onStaffLanguageChange,
  onAnalyzeAndTranslate,
  isLoading,
  onClear,
}) => {
  const [scriptInfo, setScriptInfo] = useState<{ code: string; name: string; confidence: number }>({
    code: 'en',
    name: 'English',
    confidence: 0,
  });

  const [autoDetectedCategory, setAutoDetectedCategory] = useState<PostalCategory | null>(null);
  const [autoDetectedTracking, setAutoDetectedTracking] = useState<string | null>(null);
  const [detectionNotice, setDetectionNotice] = useState<string | null>(null);
  const [pasteSuccess, setPasteSuccess] = useState(false);

  // Core auto-detection routine when text is pasted or modified
  const processInputText = (text: string, isFromPaste: boolean = false) => {
    onMailTextChange(text);

    if (text.trim().length > 3) {
      const script = detectScriptLanguage(text);
      setScriptInfo(script);

      const detected = autoDetectPostalMetadata(text);
      let detectedItems: string[] = [];

      if (detected.category) {
        onPostalCategoryChange(detected.category);
        setAutoDetectedCategory(detected.category);
        detectedItems.push(`Category: ${detected.category}`);
      }

      if (detected.trackingNumber) {
        onTrackingNumberChange(detected.trackingNumber);
        setAutoDetectedTracking(detected.trackingNumber);
        detectedItems.push(`Article ID: ${detected.trackingNumber}`);
      }

      if (detectedItems.length > 0) {
        const msg = `⚡ Auto-detected: ${detectedItems.join(' • ')}`;
        setDetectionNotice(msg);
      }
    } else {
      setScriptInfo({ code: '', name: '', confidence: 0 });
      setAutoDetectedCategory(null);
      setAutoDetectedTracking(null);
      setDetectionNotice(null);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted && pasted.trim()) {
      processInputText(pasted, true);
    }
  };

  const handleDirectClipboardPaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          processInputText(text, true);
          setPasteSuccess(true);
          setTimeout(() => setPasteSuccess(false), 2000);
        }
      }
    } catch (err) {
      console.warn('Clipboard read failed or permission denied:', err);
    }
  };

  const handleSelectSample = (sample: SampleMail) => {
    processInputText(sample.text);
    onPostalCategoryChange(sample.category);
    setAutoDetectedCategory(sample.category);
    if (sample.trackingNumber) {
      onTrackingNumberChange(sample.trackingNumber);
      setAutoDetectedTracking(sample.trackingNumber);
    }
    setDetectionNotice(`⚡ Auto-detected: Category: ${sample.category} • Article ID: ${sample.trackingNumber || 'N/A'}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      {/* Section Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-100 text-[#c91d24] rounded-md">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              1. ग्राहक का ईमेल / पत्र पेस्ट करें (Paste Incoming Customer Email)
            </h2>
            <p className="text-[11px] text-gray-500">
              Pasting email automatically detects the Postal Service Category and Consignment / Article ID.
            </p>
          </div>
        </div>

        {/* Quick Sample & Paste Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDirectClipboardPaste}
            className="text-xs bg-white hover:bg-gray-100 text-gray-700 font-semibold px-2.5 py-1.5 rounded-lg border border-gray-300 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Paste directly from clipboard"
          >
            {pasteSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Pasted!</span>
              </>
            ) : (
              <>
                <ClipboardPaste className="w-3.5 h-3.5 text-[#c91d24]" />
                <span>Paste from Clipboard</span>
              </>
            )}
          </button>

          <span className="text-xs text-gray-400">|</span>

          <select
            onChange={(e) => {
              const found = SAMPLE_MAILS.find((s) => s.id === e.target.value);
              if (found) handleSelectSample(found);
            }}
            defaultValue=""
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-[#c91d24]"
          >
            <option value="" disabled>
              Load Real Postal Mail Scenario...
            </option>
            {SAMPLE_MAILS.map((sample) => (
              <option key={sample.id} value={sample.id}>
                {sample.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Dynamic Auto-detection Alert Banner */}
        {detectionNotice && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600 flex-shrink-0" />
              <span>{detectionNotice}</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-normal bg-emerald-100 px-2 py-0.5 rounded">
              Auto-filled below
            </span>
          </div>
        )}

        {/* Postal Metadata Inputs with Auto-detect indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
              <span>Postal Service Category</span>
              {autoDetectedCategory ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-emerald-600 fill-emerald-600" />
                  Auto-detected
                </span>
              ) : (
                <span className="text-[10px] text-gray-400">Auto-detected on paste</span>
              )}
            </label>
            <select
              value={postalCategory}
              onChange={(e) => {
                onPostalCategoryChange(e.target.value as PostalCategory);
              }}
              className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-[#c91d24] focus:outline-none font-medium"
            >
              {POSTAL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Consignment / Tracking No */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
              <span>Consignment / Article ID</span>
              {autoDetectedTracking ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <Barcode className="w-2.5 h-2.5 text-emerald-600" />
                  Auto-detected
                </span>
              ) : (
                <span className="text-[10px] text-gray-400">Auto-detected on paste</span>
              )}
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => {
                onTrackingNumberChange(e.target.value);
              }}
              placeholder="e.g. EM938472910IN, MO-88492019"
              className="w-full text-xs font-mono font-bold border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-[#c91d24] focus:outline-none uppercase"
            />
          </div>

          {/* Staff Working Language */}
          <div className="bg-red-50/60 p-2.5 rounded-lg border border-red-200">
            <label className="block text-xs font-bold text-red-900 mb-1 flex items-center justify-between">
              <span>कर्मचारी की भाषा (Staff Language)</span>
              <span className="text-[10px] font-normal text-red-700">Translate INTO:</span>
            </label>
            <select
              value={staffLanguage}
              onChange={(e) => onStaffLanguageChange(e.target.value)}
              className="w-full text-xs border border-red-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-900 font-semibold focus:ring-2 focus:ring-[#c91d24] focus:outline-none"
            >
              {INDIAN_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.name}>
                  {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Text Area for Customer Mail */}
        <div className="relative">
          <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
            <span>Customer Email / Letter Content</span>
            {scriptInfo.name && (
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Detected Script: {scriptInfo.name} ({Math.round(scriptInfo.confidence * 100)}%)
              </span>
            )}
          </label>
          <textarea
            value={mailText}
            onChange={(e) => processInputText(e.target.value)}
            onPaste={handlePaste}
            rows={7}
            placeholder="Paste incoming customer email or letter here in Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, etc... The service category and consignment/article ID will be automatically detected immediately upon pasting."
            className="w-full text-xs sm:text-sm p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c91d24] focus:border-[#c91d24] outline-none leading-relaxed font-sans bg-gray-50/50 focus:bg-white transition"
          />

          <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500">
            <span>Characters: {mailText.length}</span>
            {mailText.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setAutoDetectedCategory(null);
                  setAutoDetectedTracking(null);
                  setDetectionNotice(null);
                }}
                className="text-gray-400 hover:text-red-600 transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear text</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onAnalyzeAndTranslate}
            disabled={isLoading || !mailText.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs sm:text-sm font-bold px-6 py-3 rounded-lg bg-[#c91d24] hover:bg-[#a6141a] text-white shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>डाक विश्लेषण एवं अनुवाद जारी है... (Translating...)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#ffcb05]" />
                <span>अनुवाद एवं विश्लेषण करें (Analyze & Translate to {staffLanguage})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
