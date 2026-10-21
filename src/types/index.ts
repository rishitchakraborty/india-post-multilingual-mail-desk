export type LLMProvider = 'gemini' | 'qwen_self_hosted';

export interface LLMConfig {
  provider: LLMProvider;
  geminiModel: string;
  qwenEndpoint: string;
  qwenModel: string;
  qwenApiKey?: string;
  temperature: number;
  maxTokens: number;
  fallbackToGemini: boolean;
}

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  region: string;
}

export type PostalCategory =
  | 'Speed Post'
  | 'Registered Post'
  | 'Money Order (e-MO)'
  | 'Postal Life Insurance (PLI)'
  | 'Post Office Savings Bank (POSB)'
  | 'Sukanya Samriddhi Yojana (SSY)'
  | 'Parcels & Logistics'
  | 'Philately'
  | 'General Dak / Grievance';

export type ReplyTone = 'formal' | 'courteous' | 'compliance' | 'urgent_alert';

export interface ExtractedPostalEntities {
  senderName?: string;
  senderEmail?: string;
  trackingNumber?: string;
  pinCode?: string;
  dateMentioned?: string;
  contactNumber?: string;
  sourceOffice?: string;
  destinationOffice?: string;
}

export interface TranslationResult {
  detectedLanguage: string;
  detectedLanguageCode: string;
  confidence: number;
  subjectLine: string;
  translatedText: string;
  summary: string;
  postalIntent: string;
  urgency: 'Routine' | 'High Priority' | 'Urgent / Grievance';
  extractedEntities: ExtractedPostalEntities;
  suggestedActionPoints: string[];
  modelUsed: string;
}

export interface ReplyResult {
  subjectLine: string;
  reverseSubjectLine: string;
  senderLanguageReply: string;
  reverseTranslation: string;
  senderLanguage: string;
  staffLanguage: string;
  officialSalutation: string;
  officialSignOff: string;
  senderEmail?: string;
  modelUsed: string;
}

export interface DakRecord {
  id: string;
  docketNumber: string;
  createdAt: string;
  postalCircle: string;
  category: PostalCategory;
  trackingNumber?: string;
  customerName?: string;
  customerEmail?: string;
  subjectLine?: string;
  originalText: string;
  sourceLanguage: string;
  staffLanguage: string;
  translatedText: string;
  summary: string;
  urgency: 'Routine' | 'High Priority' | 'Urgent / Grievance';
  extractedEntities: ExtractedPostalEntities;
  suggestedActionPoints: string[];
  staffReplyDraft?: string;
  replySubject?: string;
  senderLanguageReply?: string;
  reverseTranslation?: string;
  replyTone?: ReplyTone;
  status: 'Received' | 'Translated' | 'Reply Generated' | 'Dispatched';
  modelUsed: string;
}
