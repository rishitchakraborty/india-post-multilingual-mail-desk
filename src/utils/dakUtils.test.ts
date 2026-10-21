import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectScriptLanguage,
  generateDocketNumber,
  extractEntitiesRegex,
  autoDetectPostalMetadata,
  normalizeLetterParagraphs,
  formatFullEmailReply,
  INDIAN_LANGUAGES,
  SAMPLE_MAILS
} from './dakUtils.ts';

test('detectScriptLanguage identifies Tamil script', () => {
  const tamilSample = 'மதிப்பிற்குரிய அஞ்சலக அதிகாரி அவர்களுக்கு வணக்கம்';
  const result = detectScriptLanguage(tamilSample);
  assert.equal(result.code, 'ta');
  assert.equal(result.name, 'Tamil');
  assert.ok(result.confidence > 0.8);
});

test('detectScriptLanguage identifies Bengali script', () => {
  const bengaliSample = 'শ্রদ্ধাপূর্বক জানাচ্ছি যে আমার পিতার ডাক জীবন বীমা';
  const result = detectScriptLanguage(bengaliSample);
  assert.equal(result.code, 'bn');
  assert.equal(result.name, 'Bengali / Assamese');
  assert.ok(result.confidence > 0.8);
});

test('detectScriptLanguage identifies Devanagari script (Hindi/Marathi)', () => {
  const devanagariSample = 'सेवा में, प्रवर अधीक्षक डाकघर वाराणसी कैंट';
  const result = detectScriptLanguage(devanagariSample);
  assert.equal(result.code, 'hi');
  assert.equal(result.name, 'Hindi / Devanagari');
  assert.ok(result.confidence > 0.8);
});

test('detectScriptLanguage identifies Gujarati script', () => {
  const gujaratiSample = 'આદરણીય પોસ્ટમાસ્ટર સાહેબ, નવરંગપુરા મુખ્ય ડાકઘર';
  const result = detectScriptLanguage(gujaratiSample);
  assert.equal(result.code, 'gu');
  assert.equal(result.name, 'Gujarati');
  assert.ok(result.confidence > 0.8);
});

test('detectScriptLanguage identifies English text', () => {
  const englishSample = 'Please check the status of my Speed Post parcel consignment';
  const result = detectScriptLanguage(englishSample);
  assert.equal(result.code, 'en');
  assert.equal(result.name, 'English');
});

test('generateDocketNumber returns compliant India Post docket string', () => {
  const docket = generateDocketNumber('Tamil Nadu Circle (Chennai GPO)');
  assert.ok(docket.startsWith('IP/TAM/'));
  assert.match(docket, /^IP\/[A-Z]{3}\/\d{4}\/TR-\d{4}$/);
});

test('extractEntitiesRegex parses tracking number, PIN code, and mobile phone', () => {
  const sample = `Article EM938472910IN booked to Chennai 600017 with contact 9840123456 and email user@example.com.`;
  const entities = extractEntitiesRegex(sample);
  assert.equal(entities.trackingNumber, 'EM938472910IN');
  assert.equal(entities.pinCode, '600017');
  assert.equal(entities.contactNumber, '9840123456');
  assert.equal(entities.senderEmail, 'user@example.com');
});

test('autoDetectPostalMetadata correctly identifies Speed Post and article ID from standard mail', () => {
  const sample = `Dear India Post, please update tracking for Speed Post EM938472910IN sent to Madurai.`;
  const meta = autoDetectPostalMetadata(sample);
  assert.equal(meta.category, 'Speed Post');
  assert.equal(meta.trackingNumber, 'EM938472910IN');
});

test('autoDetectPostalMetadata correctly identifies category and tracking from email headers', () => {
  const emailSample = `From: ramesh.k@gmail.com
To: cpc.delhi@indiapost.gov.in
Date: 18 Oct 2026
Subject: Speed Post parcel status delayed - Article ID: EK928341205IN

Dear Postmaster,
Please update on parcel status.`;

  const meta = autoDetectPostalMetadata(emailSample);
  assert.equal(meta.category, 'Speed Post');
  assert.equal(meta.trackingNumber, 'EK928341205IN');
  assert.equal(meta.email, 'ramesh.k@gmail.com');
});

test('autoDetectPostalMetadata correctly identifies PLI policy', () => {
  const sample = `Sir, regarding death claim under Postal Life Insurance policy PLI-WB-2014-88412 in Kolkata.`;
  const meta = autoDetectPostalMetadata(sample);
  assert.equal(meta.category, 'Postal Life Insurance (PLI)');
  assert.equal(meta.trackingNumber, 'PLI-WB-2014-88412');
});

test('autoDetectPostalMetadata correctly identifies Money Order', () => {
  const sample = `विषय: इलेक्ट्रॉनिक मनी ऑर्डर क्र. MO-88492019-IN न मिळाल्याबाबत तक्रार.`;
  const meta = autoDetectPostalMetadata(sample);
  assert.equal(meta.category, 'Money Order (e-MO)');
  assert.equal(meta.trackingNumber, 'MO-88492019-IN');
});

test('autoDetectPostalMetadata correctly identifies Sukanya Samriddhi Yojana', () => {
  const sample = `સુકન્યા સમૃદ્ધિ યોજના ખાતું SSY-AHM-49201 ટ્રાન્સફર કરવા બાબત.`;
  const meta = autoDetectPostalMetadata(sample);
  assert.equal(meta.category, 'Sukanya Samriddhi Yojana (SSY)');
  assert.equal(meta.trackingNumber, 'SSY-AHM-49201');
});

test('normalizeLetterParagraphs removes excessive newlines and escaped newlines', () => {
  const unformatted = 'Respected Sir,\\n\\nI am writing regarding my parcel.\\n\\n\\n\\nYours faithfully,\\nJohn Doe';
  const cleaned = normalizeLetterParagraphs(unformatted);
  assert.equal(
    cleaned,
    'Respected Sir,\n\nI am writing regarding my parcel.\n\nYours faithfully,\nJohn Doe'
  );
});

test('formatFullEmailReply creates valid ready-to-paste email format', () => {
  const formatted = formatFullEmailReply({
    subject: '[India Post] Speed Post Resolution EM938472910IN',
    recipientEmail: 'user@example.com',
    body: 'Dear Customer,\n\nYour parcel is dispatched.\n\nYours faithfully,\nIndia Post',
  });
  assert.ok(formatted.includes('To: user@example.com'));
  assert.ok(formatted.includes('Subject: [India Post] Speed Post Resolution EM938472910IN'));
  assert.ok(formatted.includes('Your parcel is dispatched.'));
});

test('All official Indian languages are registered with valid codes', () => {
  assert.ok(INDIAN_LANGUAGES.length >= 22);
  const hindi = INDIAN_LANGUAGES.find(l => l.code === 'hi');
  const tamil = INDIAN_LANGUAGES.find(l => l.code === 'ta');
  const bengali = INDIAN_LANGUAGES.find(l => l.code === 'bn');
  assert.ok(hindi && hindi.nativeName === 'हिन्दी');
  assert.ok(tamil && tamil.nativeName === 'தமிழ்');
  assert.ok(bengali && bengali.nativeName === 'বাংলা');
});

test('Preloaded sample mails exist and are valid', () => {
  assert.equal(SAMPLE_MAILS.length, 5);
  for (const mail of SAMPLE_MAILS) {
    assert.ok(mail.id);
    assert.ok(mail.text.length > 50);
    assert.ok(mail.category);
    assert.ok(mail.languageCode);
  }
});
