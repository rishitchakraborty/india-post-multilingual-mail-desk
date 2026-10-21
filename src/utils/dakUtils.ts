import type { LanguageInfo, PostalCategory, ExtractedPostalEntities } from '../types/index.ts';

export const INDIAN_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', script: 'Latin', region: 'All India' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari', region: 'North & Central India' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali', region: 'West Bengal, Tripura' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil', region: 'Tamil Nadu, Puducherry' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu', region: 'Andhra Pradesh, Telangana' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari', region: 'Maharashtra, Goa' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati', region: 'Gujarat' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada', region: 'Karnataka' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam', region: 'Kerala, Lakshadweep' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', script: 'Odia', region: 'Odisha' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi', region: 'Punjab, Chandigarh' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', script: 'Arabic-Persian', region: 'Telangana, UP, J&K, Delhi' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', script: 'Bengali-Assamese', region: 'Assam' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', script: 'Devanagari', region: 'Bihar, Jharkhand' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', script: 'Devanagari', region: 'Pan-India' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', script: 'Devanagari', region: 'Sikkim, West Bengal' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', script: 'Devanagari', region: 'Goa, Karnataka' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', script: 'Devanagari', region: 'Jammu & Kashmir' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', script: 'Arabic/Devanagari', region: 'Gujarat, Rajasthan' },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্', script: 'Bengali/Meitei', region: 'Manipur' },
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो', script: 'Devanagari', region: 'Assam' },
  { code: 'sat', name: 'Santali', nativeName: 'संथाली', script: 'Ol Chiki', region: 'Jharkhand, Odisha' }
];

export const POSTAL_CIRCLES = [
  'Delhi Circle (Head GPO)',
  'Maharashtra Circle (Mumbai GPO)',
  'Tamil Nadu Circle (Chennai GPO)',
  'West Bengal Circle (Kolkata GPO)',
  'Karnataka Circle (Bengaluru GPO)',
  'Uttar Pradesh Circle (Lucknow GPO)',
  'Gujarat Circle (Ahmedabad GPO)',
  'Kerala Circle (Thiruvananthapuram GPO)',
  'Telangana Circle (Hyderabad GPO)',
  'Andhra Pradesh Circle (Vijayawada)',
  'Punjab Circle (Chandigarh)',
  'Rajasthan Circle (Jaipur)',
  'Bihar Circle (Patna)',
  'Odisha Circle (Bhubaneswar)',
  'Madhya Pradesh Circle (Bhopal)',
  'Assam Circle (Guwahati)',
  'North East Circle (Shillong)',
  'Jammu & Kashmir Circle (Srinagar)'
];

export const POSTAL_CATEGORIES: PostalCategory[] = [
  'Speed Post',
  'Registered Post',
  'Money Order (e-MO)',
  'Postal Life Insurance (PLI)',
  'Post Office Savings Bank (POSB)',
  'Sukanya Samriddhi Yojana (SSY)',
  'Parcels & Logistics',
  'Philately',
  'General Dak / Grievance'
];

/**
 * Heuristic client-side script detector based on Unicode ranges.
 * Used for fast pre-filtering, character counting, and instant feedback.
 */
export function detectScriptLanguage(text: string): { code: string; name: string; confidence: number } {
  if (!text || text.trim().length === 0) {
    return { code: 'unknown', name: 'Unknown', confidence: 0 };
  }

  let devanagariCount = 0;
  let bengaliCount = 0;
  let tamilCount = 0;
  let teluguCount = 0;
  let gujaratiCount = 0;
  let kannadaCount = 0;
  let malayalamCount = 0;
  let gurmukhiCount = 0;
  let odiaCount = 0;
  let arabicUrduCount = 0;
  let latinCount = 0;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0x0900 && code <= 0x097f) devanagariCount++;
    else if (code >= 0x0980 && code <= 0x09ff) bengaliCount++;
    else if (code >= 0x0b80 && code <= 0x0bff) tamilCount++;
    else if (code >= 0x0c00 && code <= 0x0c7f) teluguCount++;
    else if (code >= 0x0a80 && code <= 0x0aff) gujaratiCount++;
    else if (code >= 0x0c80 && code <= 0x0cff) kannadaCount++;
    else if (code >= 0x0d00 && code <= 0x0d7f) malayalamCount++;
    else if (code >= 0x0a00 && code <= 0x0a7f) gurmukhiCount++;
    else if (code >= 0x0b00 && code <= 0x0b7f) odiaCount++;
    else if (code >= 0x0600 && code <= 0x06ff) arabicUrduCount++;
    else if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) latinCount++;
  }

  const scores = [
    { code: 'hi', name: 'Hindi / Devanagari', count: devanagariCount },
    { code: 'bn', name: 'Bengali / Assamese', count: bengaliCount },
    { code: 'ta', name: 'Tamil', count: tamilCount },
    { code: 'te', name: 'Telugu', count: teluguCount },
    { code: 'gu', name: 'Gujarati', count: gujaratiCount },
    { code: 'kn', name: 'Kannada', count: kannadaCount },
    { code: 'ml', name: 'Malayalam', count: malayalamCount },
    { code: 'pa', name: 'Punjabi', count: gurmukhiCount },
    { code: 'or', name: 'Odia', count: odiaCount },
    { code: 'ur', name: 'Urdu', count: arabicUrduCount },
    { code: 'en', name: 'English', count: latinCount },
  ];

  scores.sort((a, b) => b.count - a.count);
  const total = scores.reduce((sum, s) => sum + s.count, 0);

  if (total === 0 || scores[0].count === 0) {
    return { code: 'en', name: 'English', confidence: 0.5 };
  }

  const top = scores[0];
  const confidence = Math.min(0.99, Math.round((top.count / total) * 100) / 100);

  return { code: top.code, name: top.name, confidence };
}

/**
 * Generate official India Post Docket Reference Number.
 * Format: IP/<CIRCLE_CODE>/<YEAR>/<SERIES>-<RANDOM>
 */
export function generateDocketNumber(circleName: string = 'Delhi Circle'): string {
  const year = new Date().getFullYear();
  const circlePrefix = circleName.split(' ')[0].substring(0, 3).toUpperCase() || 'DEL';
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const letterCode = 'TR'; // Translation & Resolution
  return `IP/${circlePrefix}/${year}/${letterCode}-${randomDigits}`;
}

export function formatPostalDate(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Realistic sample customer letters received by India Post
 */
export interface SampleMail {
  id: string;
  title: string;
  language: string;
  languageCode: string;
  category: PostalCategory;
  trackingNumber?: string;
  text: string;
}

export const SAMPLE_MAILS: SampleMail[] = [
  {
    id: 'sample-ta-1',
    title: 'Tamil - Speed Post Parcel Delay (Chennai to Madurai)',
    language: 'Tamil',
    languageCode: 'ta',
    category: 'Speed Post',
    trackingNumber: 'EM938472910IN',
    text: `மதிப்பிற்குரிய அஞ்சலக அதிகாரி அவர்களுக்கு,\n\nவணக்கம். நான் கடந்த 12-ஆம் தேதி சென்னை தி.நகர் தலைமை அஞ்சலகத்திலிருந்து எனது மகனின் கல்லூரி அசல் சான்றிதழ்களை ஸ்பீட் போஸ்ட் மூலம் மதுரைக்கு அனுப்பினேன். அதன் பதிவு எண்: EM938472910IN.\n\nஇணையதளத்தில் டிராக் செய்து பார்த்தபோது கடந்த 4 நாட்களாக தாம்பரம் தேசிய வரிசைப்படுத்தும் மையத்தில் (National Sorting Hub) இருப்பதாகவும், அடுத்த நகர்வு இல்லை எனவும் காட்டுகிறது. கல்லூரி சேர்க்கை கடைசி தேதி 25-ஆம் தேதி முடிவடைய உள்ளதால் நாங்கள் பெரும் மன உளைச்சலில் உள்ளோம். தயவுசெய்து எனது பார்சல் எங்குள்ளது என்பதை கண்டறிந்து உடனடியாக விநியோகம் செய்ய ஆவன செய்யுமாறு பணிவுடன் கேட்டுக்கொள்கிறேன்.\n\nநன்றி,\nசுந்தரராஜன் கே.\nஅலைபேசி: 9840123456\nசென்னை - 600017`
  },
  {
    id: 'sample-bn-1',
    title: 'Bengali - Postal Life Insurance (PLI) Claim Inquiry (Kolkata)',
    language: 'Bengali',
    languageCode: 'bn',
    category: 'Postal Life Insurance (PLI)',
    trackingNumber: 'PLI-WB-2014-88412',
    text: `মহাশয়,\n\nশ্রদ্ধাপূর্বক জানাচ্ছি যে আমার প্রয়াত পিতা বীরেন মজুমদারের একটি ডাক জীবন বীমা (Postal Life Insurance) পলিসি ছিল, যার নম্বর: PLI-WB-2014-88412। গত মাসে উনার আকস্মিক প্রয়াণ ঘটেছে।\n\nআমি উনার একমাত্র মনোনীত ব্যক্তি (Nominee)। শ্যামবাজার সাব পোস্ট অফিসে আমি মৃত্যুর প্রশংসাপত্র ও মূল পলিসি বন্ড সহ সমস্ত প্রয়োজনীয় কাগজপত্র জমা দিয়েছিলাম। আজ ২০ দিন অতিক্রান্ত হলেও ক্লেইম নিষ্পত্তির কোনো খবর পাইনি। পরবর্তী পদক্ষেপ কী এবং টাকা কবে নাগাদ আমার ব্যাংক অ্যাকাউন্টে জমা হবে অনুগ্রহ করে জানালে চিরকৃতজ্ঞ থাকব।\n\nবিনীত,\nদেবাশিস মজুমদার\nকলকাতা - ৭০০০৫৫\nফোন: ৯৮৩০০৭৬৫৪৩`
  },
  {
    id: 'sample-mr-1',
    title: 'Marathi - Pensioner e-Money Order Missing (Pune GPO)',
    language: 'Marathi',
    languageCode: 'mr',
    category: 'Money Order (e-MO)',
    trackingNumber: 'MO-88492019-IN',
    text: `प्रति, मा. पोस्टमास्तर सो.,\nपुणे मुख्य टपाल कार्यालय (Pune GPO).\n\nविषय: इलेक्ट्रॉनिक मनी ऑर्डर (e-MO) न मिळाल्याबाबत तक्रार.\n\nमहोदय,\nमी एक ज्येष्ठ नागरिक व सेवानिवृत्त शिक्षक आहे. माझे मासिक पेन्शन मनी ऑर्डरद्वारे सातारा उप-टपाल कार्यालयातून दर महिन्याला पाठवले जाते. या महिन्याचे मनी ऑर्डर क्र. MO-88492019-IN दिनांक ०५ तारखेला बुक केले गेले होते. रक्कम ₹१४,५००/- आहे.\n\nपरंतु आज २० तारीख झाली तरी आमच्या कोथरूड पत्त्यावर पोस्टमनने रक्कम आणून दिलेली नाही. वृद्ध काळातील औषधोपचारासाठी या रकमेची नितांत गरज आहे. कृपया हे मनी ऑर्डर त्वरित शोधून अदा करण्यात यावे ही नम्र विनंती.\n\nआपला नम्र,\nगोपाळ गणेश जोशी\nपत्ता: १२, समर्थ निवास, कोथरूड, पुणे - ४११०३८\nमोबाईल: ९४२२३३४४५५`
  },
  {
    id: 'sample-gu-1',
    title: 'Gujarati - Sukanya Samriddhi Account Branch Transfer (Ahmedabad)',
    language: 'Gujarati',
    languageCode: 'gu',
    category: 'Sukanya Samriddhi Yojana (SSY)',
    trackingNumber: 'SSY-AHM-49201',
    text: `આદરણીય પોસ્ટમાસ્ટર સાહેબ,\nનવરંગપુરા મુખ્ય ડાકઘર, અમદાવાદ.\n\nવિષય: સુકન્યા સમૃદ્ધિ યોજના ખાતું સુરતથી અમદાવાદ ટ્રાન્સફર કરવા બાબત.\n\nમાનનીય સાહેબશ્રી,\nમારી દીકરી આર્યા પટેલ (ઉંમર ૮ વર્ષ) નું સુકન્યા સમૃદ્ધિ ખાતું (ખાતા નં: SSY-AHM-49201) સુરત હેડ પોસ્ટ ઓફિસમાં ચાલતું હતું. મારી નોકરીની બદલી અમદાવાદ ખાતે થઈ હોવાથી મેં ગયા મહિને ટ્રાન્સફર અરજી અને પાસબુક જમા કરાવી હતી.\n\nનવા નાણાકીય વર્ષમાં આ ખાતામાં ₹૫૦,૦૦૦ જમા કરાવવાના છે જેથી ટેક્સ છૂટ મળી શકે. પરંતુ નવી પાસબુક હજી મળી નથી અને સિસ્ટમમાં ખાતું એક્ટિવ થયું છે કે નહીં તે જણાતું નથી. કૃપા કરીને આ ખાતાનું સ્ટેટસ ચકાસી મને તાકીદે માર્ગદર્શન આપવા વિનંતી.\n\nલિ. સ્નેહલ પટેલ\nઅમદાવાદ - ૩૮૦૦૦૯\nમોબાઈલ: ૯૮૨૫૦૯૮૨૫૦`
  },
  {
    id: 'sample-hi-1',
    title: 'Hindi - Registered Letter Acknowledgment Due Notice (Varanasi)',
    language: 'Hindi',
    languageCode: 'hi',
    category: 'Registered Post',
    trackingNumber: 'RN482910482IN',
    text: `सेवा में,\nप्रवर अधीक्षक डाकघर,\nवाराणसी कैंट डाक संभाग.\n\nमहोदय,\nसविनय निवेदन है कि मैंने दिनांक ०१ तारीख को कचहरी उप डाकघर से एक महत्वपूर्ण कानूनी नोटिस पंजीकृत डाक पावती सहित (Registered Post with AD) भेजा था। रजिस्ट्री संख्या: RN482910482IN है।\n\nट्रैकिंग के अनुसार पत्र संबंधित व्यक्ति को दिनांक ०५ तारीख को डिलीवर हो चुका है। किंतु मुझे अभी तक हस्ताक्षरयुक्त पावती (Acknowledgment Due Card - AD Card) प्राप्त नहीं हुई है। न्यायालय में वाद प्रस्तुत करने के लिए मुझे इस हस्ताक्षरित पावती की सख्त आवश्यकता है। कृपया पोस्टमैन से पावती कार्ड तत्काल उपलब्ध कराने का निर्देश दें अथवा आधिकारिक डिलीवरी प्रमाण पत्र (Delivery Certificate) जारी करें।\n\nभवदीय,\nराजेश कुमार वर्मा (अधिवक्ता)\nदीवानी कचहरी, वाराणसी - २२१००२\nफोन: ९४१५१२३४५६`
  }
];

export const STANDARD_POSTAL_TEMPLATES = [
  {
    id: 'tpl-transit-check',
    name: 'Speed Post / Parcel Transit Escalation',
    category: 'Speed Post',
    text: `Regarding your query about Speed Post Article {{TRACKING}}, we have contacted the concerned National Sorting Hub (NSH) / Delivery Post Office. The consignment has been tracked and expedited for immediate local dispatch. Expected delivery within 24-48 hours. We regret the inconvenience caused.`
  },
  {
    id: 'tpl-pli-status',
    name: 'Postal Life Insurance Claim Verification',
    category: 'Postal Life Insurance (PLI)',
    text: `With reference to your PLI claim under Policy {{TRACKING}}, your documents have been verified by the Divisional Office. The death claim settlement sanction is under final approval and NEFT transfer to your bank account will be executed within 7 working days.`
  },
  {
    id: 'tpl-posb-passbook',
    name: 'Savings Bank / SSY Account Transfer Complete',
    category: 'Sukanya Samriddhi Yojana (SSY)',
    text: `In reference to your account transfer application for SSY/POSB Account {{TRACKING}}, your account master has been successfully ported to our CBS branch. Please visit the Sub-Post Office with your identity proof to collect the updated printed passbook.`
  },
  {
    id: 'tpl-mo-credit',
    name: 'Money Order Delivery Investigation',
    category: 'Money Order (e-MO)',
    text: `Regarding Money Order No {{TRACKING}}, an inquiry has been initiated with the delivery beat postman. If unpaid, the amount along with commission will either be immediately paid at your doorstep or re-credited as per departmental postal manual rules.`
  },
  {
    id: 'tpl-general-inquiry',
    name: 'Official Departmental Acknowledgment & Redressal',
    category: 'General Dak / Grievance',
    text: `This is in receipt of your representation regarding postal services. The matter has been assigned reference Docket No {{DOCKET}} and forwarded to the concerned Assistant Superintendent of Posts (ASP) for priority inquiry and resolution within 3 business days.`
  }
];

/**
 * Automatically detect Postal Service Category from email/letter contents.
 * Handles English, Hindi, Tamil, Bengali, Marathi, Gujarati, Telugu, Kannada, Malayalam, etc.
 */
export function detectPostalServiceCategory(text: string): PostalCategory | null {
  if (!text || text.trim().length === 0) return null;
  const lower = text.toLowerCase();

  // Check email headers or explicit service labels first
  if (
    /service\s*(?:category|type)?[:\s]+speed\s*post/i.test(text) ||
    /subject:.*speed\s*post/i.test(text) ||
    /\bE[A-Z]\d{9}IN\b/i.test(text) ||
    /speed\s*post|speedpost|स्पीड\s*पोस्ट|स्पिड\s*पोस्ट|ஸ்பீட்\s*போஸ்ட்|ஸ்பீட்போஸ்ட்|স্পিড\s*পোস্ট|স্পীড\s*পোস্ট|સ્પીડ\s*પોસ્ટ|స్పీడ్\s*పోస్ట్|ಸ್ಪೀಡ್\s*ಪೋಸ್ಟ್|national\s*sorting\s*hub|\bnsh\b|ems\s*speed/i.test(
      text
    )
  ) {
    return 'Speed Post';
  }

  // Sukanya Samriddhi Yojana (SSY)
  if (
    /sukanya|ssy|सुकन्या\s*समृद्धि|સુકન્યા\s*સમૃદ્ધિ|সুকন্যা\s*সমৃদ্ধি|சுகன்யா\s*சம்ரிதி|సుకన్య\s*సమృద్ధి|सुकन्या\s*समृद्धी/i.test(
      text
    ) ||
    /\bSSY[-/ ][A-Z0-9-]+\b/i.test(text)
  ) {
    return 'Sukanya Samriddhi Yojana (SSY)';
  }

  // Postal Life Insurance (PLI / RPLI)
  if (
    /postal\s*life\s*insurance|\bpli\b|\brpli\b|rural\s*postal\s*life|डाक\s*जीवन\s*बीमा|जीवन\s*বীমা|அஞ்சல்\s*ஆயுள்\s*காப்பீடு|टपाल\s*जीवन\s*विमा|ટપાલ\s*જીવન\s*વીમા|policy\s*bond|death\s*claim\s*settlement|sum\s*assured|maturity\s*claim/i.test(
      text
    ) ||
    /\b(PLI|RPLI)[-/ ][A-Z0-9-]+\b/i.test(text)
  ) {
    return 'Postal Life Insurance (PLI)';
  }

  // Electronic Money Order (e-MO)
  if (
    /money\s*order|\be-?mo\b|\bemo\b|इलेक्ट्रॉनिक\s*मनी\s*ऑर्डर|मनी\s*ऑर्डर|मनीआर्डर|பணவிடை|மணி\s*ஆர்டர்|টাকা\s*পাঠানো|মানি\s*অর্ডার|મની\s*ઓર્ડર|మనీ\s*ఆర్డర్|पेन्शन\s*मनी|money\s*remittance/i.test(
      text
    ) ||
    /\b(?:E?MO)[-/ ]\d{6,14}(?:[-/ ][A-Z0-9]+)?\b/i.test(text)
  ) {
    return 'Money Order (e-MO)';
  }

  // Post Office Savings Bank (POSB)
  if (
    /savings\s*bank|\bposb\b|passbook|cbs\s*branch|डाकघर\s*बचत\s*बैंक|बचत\s*बैंक|बचत\s*खाता|पासबुक|পাসবুক|பாஸ்புக்|ખાતા\s*નં|સેવિંગ્સ|public\s*provident\s*fund|\bppf\b|\bnsc\b|\bkvp\b|time\s*deposit|recurring\s*deposit/i.test(
      text
    )
  ) {
    return 'Post Office Savings Bank (POSB)';
  }

  // Registered Post
  if (
    /registered\s*post|regd\s*post|registered\s*letter|ad\s*card|acknowledgment\s*due|acknowledgement\s*due|पंजीकृत\s*डाक|रजिस्ट्री|पावती\s*कार्ड|পঞ্জীকৃত\s*ডাক|பதிவு\s*தபால்|नोंदणीकृत|ரசீது|पावती/i.test(
      text
    ) ||
    /\bR[A-Z]\d{9}IN\b/i.test(text)
  ) {
    return 'Registered Post';
  }

  // Parcels & Logistics
  if (
    /parcel|logistics|पार्सल|பார்சல்|পার্সেল|પાર્સલ|ಪಾರ್ಸೆಲ್|bsp\s*parcel|cod\s*parcel|heavy\s*parcel/i.test(
      text
    ) ||
    /\bC[A-Z]\d{9}IN\b/i.test(text)
  ) {
    return 'Parcels & Logistics';
  }

  // Philately
  if (/philately|commemorative\s*stamp|डाक\s*टिकट|टिकट\s*संग्रह|first\s*day\s*cover|stamps\s*order/i.test(text)) {
    return 'Philately';
  }

  return null;
}

/**
 * Extract Tracking / Consignment / Article ID from email contents.
 * Supports UPU S10 standard (e.g. EM938472910IN, RN482910482IN, CP123456789IN),
 * PLI policy numbers, e-MO numbers, SSY account IDs, and labeled email formats.
 */
export function extractArticleOrConsignmentId(text: string): string | null {
  if (!text || text.trim().length === 0) return null;

  // 1. Explicit email labels e.g. "Consignment No: EM938472910IN", "Article ID: RN123456789IN", "Tracking: ..."
  const labeledMatch = text.match(
    /(?:consignment|article|tracking|barcode|booking\s*ref|registered\s*no|policy\s*no|account\s*no|mo\s*no)[\s.:#/-]+([A-Z0-9-]{6,24})/i
  );
  if (labeledMatch && labeledMatch[1]) {
    const candidate = labeledMatch[1].trim().toUpperCase();
    // Validate if candidate is a standard 13-char post code or recognized prefix
    if (/[A-Z]{2}\d{9}[A-Z]{2}/.test(candidate)) {
      return candidate;
    }
    if (/(?:PLI|RPLI|MO|EMO|SSY|POSB)[-/]/.test(candidate)) {
      return candidate;
    }
  }

  // 2. Standard 13-character Indian Postal Consignment (e.g. EM938472910IN, RN482910482IN, CP123456789IN)
  const standardMatch = text.match(/\b([A-Z]{2}\d{9}IN)\b/i);
  if (standardMatch) return standardMatch[1].toUpperCase();

  // 3. Any standard UPU 13-char S10 tracking barcode (2 letters, 9 digits, 2 letters)
  const generic13Match = text.match(/\b([A-Z]{2}\d{9}[A-Z]{2})\b/i);
  if (generic13Match) return generic13Match[1].toUpperCase();

  // 4. PLI / RPLI Policy number (e.g. PLI-WB-2014-88412, RPLI-492019)
  const pliMatch = text.match(/\b((?:R?PLI)[-/][A-Z0-9]+(?:[-/][A-Z0-9]+)*)\b/i);
  if (pliMatch) return pliMatch[1].toUpperCase();

  // 5. Money Order Number (e.g. MO-88492019-IN, EMO-9821048)
  const moMatch = text.match(/\b((?:E?MO)[-/]\d{6,14}(?:[-/][A-Z0-9]+)?)\b/i);
  if (moMatch) return moMatch[1].toUpperCase();

  // 6. SSY / POSB Account ID (e.g. SSY-AHM-49201, POSB-9842104)
  const accountMatch = text.match(/\b((?:SSY|POSB|SB)[-/][A-Z0-9]+(?:[-/][A-Z0-9]+)*)\b/i);
  if (accountMatch) return accountMatch[1].toUpperCase();

  return null;
}

export function extractEntitiesRegex(text: string): ExtractedPostalEntities {
  const entities: ExtractedPostalEntities = {};

  // Tracking / Article number matching
  const tracking = extractArticleOrConsignmentId(text);
  if (tracking) {
    entities.trackingNumber = tracking;
  }

  // 6 digit Indian PIN Code (100000 - 999999)
  const pinMatch = text.match(/\b([1-9][0-9]{2}\s?[0-9]{3})\b/);
  if (pinMatch) {
    entities.pinCode = pinMatch[1].replace(/\s/, '');
  }

  // 10 digit Indian Phone / Mobile
  const phoneMatch = text.match(/(?:(?:\+91|91|0)?[ -]?)?([6-9]\d{9})\b/);
  if (phoneMatch) {
    entities.contactNumber = phoneMatch[1];
  }

  // Email address
  const emailMatch = text.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/);
  if (emailMatch) {
    entities.senderEmail = emailMatch[1];
  }

  return entities;
}

/**
 * Auto-detect both category and tracking ID from pasted email content
 */
export function autoDetectPostalMetadata(text: string): {
  category: PostalCategory | null;
  trackingNumber: string | null;
  email: string | null;
  pinCode: string | null;
} {
  return {
    category: detectPostalServiceCategory(text),
    trackingNumber: extractArticleOrConsignmentId(text),
    email: text.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/)?.[1] || null,
    pinCode: text.match(/\b([1-9][0-9]{2}\s?[0-9]{3})\b/)?.[1]?.replace(/\s/, '') || null,
  };
}

/**
 * Clean up and normalize letter paragraphs for pristine email / letter formatting
 */
export function normalizeLetterParagraphs(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Format a complete, copy-ready email string with Subject and Body
 */
export function formatFullEmailReply(options: {
  subject: string;
  recipientEmail?: string;
  body: string;
}): string {
  const cleanBody = normalizeLetterParagraphs(options.body);
  const toLine = options.recipientEmail ? `To: ${options.recipientEmail}\n` : '';
  return `${toLine}Subject: ${options.subject.trim()}\n\n${cleanBody}`;
}


