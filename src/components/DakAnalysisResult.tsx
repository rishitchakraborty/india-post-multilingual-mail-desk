import React, { useState } from 'react';
import {
  Languages,
  AlertCircle,
  Clock,
  User,
  MapPin,
  Phone,
  Barcode,
  Volume2,
  Copy,
  Check,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Cpu,
  Mail,
  FileText,
  Building2,
} from 'lucide-react';
import { TranslationResult } from '../types/index.ts';
import { normalizeLetterParagraphs } from '../utils/dakUtils.ts';

interface DakAnalysisResultProps {
  result: TranslationResult;
  originalText: string;
  staffLanguage: string;
  onProceedToReply: () => void;
}

export const DakAnalysisResult: React.FC<DakAnalysisResultProps> = ({
  result,
  originalText,
  staffLanguage,
  onProceedToReply,
}) => {
  const [activeTab, setActiveTab] = useState<'translated' | 'original'>('translated');
  const [copyState, setCopyState] = useState<'none' | 'letter' | 'subject'>('none');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const cleanLetterText = normalizeLetterParagraphs(result.translatedText);
  // Split paragraphs by double newlines for proper HTML letter typography
  const letterParagraphs = cleanLetterText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const handleCopyLetter = () => {
    const textToCopy = `Subject: ${result.subjectLine || result.postalIntent}\n\n${cleanLetterText}`;
    navigator.clipboard.writeText(textToCopy);
    setCopyState('letter');
    setTimeout(() => setCopyState('none'), 2000);
  };

  const handleCopySubject = () => {
    navigator.clipboard.writeText(result.subjectLine || result.postalIntent);
    setCopyState('subject');
    setTimeout(() => setCopyState('none'), 2000);
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanLetterText);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'Urgent / Grievance':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'High Priority':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden space-y-4">
      {/* Result Header Bar */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex items-center gap-1.5 font-bold text-xs bg-white text-gray-800 px-3 py-1 rounded-full border border-gray-300 shadow-sm">
            <Languages className="w-3.5 h-3.5 text-[#c91d24]" />
            <span>मूल भाषा (Source): {result.detectedLanguage}</span>
          </span>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border shadow-sm ${getUrgencyBadge(
              result.urgency
            )}`}
          >
            {result.urgency}
          </span>

          <span className="text-[11px] font-mono bg-white text-gray-600 px-2 py-0.5 rounded border border-gray-200 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-purple-600" />
            <span>{result.modelUsed}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSpeak}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition ${
              isSpeaking
                ? 'bg-red-600 text-white border-red-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            title="Listen to translated letter"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
          </button>

          <button
            onClick={handleCopyLetter}
            className="p-2 bg-white text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            title="Copy full translated letter"
          >
            {copyState === 'letter' ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {copyState === 'letter' ? 'Letter Copied!' : 'Copy Letter'}
            </span>
          </button>
        </div>
      </div>

      <div className="px-5 pb-5 space-y-4">
        {/* Executive Summary Card */}
        <div className="p-3.5 bg-amber-50/70 rounded-lg border border-amber-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 block">
                Executive Briefing (मुख्य सारांश)
              </span>
              <p className="text-xs sm:text-sm text-gray-800 font-medium mt-0.5 leading-relaxed">
                {result.summary}
              </p>
              <p className="text-xs text-amber-800 mt-1">
                <span className="font-semibold">Postal Intent:</span> {result.postalIntent}
              </p>
            </div>
          </div>
        </div>

        {/* Extracted Key Postal Entities Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#c91d24] flex-shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-gray-500 block">Customer Name</span>
              <span className="font-semibold text-gray-800 truncate block">
                {result.extractedEntities.senderName || 'Not Mentioned'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Barcode className="w-4 h-4 text-[#c91d24] flex-shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-gray-500 block">Consignment / Article ID</span>
              <span className="font-mono font-bold text-red-700 truncate block">
                {result.extractedEntities.trackingNumber || 'N/A'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#c91d24] flex-shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-gray-500 block">Delivery PIN / Office</span>
              <span className="font-mono font-semibold text-gray-800 block">
                {result.extractedEntities.pinCode ||
                  result.extractedEntities.destinationOffice ||
                  'N/A'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#c91d24] flex-shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-gray-500 block">Contact Phone / Email</span>
              <span className="font-mono font-semibold text-gray-800 block truncate">
                {result.extractedEntities.contactNumber ||
                  result.extractedEntities.senderEmail ||
                  'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Translation vs Original Tabs */}
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="flex border-b border-gray-200 bg-gray-50 px-3 pt-2">
            <button
              onClick={() => setActiveTab('translated')}
              className={`py-2 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'translated'
                  ? 'border-[#c91d24] text-[#c91d24] bg-white rounded-t-lg shadow-sm'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>अनुवादित पत्र (Properly Formatted Letter in {staffLanguage})</span>
            </button>
            <button
              onClick={() => setActiveTab('original')}
              className={`py-2 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'original'
                  ? 'border-[#c91d24] text-[#c91d24] bg-white rounded-t-lg shadow-sm'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>मूल पत्र (Original {result.detectedLanguage})</span>
            </button>
          </div>

          {activeTab === 'translated' ? (
            <div className="p-5 sm:p-6 bg-white space-y-4">
              {/* Formal Postal Letter Header Strip */}
              <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 text-xs space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
                  <span className="font-bold text-gray-700 flex items-center gap-1.5 uppercase text-[11px] tracking-wide">
                    <Building2 className="w-3.5 h-3.5 text-[#c91d24]" />
                    <span>Official Postal Communication Translation</span>
                  </span>
                  <button
                    onClick={handleCopySubject}
                    className="text-[11px] text-gray-600 hover:text-[#c91d24] font-semibold bg-white px-2 py-0.5 rounded border border-gray-300 transition cursor-pointer"
                  >
                    {copyState === 'subject' ? '✓ Copied Subject' : 'Copy Subject Only'}
                  </button>
                </div>

                {/* Email / Letter Meta Grid */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-gray-500 w-16 flex-shrink-0">Subject:</span>
                    <span className="font-bold text-gray-900 leading-snug">
                      {result.subjectLine || result.postalIntent}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-gray-200/70 text-[11px] text-gray-600">
                    <div>
                      <span className="font-semibold text-gray-500">From: </span>
                      <span>{result.extractedEntities.senderName || 'Customer'}</span>
                      {result.extractedEntities.senderEmail && (
                        <span className="text-gray-400 font-mono ml-1">
                          &lt;{result.extractedEntities.senderEmail}&gt;
                        </span>
                      )}
                    </div>
                    {result.extractedEntities.trackingNumber && (
                      <div>
                        <span className="font-semibold text-gray-500">Consignment ID: </span>
                        <span className="font-mono font-bold text-red-700">
                          {result.extractedEntities.trackingNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Formatted Letter Body with Paragraph Spacing */}
              <div className="p-4 sm:p-5 bg-white border border-gray-200 rounded-xl shadow-sm text-xs sm:text-sm text-gray-900 font-sans leading-relaxed space-y-3.5">
                {letterParagraphs.map((para, idx) => (
                  <p key={idx} className="whitespace-pre-line leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-5 bg-gray-50 text-xs sm:text-sm leading-relaxed text-gray-900 whitespace-pre-wrap font-sans min-h-[160px]">
              {originalText}
            </div>
          )}
        </div>

        {/* Suggested Departmental Action Points */}
        {result.suggestedActionPoints && result.suggestedActionPoints.length > 0 && (
          <div className="bg-emerald-50/60 p-3.5 rounded-lg border border-emerald-200">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>विभागीय कार्रवाई सुझाव (Suggested Postal Action Points)</span>
            </span>
            <ul className="space-y-1.5 text-xs text-gray-800">
              {result.suggestedActionPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="font-bold text-emerald-700">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA to Compose Reply */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onProceedToReply}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow transition cursor-pointer"
          >
            <span>Proceed to Step 2: Compose Email Reply in Customer's Language</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
