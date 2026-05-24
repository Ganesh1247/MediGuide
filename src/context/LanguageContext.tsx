import React, { createContext, useContext, useState, useEffect } from "react";

export type LanguageCode = "en" | "hi" | "es" | "ar" | "vi" | "ta" | "te";

interface Language {
  code: LanguageCode;
  name: string;
  flag: string;
  isRtl: boolean;
  englishName: string;
}

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸", isRtl: false, englishName: "English" },
  { code: "hi", name: "हिंदी", flag: "🇮🇳", isRtl: false, englishName: "Hindi" },
  { code: "es", name: "Español", flag: "🇪🇸", isRtl: false, englishName: "Spanish" },
  { code: "ar", name: "العربية", flag: "🇸🇦", isRtl: true, englishName: "Arabic" },
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳", isRtl: false, englishName: "Vietnamese" },
  { code: "ta", name: "தமிழ்", flag: "🇮🇳", isRtl: false, englishName: "Tamil" },
  { code: "te", name: "తెలుగు", flag: "🇮🇳", isRtl: false, englishName: "Telugu" }
];

const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    portal_subtitle: "Health Assistant",
    emergencies_btn: "Emergency Help",
    nav_scanner_hub: "Body Map",
    nav_triage_check: "Symptom Checker",
    nav_emergency_er: "Hospital Finder",
    nav_hospitals_map: "Nearby Hospitals",
    nav_rx_scanner: "Medicine Scanner",
    nav_vocal_synth: "Voice Symptom Checker",
    nav_schedules: "Doctor Schedules",
    nav_fact_audit: "Health Fact Checker",
    footer_text_1: "© 2026 MediGuide Health Assistant. All information is for helpful educational and guidance purposes only.",
    footer_text_2: "This is a virtual check-up tool. Always speak with real, certified doctors for official medical treatments and prescriptions.",
    
    // Home Page translations
    home_title: "Click on the Body to Check Symptoms",
    home_desc: "Tap any part of the human body on the screen to check symptoms, find nearby hospitals, scan your medicines, or use your voice.",
    home_start_quick_triage: "Quick Symptom Check",
    home_no_region: "Tap any part of the human body model to begin checking",
    home_selected_region: "Body Part Selected",
    home_inspecting: "Checking",
    home_begin_targeted_check: "Check selected part",
    home_active_symptoms: "Common Symptoms",
    clinical_integrity_title: "How This Works",
    clinical_integrity_desc: "Our interactive system helps you identify symptoms easily. For real medical tests like checking oxygen level, pulse, or blood pressure, you should use calibrated, official medical machines at a clinic.",
    safety_advisory_title: "Patient Advice",
    safety_advisory_desc: "This website does not replace a real doctor. If you are feeling very sick or have an urgent medical emergency, please call your local doctor or dial your local emergency number immediately.",
    action_station_title: "Services",
    action_station_dispatch_title: "Emergency Finder",
    action_station_dispatch_desc: "Quickly find nearby trauma hospitals, track local ambulances, and call help hotlines.",
    action_station_medicine_title: "Medicine Info Scanner",
    action_station_medicine_desc: "Scan your medicine labels to easily understand their ingredients and what they are used for.",
    action_station_voice_title: "Voice Symptom Checker",
    action_station_voice_desc: "Speak about your illness naturally using your voice to check symptoms instantly.",
    action_station_claim_title: "Health Truth Checker",
    action_station_claim_desc: "Check health rumors or internet tips against real, trusted medical databases.",
    compliance_footer: "MEDICAL COMPLIANCE ACTIVE"
  },
  hi: {
    portal_subtitle: "स्वास्थ्य सहायक",
    emergencies_btn: "आपातकालीन सहायता",
    nav_scanner_hub: "शरीर का नक्शा",
    nav_triage_check: "लक्षण जांचकर्ता",
    nav_emergency_er: "अस्पताल खोजक",
    nav_hospitals_map: "पास के अस्पताल",
    nav_rx_scanner: "दवा स्कैनर",
    nav_vocal_synth: "आवाज से लक्षण जांच",
    nav_schedules: "डॉक्टर का समय",
    nav_fact_audit: "स्वास्थ्य तथ्य जांच",
    footer_text_1: "© 2026 MediGuide स्वास्थ्य सहायक। सभी जानकारी केवल शैक्षिक और मार्गदर्शन उद्देश्यों के लिए है।",
    footer_text_2: "यह एक वर्चुअल जांच उपकरण है। अधिकारिक चिकित्सा उपचार और नुस्खे के लिए हमेशा प्रमाणित डॉक्टरों से बात करें।",
    
    // Home Page translations
    home_title: "सक्रिय शरीर लक्षण जांचकर्ता",
    home_desc: "लक्षणों की जांच करने, पास के अस्पताल खोजने, अपनी दवाओं को स्कैन करने या आवाज से जांच करने के लिए स्क्रीन पर दिखाई दे रहे मानव शरीर मॉडल के किसी भी हिस्से पर टैप करें।",
    home_start_quick_triage: "त्वरित लक्षण जांच",
    home_no_region: "जांच शुरू करने के लिए मानव शरीर मॉडल के किसी भी हिस्से पर टैप करें",
    home_selected_region: "शरीर का हिस्सा चुना गया",
    home_inspecting: "जांच की जा रही है",
    home_begin_targeted_check: "चुने हुए हिस्से की जांच करें",
    home_active_symptoms: "सामान्य लक्षण",
    clinical_integrity_title: "यह कैसे काम करता है",
    clinical_integrity_desc: "हमारा सिस्टम आपको आसानी से लक्षणों को समझने में मदद करता है। ऑक्सीजन स्तर, पल्स या रक्तचाप जैसे असली मेडिकल परीक्षणों के लिए, आपको क्लिनिक में प्रमाणित उपकरणों का उपयोग करना चाहिए।",
    safety_advisory_title: "मरीजों के लिए सलाह",
    safety_advisory_desc: "यह वेबसाइट किसी असली डॉक्टर की जगह नहीं ले सकती। यदि आप बहुत बीमार महसूस कर रहे हैं या आपातकालीन स्थिति है, तो कृपया तुरंत स्थानीय अस्पताल को फोन करें।",
    action_station_title: "सेवाएं",
    action_station_dispatch_title: "आपातकालीन खोजक",
    action_station_dispatch_desc: "आस-पास के अस्पतालों का पता लगाएं, लाइव एम्बुलेंस ट्रैक करें, और तत्काल चिकित्सा हॉटलाइन से जुड़ें।",
    action_station_medicine_title: "दवा जानकारी स्कैनर",
    action_station_medicine_desc: "दवा के लेबलों को स्कैन करके आसानी से समझें कि वे किस काम आती हैं और उनके अंदर क्या सामग्री है।",
    action_station_voice_title: "आवाज से लक्षण जांच",
    action_station_voice_desc: "तुरंत लक्षणों की जांच करने के लिए अपनी साधारण आवाज में बोलें।",
    action_station_claim_title: "स्वास्थ्य तथ्य जांच",
    action_station_claim_desc: "इंटरनेट पर फैली स्वास्थ्य चर्चाओं और नुस्खों को प्रमाणित डेटाबेस से सत्यापित करें।",
    compliance_footer: "चिकित्सीय अनुपालन सक्रिय"
  },
  es: {
    portal_subtitle: "Asistente de Salud",
    emergencies_btn: "Ayuda de Emergencia",
    nav_scanner_hub: "Mapa del Cuerpo",
    nav_triage_check: "Probador de Síntomas",
    nav_emergency_er: "Buscador de Hospitales",
    nav_hospitals_map: "Hospitales Cercanos",
    nav_rx_scanner: "Escáner de Medicamento",
    nav_vocal_synth: "Probador de Voz",
    nav_schedules: "Horarios de Doctores",
    nav_fact_audit: "Detector de Mitos",
    footer_text_1: "© 2026 MediGuide Asistente de Salud. Toda la información es para fines educativos y de guía.",
    footer_text_2: "Esta es una herramienta de chequeo virtual. Hable siempre con doctores de verdad para tratamientos y recetas.",
    
    // Home Page translations
    home_title: "Toque el Cuerpo para Ver Síntomas",
    home_desc: "Toque cualquier parte del cuerpo en la pantalla para ver síntomas, encontrar hospitales, escanear medicinas o usar su voz.",
    home_start_quick_triage: "Chequeo de Síntomas Rápido",
    home_no_region: "Toque cualquier parte del cuerpo para comenzar a revisar",
    home_selected_region: "Parte del Cuerpo Elegida",
    home_inspecting: "Revisando",
    home_begin_targeted_check: "Revisar parte elegida",
    home_active_symptoms: "Síntomas Comunes",
    clinical_integrity_title: "Cómo Funciona",
    clinical_integrity_desc: "Nuestro sistema le ayuda a ver los síntomas de forma muy fácil. Para pruebas reales como medir oxígeno, pulso o presión, use equipos médicos reales en una clínica.",
    safety_advisory_title: "Consejo para el Paciente",
    safety_advisory_desc: "Este sitio no reemplaza a un doctor real. Si se siente muy mal o es una emergencia, llame a su hospital local de inmediato.",
    action_station_title: "Servicios",
    action_station_dispatch_title: "Buscar Emergencias",
    action_station_dispatch_desc: "Encuentre hospitales cercanos de inmediato, vea ambulancias en vivo y llame para pedir ayuda.",
    action_station_medicine_title: "Escáner de Medicinas",
    action_station_medicine_desc: "Escanee sus medicinas para entender de forma sencilla qué contienen y para qué sirven.",
    action_station_voice_title: "Chequeo por Voz",
    action_station_voice_desc: "Hable con calma de sus síntomas con su voz para revisarlos al instante.",
    action_station_claim_title: "Verificador de Mitos",
    action_station_claim_desc: "Revise rumores de salud e internet con bases de datos médicas reales y confiables.",
    compliance_footer: "SISTEMA DE SALUD ACTIVO"
  },
  ar: {
    portal_subtitle: "مساعد الصحة المبسط",
    emergencies_btn: "طلب مساعدة الطوارئ",
    nav_scanner_hub: "خريطة الجسم البشري",
    nav_triage_check: "فاحص الأعراض المبسط",
    nav_emergency_er: "البحث عن مستشفى",
    nav_hospitals_map: "المستشفيات القريبة",
    nav_rx_scanner: "ماسح الدواء",
    nav_vocal_synth: "الفحص الصوتي الذكي",
    nav_schedules: "أوقات الأطباء",
    nav_fact_audit: "فاحص شائعات الصحة",
    footer_text_1: "© 2026 MediGuide مساعد الصحة الموثوق. كل المعلومات هنا لغرض التعليم والإرشاد المساعد فقط.",
    footer_text_2: "هذا فحص افتراضي بسيط ومبسط. استشر دائماً طبيباً حقيقياً معتمداً للحصول على العلاج الفعلي والوصفات الطبية.",
    
    // Home Page translations
    home_title: "اضغط على الجسم للتحقق من الأعراض",
    home_desc: "المس أي جزء من مجسم الجسم البشري على الشاشة للتحقق من الأعراض، أو البحث عن أقرب مستشفى، أو فحص معلومات الأدوية، أو التحدث بالصوت.",
    home_start_quick_triage: "فحص سريع للأعراض",
    home_no_region: "اضغط على أي جزء من مجسم الجسم البشري للبدء",
    home_selected_region: "تم اختيار جزء من الجسم",
    home_inspecting: "جاري الفحص والتأكد",
    home_begin_targeted_check: "افحص الجزء المختار",
    home_active_symptoms: "الأعراض الشائعة",
    clinical_integrity_title: "كيف يعمل هذا؟",
    clinical_integrity_desc: "يساعدك نظامنا على معرفة أعراض المرض ببساطة. للاختبارات الحقيقية مثل الأكسجين أو نبضات القلب أو ضغط الدم، يرجى زيارة الطبيب واستخدام أجهزة معتمدة.",
    safety_advisory_title: "نصيحة سلامة",
    safety_advisory_desc: "هذا الموقع ليس طبيباً حقيقياً. إذا كنت مريضاً جداً أو لديك حالة طارئة، يرجى الاتصال بمستشفى الطوارئ المحلي فوراً.",
    action_station_title: "الخدمات المتاحة",
    action_station_dispatch_title: "دليل الطوارئ",
    action_station_dispatch_desc: "جد أقرب غرف الإسعاف والمستشفيات، وتتبع سيارات الإسعاف الحية واتصل فوراً.",
    action_station_medicine_title: "فاحص معلومات الدواء",
    action_station_medicine_desc: "امسح بطاقة الدواء لتعرف بسهولة مما يتكون وفيم يستخدم.",
    action_station_voice_title: "الفحص الصوتي للأعراض",
    action_station_voice_desc: "تحدث بالصوت بشكل طبيعي لنساعدك على فهم الأعراض فوراً.",
    action_station_claim_title: "مدقق شائعات الصحة",
    action_station_claim_desc: "تحقق من شائعات الإنترنت ونصائح الصحة بواسطة مصادر معلومات طبية حقيقية.",
    compliance_footer: "الامتثال الطبي نشط"
  },
  vi: {
    portal_subtitle: "Trợ Lý Sức Khỏe",
    emergencies_btn: "Hỗ Trợ Khẩn Cấp",
    nav_scanner_hub: "Bản Đồ Cơ Thể",
    nav_triage_check: "Kiểm Tra Triệu Chứng",
    nav_emergency_er: "Tìm Kiếm Bệnh Viện",
    nav_hospitals_map: "BV Gần Đây",
    nav_rx_scanner: "Quét Thông Tin Thuốc",
    nav_vocal_synth: "Kiểm Tra Bằng Giọng Nói",
    nav_schedules: "Lịch Trình Bác Sĩ",
    nav_fact_audit: "Kiểm Tra Tin Đồn Sức Khỏe",
    footer_text_1: "© 2026 Trợ lý sức khỏe MediGuide. Các thông tin chỉ dành cho mục đích hướng dẫn sức khỏe và học tập.",
    footer_text_2: "Đây là công cụ hỗ trợ kiểm tra trực tuyến. Vui lòng hỏi ý kiến bác sĩ chuyên khoa thật để có chỉ định và đơn thuốc chính xác.",
    
    // Home Page translations
    home_title: "Thiết Bị Kiểm Tra Triệu Chứng Cơ Thể",
    home_desc: "Chạm vào bất kỳ bộ phận nào của mô hình cơ thể người trên màn hình để kiểm tra các triệu chứng, tìm bệnh viện gần nhất, quét thông tin thuốc hoặc kiểm tra bằng giọng nói.",
    home_start_quick_triage: "Kiểm Tra Triệu Chứng Nhanh",
    home_no_region: "Nhấn chọn bất kỳ bộ phận nào trên cơ thể để bắt đầu kiểm tra",
    home_selected_region: "Bộ Phận Cơ Thể Đã Chọn",
    home_inspecting: "Đang kiểm tra",
    home_begin_targeted_check: "Kiểm tra bộ phận đã chọn",
    home_active_symptoms: "Triệu Chứng Thường Gặp",
    clinical_integrity_title: "Cách Hoạt Động",
    clinical_integrity_desc: "Ứng dụng giúp bạn tự theo dõi các triệu chứng cơ bản đơn giản. Với việc đo chính xác nồng độ oxy, nhịp tim hay huyết áp, vui lòng đến phòng khám dùng máy y tế chính thức.",
    safety_advisory_title: "Lời Khuyên An Toàn",
    safety_advisory_desc: "Ứng dụng này không thay thế bác sĩ thật. Nếu bạn đang cảm thấy không khỏe hoặc có trường hợp cấp bách, vui lòng gọi điện đến trung tâm y khoa địa phương ngay.",
    action_station_title: "Các Dịch Vụ hỗ trợ",
    action_station_dispatch_title: "Tìm Kiếm Cấp Cứu",
    action_station_dispatch_desc: "Tìm nhanh bệnh viện cấp cứu gần nhất, định vị xe cứu thương động và liên hệ đường dây nóng cứu trợ.",
    action_station_medicine_title: "Quét Nhãn Thuốc",
    action_station_medicine_desc: "Quét vỏ nhãn thuốc dễ dàng để biết thuốc chứa thành phần gì và dùng làm gì.",
    action_station_voice_title: "Hỏi Triệu Chứng Bằng Giọng Nói",
    action_station_voice_desc: "Nói rõ các mệt mỏi của bạn bằng cách trò chuyện giọng nói để tìm hiểu lý do nhanh chóng.",
    action_station_claim_title: "Kiểm Chứng Tin Đồn",
    action_station_claim_desc: "Kiểm tra các mẹo chữa bệnh trên mạng hay tin đồn sức khỏe xem có đúng thực tế khoa học không.",
    compliance_footer: "ĐÃ ĐĂNG KÝ AN TOÀN SỨC KHỎE"
  },
  ta: {
    portal_subtitle: "சுகாதார உதவியாளர்",
    emergencies_btn: "அவசர உதவி",
    nav_scanner_hub: "உடல் வரைபடம்",
    nav_triage_check: "அறிகுறி பரிசோதனையாளர்",
    nav_emergency_er: "அஸ்பத்திரி கண்டறிவி",
    nav_hospitals_map: "அருகில் ஆஸ்பத்திரி",
    nav_rx_scanner: "மருந்து ஸ்கேனர்",
    nav_vocal_synth: "குரல்வழி அறிகுறி பரிசோதனை",
    nav_schedules: "டாக்டர் நேர அட்டவணை",
    nav_fact_audit: "சுகாதார உண்மை சரிபார்ப்பு",
    footer_text_1: "© 2026 MediGuide சுகாதார உதவியாளர். அனைத்து தகவல்களும் பயனுள்ள கல்வி மற்றும் வழிகாட்டுதலுக்காக மட்டுமே.",
    footer_text_2: "இது ஒரு ஆன்லைன் முன்னுரிமை சோதனை கருவி மட்டுமே. மருத்துவ சிகிச்சைகள் அல்லது மருந்து சீட்டுகளுக்கு எப்போதும் டாக்டரை அணுகவும்.",
    
    // Home Page translations
    home_title: "நேரடி உடல் அறிகுறி பரிசோதனையாளர்",
    home_desc: "அறிகுறிகளை சரிபார்க்க, அருகில் உள்ள மருத்துவமனைகளைக் கண்டறிய, உங்கள் மருந்து சீட்டை ஸ்கேன் செய்ய அல்லது உங்கள் குரல் மூலம் பேச, திரையில் உள்ள மனித உடல் மாதிரியில் ஏదేனும் ஒரு பகுதியை தொட்டு தேர்ந்தெடுக்கவும்.",
    home_start_quick_triage: "விரைவான அறிகுறி பரிசோதனை",
    home_no_region: "பரிசோதிக்க மாதிரியில் ஏదేனும் ஒரு பகுதியை சொடுக்கவும்",
    home_selected_region: "உடற்பகுதி தேர்ந்தெடுக்கப்பட்டது",
    home_inspecting: "பரிசீலிக்கப்படுகிறது",
    home_begin_targeted_check: "தேர்ந்தெடுத்த பகுதியை பரிசோதி",
    home_active_symptoms: "பொதுவான அறிகுறிகள்",
    clinical_integrity_title: "இது எவ்வாறு வேலை செய்கிறது",
    clinical_integrity_desc: "எங்கள் எளிமையான சிస్టம் நீங்கள் அறிகுறிகளை எளிதாகக் கண்டறிய உதவுகிறது. ஆக்சிஜன் அளவுகள், நாடித் துடிப்பு அல்லது இரத்த அழுத்தம் போன்றவற்றிற்கு மருத்துவ உபகரணங்களுடன் கூடிய மருத்துவரை அணுகவும்.",
    safety_advisory_title: "நோயாளிக்கான அறிவுரை",
    safety_advisory_desc: "இந்த இணையதளம் ஒரு உண்மையான டாக்டருக்கு மாற்றாகாது. நீங்கள் மிகவும் உடல்நலம் இல்லாமல் இருந்தால், உடனடியாக அருகில் உள்ள ஆஸ்பத்திரிக்கு செல்லவும் அல்லது அவசர எண்ணை அழைக்கவும்.",
    action_station_title: "சேவைகள்",
    action_station_dispatch_title: "அவசரகால உதவி தேடி",
    action_station_dispatch_desc: "அருகிலுள்ள அவசர சிகிச்சை அஸ்பத்திரிகளை கண்டறியவும், ஆம்புலன்ஸ்களை நேரலையில் கண்காணிக்கவும், தொலைபேசி எண்களை அழைக்கவும்.",
    action_station_medicine_title: "மருந்துத் தகவல் ஸ்கேனர்",
    action_station_medicine_desc: "மருந்துகளின் பெட்டியில் உள்ள லேபிள்களை ஸ்கேன் செய்து, அவற்றின் சேர்க்கைகளையும் பயன்பாட்டையும் எளிதாகப் புரிந்து கொள்ளவும்.",
    action_station_voice_title: "குரல்வழி அறிகுறி பரிసోதனை",
    action_station_voice_desc: "உங்கள் அறிகுறிகளை உங்கள் சொந்த குரலில் இயல்பாக பேசி உடனடியாக விவரங்களை தெரிந்துகொள்ளுங்கள்.",
    action_station_claim_title: "சுகாதார உண்மை கண்டறிவி",
    action_station_claim_desc: "இணையத்தில் வரும் சுகாதார வதந்திகள் அல்லது உதவிக்குறிப்புகள் உண்மையானவையா என்பதை அறிவியல் பூர்வமாக சோதித்து சரிபார்க்கவும்.",
    compliance_footer: "மருத்துவ இணக்கம் செயல்படுகிறது"
  },
  te: {
    portal_subtitle: "ఆరోగ్య సహాయకుడు",
    emergencies_btn: "అత్యవసర సహాయం",
    nav_scanner_hub: "శరీర పటం",
    nav_triage_check: "లక్షణాల తనిఖీ",
    nav_emergency_er: "ఆసుపత్రి శోధకుడు",
    nav_hospitals_map: "సమీప ఆసుపత్రులు",
    nav_rx_scanner: "మందుల స్కానర్",
    nav_vocal_synth: "వాయిస్ లక్షణాల తనిఖీ",
    nav_schedules: "వైద్యుల సమయం",
    nav_fact_audit: "ఆరోగ్య సత్యాల తనిఖీ",
    footer_text_1: "© 2026 MediGuide ఆరోగ్య సహాయకుడు. అన్ని సమాచారాలు కేవలం పరిపాలనా మరియు విద్యా మార్గదర్శక సమీక్ష కొరకు మాత్రమే.",
    footer_text_2: "ఇది రోగనిర్ధారణ కొలతలను చూపించడంలో సహాయపడే ఒక వర్చువల్ పరికరం. చికిత్స మరియు ఔషధాల కొరకు ఎల్లప్పుడూ ధృవీకరించబడిన వైద్యుల సలహాలు పొందండి.",
    
    // Home Page translations
    home_title: "క్రియాశీల శరీర లక్షణాల తనిఖీదారు",
    home_desc: "లక్షణాలను తనిఖీ చేయడానికి, సమీపంలోని ఆసుపత్రులను కనుగొనడానికి, మీ మందులను స్కాన్ చేయడానికి లేదా మీ వాయిస్‌తో తనిఖీ చేయడానికి స్క్రీన్ పై ఉన్న మానవ శరీర నమూనాపై ఏదైనా భాగాన్ని తాకండి.",
    home_start_quick_triage: "త్వరిత లక్షణాల తనిఖీ",
    home_no_region: "తనిఖీ ప్రారంభించడానికి మానవ శరీర నమూనాపై ఏదైనా ఒక భాగాన్ని తాకండి",
    home_selected_region: "శరీర భాగం ఎంచుకోబడింది",
    home_inspecting: "తనిఖీ చేయబడుతోంది",
    home_begin_targeted_check: "ఎంచుకున్న భాగాన్ని తనిఖీ చేయండి",
    home_active_symptoms: "సాధారణ లక్షణాలు",
    clinical_integrity_title: "ఇది ఎలా పని చేస్తుంది",
    clinical_integrity_desc: "మా సిస్టమ్ మీకు లక్షణాలను సులభంగా అర్థం చేసుకోవడానికి సహాయపడుతుంది. ఆక్సిజన్ స్థాయి, పల్స్ లేదా రక్తపోటు వంటి అసలు వైద్య పరీక్షల కోసం క్లినిక్‌లలో ధృవీకరించబడిన వైద్య పరికరాలను ఉపయోగించాలి.",
    safety_advisory_title: "రోగి భద్రతా సలహా",
    safety_advisory_desc: "ఈ వెబ్‌సైట్ అసలు వైద్యుడికి ప్రత్యామ్నాయం కాదు. ఒకవేళ మీరు బాగా అనారోగ్యంగా ఉన్నట్లయితే లేదా అత్యవసర పరిస్థితి సంభవిస్తే, దయచేసి వెంటనే స్థానిక అత్యవసర సేవలను సంప్రదించండి.",
    action_station_title: "సేవలు",
    action_station_dispatch_title: "అత్యవసర సహాయ శోధకుడు",
    action_station_dispatch_desc: "సమీపంలోని ఎమర్జెన్సీ ఆసుపత్రులను కనుగొనండి, అంబులెన్స్‌లను ట్రాక్ చేయండి మరియు అత్యవసర నంబర్లకు నేరుగా కాల్ చేయండి.",
    action_station_medicine_title: "మందుల సమాచార స్కానర్",
    action_station_medicine_desc: "మందుల లేబుళ్ళను స్కాన్ చేయడం ద్వారా అవి దేనికి ఉపయోగపడతాయి మరియు వాటిలో ఏముందో సులభంగా తెలుసుకోండి.",
    action_station_voice_title: "వాయిస్ లక్షణాల తనిఖీ",
    action_station_voice_desc: "మీ అనారోగ్య లక్షణాలను మీ స్వంత స్వరంతో మాట్లాడి వాటి గురించి తక్షణమే సమాచారం తెలుసుకోండి.",
    action_station_claim_title: "ఆరోగ్య సత్యాల తనిఖీ",
    action_station_claim_desc: "ఇంటర్నెట్ మరియు సోషల్ మీడియా ప్రచారాల వాస్తవికతను నిజమైన శాస్త్రీయ డేటాతో తనిఖీ చేసి నిర్ధారించండి.",
    compliance_footer: "వైద్య సమ్మతి క్రియాశీలకంగా ఉంది"
  }
};

interface LanguageContextProps {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  isRtl: boolean;
  activeLanguage: Language;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  // Load language preference from localStorage if available
  useEffect(() => {
    const savedLang = localStorage.getItem("mediguide_language") as LanguageCode;
    if (savedLang && translations[savedLang]) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem("mediguide_language", lang);
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || translations["en"][key] || key;
  };

  const activeLanguage = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const isRtl = activeLanguage.isRtl;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl, activeLanguage }}>
      <div dir={isRtl ? "rtl" : "ltr"} className={isRtl ? "rtl-text-align" : ""}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
