import React from 'react';
import { Mail, Settings, Archive, Sparkles, Server, ShieldCheck, HelpCircle } from 'lucide-react';
import { LLMConfig } from '../types/index.ts';

interface HeaderProps {
  llmConfig: LLMConfig;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  onNewDak: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  llmConfig,
  onOpenSettings,
  onOpenHistory,
  historyCount,
  onNewDak,
}) => {
  const isQwen = llmConfig.provider === 'qwen_self_hosted';

  return (
    <header className="bg-gradient-to-r from-[#b31317] via-[#c91d24] to-[#8f0e13] text-white shadow-lg border-b-4 border-[#ffcb05]">
      {/* Top Govt Bar */}
      <div className="bg-[#1f2937]/90 text-xs px-4 py-1 flex flex-wrap justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-amber-300">भारत सरकार</span>
          <span className="text-gray-400">|</span>
          <span>Government of India</span>
          <span className="text-gray-400">|</span>
          <span>संचार मंत्रालय (Ministry of Communications)</span>
        </div>
        <div className="flex items-center gap-3 text-gray-300 text-[11px]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Official Postal Intranet Portal
          </span>
          <span className="text-gray-500">•</span>
          <span>22 Scheduled Indian Languages</span>
        </div>
      </div>

      {/* Main Header Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Department Branding */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={onNewDak}>
            <div className="relative w-12 h-12 bg-white rounded-lg p-1.5 shadow-md flex items-center justify-center flex-shrink-0 border-2 border-[#ffcb05]">
              {/* Emblem Logo */}
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <rect width="100" height="100" rx="16" fill="#C91D24" />
                <path d="M15 32 L50 62 L85 32 L85 78 L15 78 Z" fill="#FFCB05" />
                <path
                  d="M15 32 L50 60 L85 32"
                  fill="none"
                  stroke="#C91D24"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <circle cx="50" cy="42" r="6" fill="#C91D24" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  भारतीय डाक <span className="text-[#ffcb05] font-light">|</span> INDIA POST
                </h1>
                <span className="hidden sm:inline-block bg-[#ffcb05] text-[#8f0e13] font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                  Official
                </span>
              </div>
              <p className="text-xs sm:text-sm text-red-100 flex items-center gap-1.5">
                <span className="font-medium">डाक भाषांतर केंद्र</span>
                <span className="opacity-70">—</span>
                <span className="opacity-90">Multilingual Mail Desk & Regional Reply Portal</span>
              </p>
            </div>
          </div>

          {/* Engine Status & Navigation Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Active Model Indicator Pill */}
            <button
              onClick={onOpenSettings}
              className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition shadow-sm font-medium ${
                isQwen
                  ? 'bg-purple-950/80 border-purple-400/60 text-purple-200 hover:bg-purple-900'
                  : 'bg-emerald-950/80 border-emerald-400/60 text-emerald-200 hover:bg-emerald-900'
              }`}
              title="Click to configure AI Engine / Self-Hosted Qwen"
            >
              {isQwen ? (
                <>
                  <Server className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                  <span>
                    {llmConfig.qwenModel && llmConfig.qwenModel !== 'default'
                      ? `LLM: ${llmConfig.qwenModel}`
                      : 'Custom LLM / Self-Hosted'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Gemini 3.8 Flash Engine</span>
                </>
              )}
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded ml-1">Configure</span>
            </button>

            {/* History Register Button */}
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md border border-white/20 transition font-medium"
              title="View processed Dak Register"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Dak Register</span>
              {historyCount > 0 && (
                <span className="bg-[#ffcb05] text-[#8f0e13] font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                  {historyCount}
                </span>
              )}
            </button>

            {/* Model & Admin Settings */}
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 text-xs bg-white text-[#8f0e13] hover:bg-yellow-50 px-3.5 py-1.5 rounded-md shadow font-semibold transition"
              title="Admin and LLM Configuration"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Admin & LLM</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
