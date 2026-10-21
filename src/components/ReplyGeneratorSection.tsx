import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  Copy,
  Check,
  Volume2,
  Mail,
  ExternalLink,
  ShieldCheck,
  Save,
  Cpu,
  Layers,
  FileCheck2,
  RotateCcw,
} from 'lucide-react';
import { ReplyTone, ReplyResult } from '../types/index.ts';
import {
  STANDARD_POSTAL_TEMPLATES,
  normalizeLetterParagraphs,
  formatFullEmailReply,
} from '../utils/dakUtils.ts';

interface ReplyGeneratorSectionProps {
  staffLanguage: string;
  sourceLanguage: string;
  trackingNumber?: string;
  customerName?: string;
  customerEmail?: string;
  docketNumber: string;
  staffReply: string;
  onStaffReplyChange: (reply: string) => void;
  replyTone: ReplyTone;
  onReplyToneChange: (tone: ReplyTone) => void;
  onGenerateReply: () => void;
  isLoading: boolean;
  replyResult: ReplyResult | null;
  onSaveToRegister: () => void;
  isSaved: boolean;
}

export const ReplyGeneratorSection: React.FC<ReplyGeneratorSectionProps> = ({
  staffLanguage,
  sourceLanguage,
  trackingNumber,
  customerName,
  customerEmail,
  docketNumber,
  staffReply,
  onStaffReplyChange,
  replyTone,
  onReplyToneChange,
  onGenerateReply,
  isLoading,
  replyResult,
  onSaveToRegister,
  isSaved,
}) => {
  const [copyState, setCopyState] = useState<'none' | 'all' | 'body' | 'subject'>('none');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copyFeedbackNotice, setCopyFeedbackNotice] = useState<string | null>(null);

  const handleApplyTemplate = (tplId: string) => {
    const tpl = STANDARD_POSTAL_TEMPLATES.find((t) => t.id === tplId);
    if (!tpl) return;
    let text = tpl.text
      .replace(/{{TRACKING}}/g, trackingNumber || '[Article ID]')
      .replace(/{{DOCKET}}/g, docketNumber)
      .replace(/{{CUSTOMER}}/g, customerName || 'Dear Customer');
    onStaffReplyChange(text);
  };

  // Copy full email formatted for direct paste into Gmail, Outlook, or webmail
  const handleCopyFullEmail = () => {
    if (!replyResult) return;
    const fullEmail = formatFullEmailReply({
      subject: replyResult.subjectLine,
      recipientEmail: customerEmail || undefined,
      body: replyResult.senderLanguageReply,
    });
    navigator.clipboard.writeText(fullEmail);
    setCopyState('all');
    setCopyFeedbackNotice('✓ Full email format copied to clipboard! Paste into Gmail / Outlook and send.');
    setTimeout(() => {
      setCopyState('none');
      setCopyFeedbackNotice(null);
    }, 3500);
  };

  const handleCopyBodyOnly = () => {
    if (!replyResult) return;
    const cleanBody = normalizeLetterParagraphs(replyResult.senderLanguageReply);
    navigator.clipboard.writeText(cleanBody);
    setCopyState('body');
    setCopyFeedbackNotice('✓ Email body copied to clipboard!');
    setTimeout(() => {
      setCopyState('none');
      setCopyFeedbackNotice(null);
    }, 2500);
  };

  const handleCopySubjectOnly = () => {
    if (!replyResult) return;
    navigator.clipboard.writeText(replyResult.subjectLine);
    setCopyState('subject');
    setCopyFeedbackNotice('✓ Subject line copied!');
    setTimeout(() => {
      setCopyState('none');
      setCopyFeedbackNotice(null);
    }, 2500);
  };

  const handleOpenMailClient = () => {
    if (!replyResult) return;
    const to = customerEmail || '';
    const subject = encodeURIComponent(replyResult.subjectLine);
    const body = encodeURIComponent(normalizeLetterParagraphs(replyResult.senderLanguageReply));
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  const handleSpeakReply = () => {
    if (!('speechSynthesis' in window) || !replyResult) {
      alert('Speech synthesis is not available in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanBody = normalizeLetterParagraphs(replyResult.senderLanguageReply);
    const utterance = new SpeechSynthesisUtterance(cleanBody);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Split paragraphs for pristine letter layout
  const regionalParagraphs = replyResult
    ? normalizeLetterParagraphs(replyResult.senderLanguageReply)
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  const reverseParagraphs = replyResult
    ? normalizeLetterParagraphs(replyResult.reverseTranslation)
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden space-y-4">
      {/* Section Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-md">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              2. ग्राहक की भाषा में ईमेल उत्तर तैयार करें (Compose Multilingual Email Reply)
            </h2>
            <p className="text-[11px] text-gray-500">
              Draft your reply in your language ({staffLanguage}). The system will generate a properly formatted official email in {sourceLanguage} ready to copy and send.
            </p>
          </div>
        </div>

        {/* Quick Postal Template Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium hidden sm:inline">Postal Template:</span>
          <select
            onChange={(e) => handleApplyTemplate(e.target.value)}
            defaultValue=""
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="" disabled>
              Insert Departmental Standard Template...
            </option>
            {STANDARD_POSTAL_TEMPLATES.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Reply Drafting Box */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <label className="text-xs font-semibold text-gray-700">
              Staff Response Draft (in {staffLanguage})
            </label>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 font-medium">Departmental Tone:</span>
              <select
                value={replyTone}
                onChange={(e) => onReplyToneChange(e.target.value as ReplyTone)}
                className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-800 focus:ring-1 focus:ring-emerald-600"
              >
                <option value="formal">शासकीय एवं औपचारिक (Formal Govt)</option>
                <option value="courteous">विनम्र एवं सहायक (Courteous & Reassuring)</option>
                <option value="compliance">नियमानुसार (Strict Postal Manual Rules)</option>
              </select>
            </div>
          </div>

          <textarea
            value={staffReply}
            onChange={(e) => onStaffReplyChange(e.target.value)}
            rows={5}
            placeholder={`Type your reply to the customer in ${staffLanguage} (e.g. "We have investigated your speed post parcel. It has reached Chennai NSH and will be delivered by tomorrow afternoon...")...`}
            className="w-full text-xs sm:text-sm p-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none leading-relaxed font-sans bg-gray-50/50 focus:bg-white transition"
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onGenerateReply}
            disabled={isLoading || !staffReply.trim()}
            className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold px-6 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>ईमेल उत्तर तैयार हो रहा है... (Generating {sourceLanguage} Email...)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>ग्राहक की भाषा ({sourceLanguage}) में ईमेल उत्तर बनाएं</span>
              </>
            )}
          </button>
        </div>

        {/* Copy Feedback Notification Banner */}
        {copyFeedbackNotice && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between shadow animate-fadeIn">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-amber-300" />
              <span>{copyFeedbackNotice}</span>
            </div>
            <span className="text-[11px] font-normal opacity-90">Ready to send</span>
          </div>
        )}

        {/* Reply Result Presentation */}
        {replyResult && (
          <div className="pt-4 border-t border-gray-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-emerald-900 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ईमेल उत्तर तैयार है (Ready-to-Send Email in {replyResult.senderLanguage})</span>
                </span>
                <span className="text-[11px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-purple-600" />
                  {replyResult.modelUsed}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSpeakReply}
                  className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                    isSpeaking
                      ? 'bg-emerald-700 text-white border-emerald-800'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  title="Listen in customer's language"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
                </button>

                <button
                  onClick={handleCopyFullEmail}
                  className="px-4 py-2 bg-[#c91d24] hover:bg-[#a6141a] text-white rounded-lg text-xs font-bold flex items-center gap-2 transition shadow cursor-pointer"
                  title="Copy complete email format to paste into your email client"
                >
                  {copyState === 'all' ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copyState === 'all' ? 'Copied Full Email!' : 'Copy Full Email Reply'}</span>
                </button>
              </div>
            </div>

            {/* Email Layout Grid: Customer's Language on Left, Staff Verification on Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ready-to-Send Email Card (Customer's Language) */}
              <div className="bg-emerald-50/40 rounded-xl border-2 border-emerald-300 overflow-hidden shadow-sm flex flex-col">
                {/* Email Header */}
                <div className="bg-emerald-100/70 p-3.5 border-b border-emerald-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 uppercase text-[11px] tracking-wider flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-emerald-700" />
                      <span>ग्राहक को भेजा जाने वाला ईमेल ({replyResult.senderLanguage})</span>
                    </span>
                    <button
                      onClick={handleCopySubjectOnly}
                      className="text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold bg-white px-2 py-0.5 rounded border border-emerald-300 transition cursor-pointer"
                      title="Copy subject only"
                    >
                      {copyState === 'subject' ? '✓ Copied' : 'Copy Subject'}
                    </button>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-xs space-y-1">
                    {customerEmail && (
                      <div className="text-[11px] text-gray-500">
                        <span className="font-bold text-gray-600 mr-1.5">To:</span>
                        <span className="font-mono text-gray-800">{customerEmail}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-gray-600 mr-1.5">विषय / Subject:</span>
                      <span className="font-bold text-gray-900 select-all">
                        {replyResult.subjectLine}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Formatted Email Body with Distinct Paragraphs */}
                <div className="p-4 sm:p-5 bg-white flex-1 text-xs sm:text-sm text-gray-900 font-sans min-h-[180px] select-all space-y-3">
                  {regionalParagraphs.map((para, idx) => (
                    <p key={idx} className="whitespace-pre-line leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>

                {/* Email Footer Bar */}
                <div className="bg-emerald-50 px-3.5 py-2.5 border-t border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] text-emerald-800 font-medium">
                    ✓ Official Departmental Email Format
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyBodyOnly}
                      className="text-xs text-gray-700 hover:text-emerald-800 font-semibold bg-white px-2.5 py-1 rounded border border-gray-300 transition cursor-pointer"
                    >
                      {copyState === 'body' ? '✓ Copied Body' : 'Copy Body Only'}
                    </button>
                    {customerEmail && (
                      <button
                        onClick={handleOpenMailClient}
                        className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-1 bg-emerald-100/80 px-2.5 py-1 rounded border border-emerald-300 transition cursor-pointer"
                        title="Open default email application"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open in Mail</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Staff Verification Card (Reverse Translation into Staff Language) */}
              <div className="bg-gray-50 rounded-xl border border-gray-300 overflow-hidden shadow-sm flex flex-col">
                {/* Header */}
                <div className="bg-gray-100 p-3.5 border-b border-gray-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 uppercase text-[11px] tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>सत्यापन अनुवाद (Verification in {staffLanguage})</span>
                    </span>
                    <span className="text-[10px] text-gray-500 font-normal">Meaning Check</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-gray-200 text-xs">
                    <span className="font-bold text-gray-500 mr-1.5">Subject:</span>
                    <span className="font-semibold text-gray-800">
                      {replyResult.reverseSubjectLine || replyResult.subjectLine}
                    </span>
                  </div>
                </div>

                {/* Formatted Reverse Body with Distinct Paragraphs */}
                <div className="p-4 sm:p-5 bg-white flex-1 text-xs sm:text-sm text-gray-800 font-sans min-h-[180px] space-y-3 italic">
                  {reverseParagraphs.map((para, idx) => (
                    <p key={idx} className="whitespace-pre-line leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-3.5 py-2.5 border-t border-gray-200 text-[11px] text-gray-500">
                  Verify this {staffLanguage} text to ensure the regional reply conveys your exact departmental intention.
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-gray-500 font-mono">
                Docket Reference: <strong className="text-gray-800">{docketNumber}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSaveToRegister}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border transition cursor-pointer ${
                    isSaved
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {isSaved ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{isSaved ? 'Saved in Dak Register' : 'Save to Register'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyFullEmail}
                  className="flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-lg bg-[#c91d24] hover:bg-[#a6141a] text-white shadow transition cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Complete Email Format</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
