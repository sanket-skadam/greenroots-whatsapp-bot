import type { LangCode } from '../data/catalog.js';

export const SUPPORTED_LANGUAGES: LangCode[] = ['en', 'hi', 'pa', 'mr'];

export const LANGUAGE_NAMES: Record<LangCode, string> = {
  en: 'English',
  hi: 'Hindi',
  pa: 'Punjabi',
  mr: 'Marathi',
};

const DICTIONARY = {
  welcome_greeting_and_language: {
    en:
      `🙏 *Namaste! Welcome to GreenRoots* 🌱\n\n` +
      `Please choose your language (reply *1*, *2*, *3*, or *4*):\n` +
      `1️⃣ English\n2️⃣ हिंदी (Hindi)\n3️⃣ ਪੰਜਾਬੀ (Punjabi)\n4️⃣ मराठी (Marathi)`,
    hi:
      `🙏 *नमस्ते! ग्रीनरूट्स में आपका स्वागत है* 🌱\n\n` +
      `कृपया अपनी भाषा चुनें (*1*, *2*, *3*, या *4* भेजें):\n` +
      `1️⃣ English\n2️⃣ हिंदी\n3️⃣ ਪੰਜਾਬੀ\n4️⃣ मराठी`,
    pa:
      `🙏 *ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਗ੍ਰੀਨਰੂਟਸ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ* 🌱\n\n` +
      `ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ (*1*, *2*, *3*, ਜਾਂ *4* ਭੇਜੋ):\n` +
      `1️⃣ English\n2️⃣ हिंदी\n3️⃣ ਪੰਜਾਬੀ\n4️⃣ मराठी`,
    mr:
      `🙏 *नमस्कार! ग्रीनरूट्समध्ये तुमचे स्वागत आहे* 🌱\n\n` +
      `कृपया तुमची भाषा निवडा (*1*, *2*, *3*, किंवा *4* पाठवा):\n` +
      `1️⃣ English\n2️⃣ हिंदी\n3️⃣ ਪੰਜਾਬੀ\n4️⃣ मराठी`,
  },
  invalid_language_choice: {
    en: `Please reply with *1* (English), *2* (Hindi), *3* (Punjabi), or *4* (Marathi).`,
    hi: `कृपया *1* (English), *2* (हिंदी), *3* (ਪੰਜਾਬੀ), या *4* (मराठी) लिखकर भेजें।`,
    pa: `ਕਿਰਪਾ ਕਰਕੇ *1*, *2*, *3*, ਜਾਂ *4* ਲਿਖ ਕੇ ਭੇਜੋ।`,
    mr: `कृपया *1*, *2*, *3*, किंवा *4* लिहून पाठवा.`,
  },
  ask_role_numbered: {
    en:
      `Great! How are you joining GreenRoots today? Reply with *1*, *2*, or *3*:\n\n` +
      `1️⃣ *Farmer* — Sell crop waste\n` +
      `2️⃣ *Industry* — Buy biomass in bulk\n` +
      `3️⃣ *Buyer* — Buy crop waste directly`,
    hi:
      `बहुत बढ़िया! आप ग्रीनरूट्स पर किस रूप में जुड़ रहे हैं? कृपया *1*, *2*, या *3* भेजें:\n\n` +
      `1️⃣ *किसान* — फसल का कचरा / पराली बेचने के लिए\n` +
      `2️⃣ *उद्योग* — बड़ी मात्रा में खरीदने के लिए\n` +
      `3️⃣ *खरीदार* — सीधे खरीदने के लिए`,
    pa:
      `ਬਹੁਤ ਵਧੀਆ! ਤੁਸੀਂ ਗ੍ਰੀਨਰੂਟਸ ਤੇ ਕਿਸ ਵਜੋਂ ਜੁੜ ਰਹੇ ਹੋ? ਕਿਰਪਾ ਕਰਕੇ *1*, *2*, ਜਾਂ *3* ਭੇਜੋ:\n\n` +
      `1️⃣ *ਕਿਸਾਨ* — ਪਰਾਲੀ / ਫ਼ਸਲੀ ਕਚਰਾ ਵੇਚਣ ਲਈ\n` +
      `2️⃣ *ਉਦਯੋਗ* — ਵੱਡੀ ਮਾਤਰਾ ਵਿੱਚ ਖਰੀਦਣ ਲਈ\n` +
      `3️⃣ *ਖਰੀਦਦਾਰ* — ਸਿੱਧਾ ਖਰੀਦਣ ਲਈ`,
    mr:
      `छान! तुम्ही ग्रीनरूट्सवर कोणत्या भूमिकेत सामील होत आहात? कृपया *1*, *2*, किंवा *3* पाठवा:\n\n` +
      `1️⃣ *शेतकरी* — शेतातील पालापाचोळा विकण्यासाठी\n` +
      `2️⃣ *उद्योग* — मोठ्या प्रमाणात खरेदीसाठी\n` +
      `3️⃣ *खरेदीदार* — थेट खरेदीसाठी`,
  },
  ask_name: {
    en: `Got it! What is your *name*? 😊`,
    hi: `बढ़िया! आपका *नाम* क्या है? 😊`,
    pa: `ਵਧੀਆ! ਤੁਹਾਡਾ *ਨਾਮ* ਕੀ ਹੈ? 😊`,
    mr: `छान! तुमचे *नाव* काय आहे? 😊`,
  },
  intro_and_ask_name_role: {
    en:
      `Hey there! 🌱 I'm *GreenRoots* — your friendly assistant that helps *farmers* sell their crop waste (like paddy straw, wheat straw, sugarcane bagasse) instead of burning it, and helps *buyers & industries* find clean biomass easily.\n\n` +
      `Here's what I can do for you:\n` +
      `• 🎙️ Send a voice note — list or search crop waste\n` +
      `• 📸 Send a photo — I'll check its quality & price\n` +
      `• 📍 Share your location — find the nearest drop-off hub\n` +
      `• 💬 Or just chat — I'm always here!\n\n` +
      `Tell me — what's your *name* and are you a *farmer, industry, or buyer*? 😊\n` +
      `_(e.g. "Sanket, farmer" or "My name is Ramesh, I'm a buyer")_`,
    hi:
      `नमस्ते! 🌱 मैं *ग्रीनरूट्स* हूँ — एक ऐसा सहायक जो *किसानों* को फसल का बचा-खुचा (जैसे पराली, भूसा, गन्ने की खोई) जलाने के बजाय बेचने में मदद करता है, और *खरीदारों व उद्योगों* को सही जगह से खरीदने में।\n\n` +
      `मैं आपकी मदद कर सकता हूँ:\n` +
      `• 🎙️ आवाज़ में बोलकर फसल का कचरा बेचें या खोजें\n` +
      `• 📸 फोटो भेजें — मैं गुणवत्ता और कीमत बताऊँगा\n` +
      `• 📍 अपना पता/लोकेशन भेजें — पास का केंद्र खोजें\n` +
      `• 💬 या बस लिखकर पूछें — मैं हमेशा यहाँ हूँ!\n\n` +
      `बताइए, आपका *नाम* क्या है और आप *किसान, उद्योग, या खरीदार* हैं? 😊\n` +
      `_(जैसे: "संकेत, किसान" या "मेरा नाम रमेश है, मैं खरीदार हूँ")_`,
    pa:
      `ਸਤ ਸ੍ਰੀ ਅਕਾਲ! 🌱 ਮੈਂ *ਗ੍ਰੀਨਰੂਟਸ* ਹਾਂ — ਤੁਹਾਡਾ ਦੋਸਤਾਨਾ ਸਹਾਇਕ ਜੋ *ਕਿਸਾਨਾਂ* ਨੂੰ ਪਰਾਲੀ, ਭੂਸਾ ਅਤੇ ਗੰਨੇ ਦੀ ਖੋਈ ਸਾੜਨ ਦੀ ਬਜਾਏ ਵੇਚਣ ਵਿੱਚ ਮਦਦ ਕਰਦਾ ਹੈ, ਅਤੇ *ਖਰੀਦਦਾਰਾਂ ਤੇ ਉਦਯੋਗਾਂ* ਨੂੰ ਆਸਾਨੀ ਨਾਲ ਖਰੀਦਣ ਵਿੱਚ।\n\n` +
      `ਮੈਂ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ:\n` +
      `• 🎙️ ਵੌਇਸ ਨੋਟ ਭੇਜੋ — ਫ਼ਸਲੀ ਕਚਰਾ ਵੇਚੋ ਜਾਂ ਲੱਭੋ\n` +
      `• 📸 ਫੋਟੋ ਭੇਜੋ — ਮੈਂ ਗੁਣਵੱਤਾ ਤੇ ਕੀਮਤ ਦੱਸਾਂਗਾ\n` +
      `• 📍 ਲੋਕੇਸ਼ਨ ਭੇਜੋ — ਨੇੜਲਾ ਕੇਂਦਰ ਲੱਭੋ\n` +
      `• 💬 ਜਾਂ ਬੱਸ ਲਿਖ ਕੇ ਪੁੱਛੋ — ਮੈਂ ਹਮੇਸ਼ਾ ਇੱਥੇ ਹਾਂ!\n\n` +
      `ਦੱਸੋ, ਤੁਹਾਡਾ *ਨਾਮ* ਕੀ ਹੈ ਅਤੇ ਤੁਸੀਂ *ਕਿਸਾਨ, ਉਦਯੋਗ, ਜਾਂ ਖਰੀਦਦਾਰ* ਹੋ? 😊\n` +
      `_(ਜਿਵੇਂ: "ਗੁਰਪ੍ਰੀਤ, ਕਿਸਾਨ" ਜਾਂ "ਮੇਰਾ ਨਾਮ ਸੰਕੇਤ ਹੈ, ਮੈਂ ਖਰੀਦਦਾਰ ਹਾਂ")_`,
    mr:
      `नमस्कार! 🌱 मी *ग्रीनरूट्स* आहे — तुमचा मदतनीस जो *शेतकऱ्यांना* पालापाचोळा (पराली, गव्हाचा भुसा, उसाची चिपाड) जाळण्याऐवजी विकायला मदत करतो आणि *खरेदीदार व उद्योगांना* सहज माल मिळवून देतो.\n\n` +
      `मी तुम्हाला अशी मदत करू शकतो:\n` +
      `• 🎙️ व्हॉइस मेसेज पाठवा — माल विका किंवा शोधा\n` +
      `• 📸 फोटो पाठवा — मी गुणवत्ता आणि भाव सांगेन\n` +
      `• 📍 तुमचे ठिकाण पाठवा — जवळचे केंद्र शोधा\n` +
      `• 💬 किंवा सरळ लिहून विचारा — मी नेहमी इथे आहे!\n\n` +
      `सांगा, तुमचे *नाव* काय आहे आणि तुम्ही *शेतकरी, उद्योग, की खरेदीदार* आहात? 😊\n` +
      `_(उदा. "संकेत, शेतकरी" किंवा "माझे नाव रमेश आहे, मी खरेदीदार आहे")_`,
  },
  retry_name_role: {
    en: `Hmm, I didn't quite catch both your name and role 😅 Just reply naturally like — _"Sanket, farmer"_ or _"I'm Ramesh, a buyer"_`,
    hi: `माफ़ कीजिए, नाम और भूमिका दोनों समझ नहीं आए 😅 बस ऐसे लिखें — _"संकेत, किसान"_ या _"मेरा नाम रमेश है, मैं खरीदार हूँ"_`,
    pa: `ਮਾਫ਼ ਕਰਨਾ, ਨਾਮ ਅਤੇ ਭੂਮਿਕਾ ਸਮਝ ਨਹੀਂ ਆਏ 😅 ਬੱਸ ਇੰਝ ਲਿਖੋ — _"ਗੁਰਪ੍ਰੀਤ, ਕਿਸਾਨ"_ ਜਾਂ _"ਮੇਰਾ ਨਾਮ ਸੰਕੇਤ ਹੈ, ਮੈਂ ਖਰੀਦਦਾਰ ਹਾਂ"_`,
    mr: `क्षमस्व, नाव आणि भूमिका नीट समजली नाही 😅 असं लिहा — _"संकेत, शेतकरी"_ किंवा _"माझे नाव रमेश आहे, मी खरेदीदार आहे"_`,
  },
  menu_farmer: {
    en:
      `🌱 *Welcome, {{name}}!* You're registered as a *Farmer*.\n\n` +
      `You can:\n` +
      `• 🎙️ Send a voice note or text to sell, e.g. _"Mere paas 4 ton gehu ka bhusa hai, 1800 rupaye per ton, Karnal"_\n` +
      `• 📸 Send a photo of crop waste for quality grading\n` +
      `• 📍 Share your location pin for the nearest collection hub\n` +
      `• Reply \`/pool\` to view industry pools`,
    hi:
      `🌱 *स्वागत है, {{name}} जी!* आप *किसान* के रूप में जुड़े हैं।\n\n` +
      `आप यह कर सकते हैं:\n` +
      `• 🎙️ बेचने के लिए आवाज़ या मैसेज भेजें, जैसे: _"मेरे पास 4 टन गेहूँ का भूसा है, 1800 रुपये प्रति टन, करनाल"_\n` +
      `• 📸 फसल के कचरे की फोटो भेजें\n` +
      `• 📍 नज़दीकी संग्रह केंद्र के लिए लोकेशन पिन भेजें\n` +
      `• उद्योग पूल देखने के लिए \`/pool\` भेजें`,
    pa:
      `🌱 *ਜੀ ਆਇਆਂ ਨੂੰ, {{name}} ਜੀ!* ਤੁਸੀਂ *ਕਿਸਾਨ* ਵਜੋਂ ਜੁੜੇ ਹੋ।\n\n` +
      `ਤੁਸੀਂ ਇਹ ਕਰ ਸਕਦੇ ਹੋ:\n` +
      `• 🎙️ ਵੇਚਣ ਲਈ ਵੌਇਸ ਨੋਟ ਜਾਂ ਸੁਨੇਹਾ ਭੇਜੋ, ਜਿਵੇਂ: _"ਮੇਰੇ ਕੋਲ 4 ਟਨ ਕਣਕ ਦਾ ਭੂਸਾ ਹੈ, 1800 ਰੁਪਏ ਪ੍ਰਤੀ ਟਨ, ਕਰਨਾਲ"_\n` +
      `• 📸 ਫ਼ਸਲੀ ਕਚਰੇ ਦੀ ਫੋਟੋ ਭੇਜੋ\n` +
      `• 📍 ਨੇੜਲੇ ਕੇਂਦਰ ਲਈ ਲੋਕੇਸ਼ਨ ਪਿੰਨ ਭੇਜੋ\n` +
      `• ਉਦਯੋਗ ਪੂਲ ਦੇਖਣ ਲਈ \`/pool\` ਭੇਜੋ`,
    mr:
      `🌱 *स्वागत आहे, {{name}} जी!* तुम्ही *शेतकरी* म्हणून जोडले गेला आहात.\n\n` +
      `तुम्ही हे करू शकता:\n` +
      `• 🎙️ विक्रीसाठी व्हॉइस मेसेज किंवा मजकूर पाठवा, उदा. _"माझ्याकडे 4 टन गव्हाचा भुसा आहे, 1800 रुपये प्रति टन, कोल्हापूर"_\n` +
      `• 📸 पालापाचोळ्याचा फोटो पाठवा\n` +
      `• 📍 जवळच्या केंद्रासाठी लोकेशन पिन पाठवा\n` +
      `• उद्योग पूल पाहण्यासाठी \`/pool\` पाठवा`,
  },
  menu_buyer: {
    en:
      `🌱 *Welcome, {{name}}!* You're registered as a *{{roleLabel}}*.\n\n` +
      `You can:\n` +
      `• 💬 Search & buy in plain words, e.g. _"Mujhe 2 ton gehu ka bhusa chahiye, Ludhiana"_\n` +
      `• 📋 Reply \`/listings\` to browse available crop waste`,
    hi:
      `🌱 *स्वागत है, {{name}} जी!* आप *{{roleLabel}}* के रूप में जुड़े हैं।\n\n` +
      `आप यह कर सकते हैं:\n` +
      `• 💬 खोजने व खरीदने के लिए लिखें या बोलें, जैसे: _"मुझे 2 टन गेहूँ का भूसा चाहिए, लुधियाना"_\n` +
      `• 📋 उपलब्ध लिस्टिंग देखने के लिए \`/listings\` भेजें`,
    pa:
      `🌱 *ਜੀ ਆਇਆਂ ਨੂੰ, {{name}} ਜੀ!* ਤੁਸੀਂ *{{roleLabel}}* ਵਜੋਂ ਜੁੜੇ ਹੋ।\n\n` +
      `ਤੁਸੀਂ ਇਹ ਕਰ ਸਕਦੇ ਹੋ:\n` +
      `• 💬 ਖਰੀਦਣ ਲਈ ਲਿਖੋ ਜਾਂ ਬੋਲੋ, ਜਿਵੇਂ: _"ਮੈਨੂੰ 2 ਟਨ ਕਣਕ ਦਾ ਭੂਸਾ ਚਾਹੀਦਾ ਹੈ, ਲੁਧਿਆਣਾ"_\n` +
      `• 📋 ਲਿਸਟਿੰਗ ਦੇਖਣ ਲਈ \`/listings\` ਭੇਜੋ`,
    mr:
      `🌱 *स्वागत आहे, {{name}} जी!* तुम्ही *{{roleLabel}}* म्हणून जोडले गेला आहात.\n\n` +
      `तुम्ही हे करू शकता:\n` +
      `• 💬 खरेदीसाठी लिहा किंवा बोला, उदा. _"मला 2 टन गव्हाचा भुसा हवा आहे"_\n` +
      `• 📋 उपलब्ध यादी पाहण्यासाठी \`/listings\` पाठवा`,
  },
  role_label_farmer: {
    en: 'Farmer',
    hi: 'किसान',
    pa: 'ਕਿਸਾਨ',
    mr: 'शेतकरी',
  },
  role_label_industry: {
    en: 'Industry',
    hi: 'उद्योग',
    pa: 'ਉਦਯੋਗ',
    mr: 'उद्योग',
  },
  role_label_buyer: {
    en: 'Buyer',
    hi: 'खरीदार',
    pa: 'ਖਰੀਦਦਾਰ',
    mr: 'खरेदीदार',
  },
  buyer_cannot_sell: {
    en: `You're registered as a buyer—did you mean to *buy* crop waste? Tell me what you need (e.g. _"2 tons wheat straw"_), reply \`/listings\` to browse, or send \`/role farmer\` to switch to selling.`,
    hi: `आप खरीदार के रूप में जुड़े हैं—क्या आप *खरीदना* चाहते हैं? बताइए आपको क्या चाहिए (जैसे: _"2 टन गेहूँ का भूसा चाहिए"_), \`/listings\` देखें, या बेचने के लिए \`/role farmer\` भेजें।`,
    pa: `ਤੁਸੀਂ ਖਰੀਦਦਾਰ ਵਜੋਂ ਜੁੜੇ ਹੋ—ਕੀ ਤੁਸੀਂ *ਖਰੀਦਣਾ* ਚਾਹੁੰਦੇ ਹੋ? ਦੱਸੋ ਤੁਹਾਨੂੰ ਕੀ ਚਾਹੀਦਾ ਹੈ, \`/listings\` ਦੇਖੋ, ਜਾਂ ਵੇਚਣ ਲਈ \`/role farmer\` ਭੇਜੋ।`,
    mr: `तुम्ही खरेदीदार म्हणून जोडलेले आहात—तुम्हाला *खरेदी* करायची आहे का? तुम्हाला काय हवे ते सांगा, \`/listings\` पहा, किंवा विक्रीसाठी \`/role farmer\` पाठवा.`,
  },
  farmer_cannot_buy: {
    en: `You're registered as a farmer, so you can list crop waste to sell. Send a voice note or text with your crop waste details!`,
    hi: `आप किसान के रूप में जुड़े हैं, इसलिए आप फसल का कचरा बेच सकते हैं। बेचने के लिए अपनी फसल की जानकारी भेजें!`,
    pa: `ਤੁਸੀਂ ਕਿਸਾਨ ਵਜੋਂ ਜੁੜੇ ਹੋ, ਇਸ ਲਈ ਤੁਸੀਂ ਪਰਾਲੀ/ਭੂਸਾ ਵੇਚ ਸਕਦੇ ਹੋ। ਵੇਚਣ ਲਈ ਜਾਣਕਾਰੀ ਭੇਜੋ!`,
    mr: `तुम्ही शेतकरी म्हणून जोडलेले आहात, त्यामुळे तुम्ही पालापाचोळा विकू शकता. विक्रीसाठी माहिती पाठवा!`,
  },
  ask_missing_item: {
    en: `Which *crop waste* do you want to sell? (e.g. Wheat Straw, Paddy Straw, Sugarcane Bagasse)`,
    hi: `आप कौन-सा *फसल का कचरा* बेचना चाहते हैं? (जैसे: गेहूँ का भूसा, धान की पराली, गन्ने की खोई)`,
    pa: `ਤੁਸੀਂ ਕਿਹੜਾ *ਫ਼ਸਲੀ ਕਚਰਾ* ਵੇਚਣਾ ਚਾਹੁੰਦੇ ਹੋ? (ਜਿਵੇਂ: ਕਣਕ ਦਾ ਭੂਸਾ, ਝੋਨੇ ਦੀ ਪਰਾਲੀ)`,
    mr: `तुम्हाला कोणता *शेतीचा कचरा* विकायचा आहे? (उदा. गव्हाचा भुसा, भाताचा पेंढा)`,
  },
  ask_missing_quantity: {
    en: `How many *tons* of {{item}} do you have to sell?`,
    hi: `आपके पास कितने *टन* {{item}} बेचने के लिए हैं?`,
    pa: `ਤੁਹਾਡੇ ਕੋਲ ਕਿੰਨੇ *ਟਨ* {{item}} ਵੇਚਣ ਲਈ ਹਨ?`,
    mr: `तुमच्याकडे किती *टन* {{item}} विक्रीसाठी आहे?`,
  },
  ask_missing_price: {
    en: `What price per ton (in ₹) would you like for {{quantity}} tons of {{item}}?`,
    hi: `{{quantity}} टन {{item}} के लिए आप प्रति टन क्या *कीमत (₹)* चाहते हैं?`,
    pa: `{{quantity}} ਟਨ {{item}} ਲਈ ਤੁਸੀਂ ਪ੍ਰਤੀ ਟਨ ਕੀ *ਕੀਮਤ (₹)* ਚਾਹੁੰਦੇ ਹੋ?`,
    mr: `{{quantity}} टन {{item}} साठी प्रति टन तुम्हाला किती *भाव (₹)* हवा आहे?`,
  },
  ask_missing_location: {
    en: `Which *village or city* is this {{item}} located in?`,
    hi: `यह {{item}} किस *गाँव या शहर* में है?`,
    pa: `ਇਹ {{item}} ਕਿਸ *ਪਿੰਡ ਜਾਂ ਸ਼ਹਿਰ* ਵਿੱਚ ਹੈ?`,
    mr: `हा {{item}} कोणत्या *गावात किंवा शहरात* आहे?`,
  },
  sell_summary_confirm: {
    en:
      `📋 *Please Confirm Your Listing*\n\n` +
      `• Item: *{{item}}*\n` +
      `• Quantity: *{{quantity}} Tons*\n` +
      `• Price: *{{price}}/ton*\n` +
      `• Location: *{{location}}*\n` +
      `• Seller: {{sellerName}} ({{sellerPhone}})\n\n` +
      `Reply *YES* to publish, or *CANCEL* to discard.`,
    hi:
      `📋 *कृपया अपनी लिस्टिंग की पुष्टि करें*\n\n` +
      `• सामग्री: *{{item}}*\n` +
      `• मात्रा: *{{quantity}} टन*\n` +
      `• कीमत: *{{price}}/टन*\n` +
      `• स्थान: *{{location}}*\n` +
      `• विक्रेता: {{sellerName}} ({{sellerPhone}})\n\n` +
      `प्रकाशित करने के लिए *YES* (या *हाँ*) भेजें, या *CANCEL* भेजें।`,
    pa:
      `📋 *ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਲਿਸਟਿੰਗ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ*\n\n` +
      `• ਸਮੱਗਰੀ: *{{item}}*\n` +
      `• ਮਾਤਰਾ: *{{quantity}} ਟਨ*\n` +
      `• ਕੀਮਤ: *{{price}}/ਟਨ*\n` +
      `• ਥਾਂ: *{{location}}*\n` +
      `• ਵਿਕਰੇਤਾ: {{sellerName}} ({{sellerPhone}})\n\n` +
      `ਪ੍ਰਕਾਸ਼ਿਤ ਕਰਨ ਲਈ *YES* ਭੇਜੋ, ਜਾਂ *CANCEL* ਭੇਜੋ।`,
    mr:
      `📋 *कृपया तुमच्या यादीची पुष्टी करा*\n\n` +
      `• साहित्य: *{{item}}*\n` +
      `• प्रमाण: *{{quantity}} टन*\n` +
      `• भाव: *{{price}}/टन*\n` +
      `• ठिकाण: *{{location}}*\n` +
      `• विक्रेता: {{sellerName}} ({{sellerPhone}})\n\n` +
      `प्रकाशित करण्यासाठी *YES* पाठवा, किंवा *CANCEL* पाठवा.`,
  },
  listing_published: {
    en:
      `✅ *Listing Published!* (\`{{id}}\`)\n\n` +
      `• {{quantity}} Tons *{{item}}* @ {{price}}/ton\n` +
      `• Location: {{location}}\n` +
      `• Seller: {{sellerName}} ({{sellerPhone}})`,
    hi:
      `✅ *लिस्टिंग प्रकाशित हो गई!* (\`{{id}}\`)\n\n` +
      `• {{quantity}} टन *{{item}}* @ {{price}}/टन\n` +
      `• स्थान: {{location}}\n` +
      `• विक्रेता: {{sellerName}} ({{sellerPhone}})`,
    pa:
      `✅ *ਲਿਸਟਿੰਗ ਪ੍ਰਕਾਸ਼ਿਤ ਹੋ ਗਈ!* (\`{{id}}\`)\n\n` +
      `• {{quantity}} ਟਨ *{{item}}* @ {{price}}/ਟਨ\n` +
      `• ਥਾਂ: {{location}}\n` +
      `• ਵਿਕਰੇਤਾ: {{sellerName}} ({{sellerPhone}})`,
    mr:
      `✅ *यादी प्रकाशित झाली!* (\`{{id}}\`)\n\n` +
      `• {{quantity}} टन *{{item}}* @ {{price}}/टन\n` +
      `• ठिकाण: {{location}}\n` +
      `• विक्रेता: {{sellerName}} ({{sellerPhone}})`,
  },
  listings_header: {
    en: `🌾 *Available Crop Waste Listings*\n\n{{body}}\n\n_Reply with a listing ID (e.g. \`LST-101\`) to select it._`,
    hi: `🌾 *उपलब्ध फसल कचरा लिस्टिंग*\n\n{{body}}\n\n_चुनने के लिए लिस्टिंग ID भेजें (जैसे \`LST-101\`)।_`,
    pa: `🌾 *ਉਪਲਬਧ ਫ਼ਸਲੀ ਕਚਰਾ ਲਿਸਟਿੰਗ*\n\n{{body}}\n\n_ਚੁਣਨ ਲਈ ਲਿਸਟਿੰਗ ID ਭੇਜੋ (ਜਿਵੇਂ \`LST-101\`)।_`,
    mr: `🌾 *उपलब्ध शेती कचरा यादी*\n\n{{body}}\n\n_निवडण्यासाठी यादी ID पाठवा (उदा. \`LST-101\`)._`,
  },
  no_listings_found: {
    en: `Sorry, no matching listings are available right now. Would you like me to notify you as soon as a farmer lists this?`,
    hi: `माफ़ कीजिए, अभी कोई मिलती-जुलती लिस्टिंग उपलब्ध नहीं है। क्या मैं नया स्टॉक आने पर आपको सूचित करूँ?`,
    pa: `ਮਾਫ਼ ਕਰਨਾ, ਇਸ ਵੇਲੇ ਕੋਈ ਮਿਲਦੀ-ਜੁਲਦੀ ਲਿਸਟਿੰਗ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਕੀ ਨਵਾਂ ਸਟਾਕ ਆਉਣ 'ਤੇ ਮੈਂ ਤੁਹਾਨੂੰ ਦੱਸਾਂ?`,
    mr: `क्षमस्व, सध्या अशी कोणतीही यादी उपलब्ध नाही. नवीन माल आल्यावर मी तुम्हाला कळवू का?`,
  },
  ask_buyer_location: {
    en: `📍 Which *city or village* are you located in? (This helps us arrange pickup/delivery from the nearest hub.)`,
    hi: `📍 आप किस *शहर या गाँव* में हैं? (ताकि हम नज़दीकी केंद्र से डिलीवरी/पिकअप देख सकें।)`,
    pa: `📍 ਤੁਸੀਂ ਕਿਸ *ਸ਼ਹਿਰ ਜਾਂ ਪਿੰਡ* ਵਿੱਚ ਹੋ? (ਤਾਂ ਕਿ ਨੇੜਲੇ ਕੇਂਦਰ ਤੋਂ ਪ੍ਰਬੰਧ ਕੀਤਾ ਜਾ ਸਕੇ।)`,
    mr: `📍 तुम्ही कोणत्या *शहरात किंवा गावात* आहात? (जवळच्या केंद्रावरून व्यवस्था करण्यासाठी.)`,
  },
  buy_order_confirm: {
    en:
      `🧾 *Order Summary (Confirm to Pay)*\n\n` +
      `• Listing: *{{id}}* — {{item}}\n` +
      `• Farmer: {{farmerName}} ({{listingLocation}})\n` +
      `• Your Location: {{buyerLocation}}\n` +
      `• Quantity: *{{quantity}} Tons*\n` +
      `• Total: *{{total}}*\n\n` +
      `Reply *YES* (or *CONFIRM*) to get your payment link, or *CANCEL*.`,
    hi:
      `🧾 *ऑर्डर सारांश (पुष्टि करें)*\n\n` +
      `• लिस्टिंग: *{{id}}* — {{item}}\n` +
      `• किसान: {{farmerName}} ({{listingLocation}})\n` +
      `• आपका स्थान: {{buyerLocation}}\n` +
      `• मात्रा: *{{quantity}} टन*\n` +
      `• कुल राशि: *{{total}}*\n\n` +
      `भुगतान लिंक पाने के लिए *YES* (या *हाँ*) भेजें, या *CANCEL* भेजें।`,
    pa:
      `🧾 *ਆਰਡਰ ਸਾਰ (ਪੁਸ਼ਟੀ ਕਰੋ)*\n\n` +
      `• ਲਿਸਟਿੰਗ: *{{id}}* — {{item}}\n` +
      `• ਕਿਸਾਨ: {{farmerName}} ({{listingLocation}})\n` +
      `• ਤੁਹਾਡਾ ਸ਼ਹਿਰ: {{buyerLocation}}\n` +
      `• ਮਾਤਰਾ: *{{quantity}} ਟਨ*\n` +
      `• ਕੁੱਲ ਰਕਮ: *{{total}}*\n\n` +
      `ਭੁਗਤਾਨ ਲਿੰਕ ਲਈ *YES* ਭੇਜੋ, ਜਾਂ *CANCEL* ਭੇਜੋ।`,
    mr:
      `🧾 *ऑर्डर सारांश (पुष्टी करा)*\n\n` +
      `• यादी: *{{id}}* — {{item}}\n` +
      `• शेतकरी: {{farmerName}} ({{listingLocation}})\n` +
      `• तुमचे ठिकाण: {{buyerLocation}}\n` +
      `• प्रमाण: *{{quantity}} टन*\n` +
      `• एकूण रक्कम: *{{total}}*\n\n` +
      `पेमेंट लिंकसाठी *YES* पाठवा, किंवा *CANCEL* पाठवा.`,
  },
  checkout_ready: {
    en:
      `💳 *PayPal Checkout Ready* (valid for 30 minutes)\n\n` +
      `• Item: {{quantity}} Tons {{item}}\n` +
      `• Order ID: \`{{orderId}}\`\n` +
      `• Amount: *{{total}}* ($${'{{usd}}'} USD)\n\n` +
      `👉 Tap to pay:\n{{url}}\n\n` +
      `_Your PDF receipt will arrive here automatically once paid._`,
    hi:
      `💳 *पेपाल चेकआउट तैयार है* (30 मिनट के लिए मान्य)\n\n` +
      `• सामग्री: {{quantity}} टन {{item}}\n` +
      `• ऑर्डर ID: \`{{orderId}}\`\n` +
      `• राशि: *{{total}}* ($${'{{usd}}'} USD)\n\n` +
      `👉 भुगतान करने के लिए खोलें:\n{{url}}\n\n` +
      `_भुगतान होते ही आपकी PDF रसीद यहाँ आ जाएगी।_`,
    pa:
      `💳 *ਪੇਪਾਲ ਚੈੱਕਆਊਟ ਤਿਆਰ ਹੈ* (30 ਮਿੰਟ ਲਈ ਵੈਧ)\n\n` +
      `• ਸਮੱਗਰੀ: {{quantity}} ਟਨ {{item}}\n` +
      `• ਆਰਡਰ ID: \`{{orderId}}\`\n` +
      `• ਰਕਮ: *{{total}}* ($${'{{usd}}'} USD)\n\n` +
      `👉 ਭੁਗਤਾਨ ਕਰਨ ਲਈ ਖੋਲ੍ਹੋ:\n{{url}}\n\n` +
      `_ਭੁਗਤਾਨ ਹੁੰਦੇ ਹੀ PDF ਰਸੀਦ ਇੱਥੇ ਆ ਜਾਵੇਗੀ।_`,
    mr:
      `💳 *पेपाल चेकआउट तयार आहे* (30 मिनिटांसाठी वैध)\n\n` +
      `• साहित्य: {{quantity}} टन {{item}}\n` +
      `• ऑर्डर ID: \`{{orderId}}\`\n` +
      `• रक्कम: *{{total}}* ($${'{{usd}}'} USD)\n\n` +
      `👉 पेमेंट करण्यासाठी उघडा:\n{{url}}\n\n` +
      `_पेमेंट झाल्यावर PDF पावती येथे येईल._`,
  },
  payment_confirmed: {
    en:
      `✅ *Payment Confirmed!*\n\n` +
      `• Order ID: \`{{orderId}}\`\n` +
      `• Item: {{quantity}}T {{item}}\n` +
      `• Paid: *{{total}}* ($${'{{usd}}'} USD)\n` +
      `• Farmer Payout: {{payoutNote}}\n\n` +
      `Your official PDF receipt is attached below.`,
    hi:
      `✅ *भुगतान सफल हो गया!*\n\n` +
      `• ऑर्डर ID: \`{{orderId}}\`\n` +
      `• सामग्री: {{quantity}} टन {{item}}\n` +
      `• भुगतान: *{{total}}* ($${'{{usd}}'} USD)\n` +
      `• किसान भुगतान: {{payoutNote}}\n\n` +
      `आपकी आधिकारिक PDF रसीद नीचे संलग्न है।`,
    pa:
      `✅ *ਭੁਗਤਾਨ ਪੱਕਾ ਹੋ ਗਿਆ!*\n\n` +
      `• ਆਰਡਰ ID: \`{{orderId}}\`\n` +
      `• ਸਮੱਗਰੀ: {{quantity}} ਟਨ {{item}}\n` +
      `• ਭੁਗਤਾਨ: *{{total}}* ($${'{{usd}}'} USD)\n` +
      `• ਕਿਸਾਨ ਭੁਗਤਾਨ: {{payoutNote}}\n\n` +
      `ਤੁਹਾਡੀ PDF ਰਸੀਦ ਹੇਠਾਂ ਭੇਜੀ ਗਈ ਹੈ।`,
    mr:
      `✅ *पेमेंट यशस्वी झाले!*\n\n` +
      `• ऑर्डर ID: \`{{orderId}}\`\n` +
      `• साहित्य: {{quantity}} टन {{item}}\n` +
      `• भरलेली रक्कम: *{{total}}* ($${'{{usd}}'} USD)\n` +
      `• शेतकरी पेआउट: {{payoutNote}}\n\n` +
      `तुमची अधिकृत PDF पावती खाली जोडली आहे.`,
  },
  receipt_caption: {
    en: `GreenRoots Receipt ({{receiptId}})`,
    hi: `ग्रीनरूट्स रसीद ({{receiptId}})`,
    pa: `ਗ੍ਰੀਨਰੂਟਸ ਰਸੀਦ ({{receiptId}})`,
    mr: `ग्रीनरूट्स पावती ({{receiptId}})`,
  },
  checkout_reminder: {
    en: `⏰ Reminder: Your order \`{{orderId}}\` ({{total}}) is still pending and will expire in 15 minutes.\n👉 {{url}}`,
    hi: `⏰ अनुस्मारक: आपका ऑर्डर \`{{orderId}}\` ({{total}}) अभी बाकी है और 15 मिनट में समाप्त हो जाएगा।\n👉 {{url}}`,
    pa: `⏰ ਯਾਦ ਦਿਵਾਉਣਾ: ਤੁਹਾਡਾ ਆਰਡਰ \`{{orderId}}\` ({{total}}) ਬਾਕੀ ਹੈ ਅਤੇ 15 ਮਿੰਟਾਂ ਵਿੱਚ ਖਤਮ ਹੋ ਜਾਵੇਗਾ।\n👉 {{url}}`,
    mr: `⏰ स्मरणपत्र: तुमचा ऑर्डर \`{{orderId}}\` ({{total}}) प्रलंबित आहे आणि 15 मिनिटांत कालबाह्य होईल.\n👉 {{url}}`,
  },
  checkout_expired: {
    en: `⌛ Your checkout \`{{orderId}}\` has *expired* after 30 minutes and the listing has been released. Send \`/listings\` anytime to start a fresh order.`,
    hi: `⌛ आपका चेकआउट \`{{orderId}}\` 30 मिनट बाद *समाप्त* हो गया है। नया ऑर्डर शुरू करने के लिए \`/listings\` भेजें।`,
    pa: `⌛ ਤੁਹਾਡਾ ਚੈੱਕਆਊਟ \`{{orderId}}\` 30 ਮਿੰਟਾਂ ਬਾਅਦ *ਖਤਮ* ਹੋ ਗਿਆ ਹੈ। ਨਵਾਂ ਆਰਡਰ ਕਰਨ ਲਈ \`/listings\` ਭੇਜੋ।`,
    mr: `⌛ तुमचा चेकआउट \`{{orderId}}\` 30 मिनिटांनंतर *कालबाह्य* झाला आहे. नवीन ऑर्डरसाठी \`/listings\` पाठवा.`,
  },
  checkout_expired_payment_review: {
    en: `⚠️ Payment was received for expired order \`{{orderId}}\`. We have logged this and flagged it for manual review—our team will follow up shortly.`,
    hi: `⚠️ समाप्त हो चुके ऑर्डर \`{{orderId}}\` के लिए भुगतान प्राप्त हुआ है। इसे लॉग कर मैन्युअल समीक्षा के लिए चिह्नित किया गया है।`,
    pa: `⚠️ ਮਿਆਦ ਪੁੱਗੇ ਆਰਡਰ \`{{orderId}}\` ਲਈ ਭੁਗਤਾਨ ਪ੍ਰਾਪਤ ਹੋਇਆ ਹੈ। ਇਸਨੂੰ ਮੈਨੂਅਲ ਜਾਂਚ ਲਈ ਦਰਜ ਕੀਤਾ ਗਿਆ ਹੈ।`,
    mr: `⚠️ कालबाह्य झालेल्या ऑर्डर \`{{orderId}}\` साठी पेमेंट मिळाले आहे. हे मॅन्युअल तपासणीसाठी नोंदवले आहे.`,
  },
  checkout_cancelled: {
    en: `❌ Checkout was cancelled. No payment was charged.`,
    hi: `❌ चेकआउट रद्द कर दिया गया। कोई शुल्क नहीं काटा गया।`,
    pa: `❌ ਚੈੱਕਆਊਟ ਰੱਦ ਕਰ ਦਿੱਤਾ ਗਿਆ। ਕੋਈ ਪੈਸਾ ਨਹੀਂ ਕੱਟਿਆ ਗਿਆ।`,
    mr: `❌ चेकआउट रद्द केले आहे. कोणतेही शुल्क आकारले नाही.`,
  },
  cancelled_action: {
    en: `❎ Cancelled. What would you like to do next?`,
    hi: `❎ रद्द कर दिया गया। आगे क्या करना चाहेंगे?`,
    pa: `❎ ਰੱਦ ਕਰ ਦਿੱਤਾ ਗਿਆ। ਅੱਗੇ ਕੀ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?`,
    mr: `❎ रद्द केले. पुढे काय करायचे आहे?`,
  },
  rephrase_prompt: {
    en: `Sorry, I couldn't quite understand that. Could you please rephrase simply?`,
    hi: `माफ़ कीजिए, मैं ठीक से समझ नहीं पाया। कृपया थोड़ा सरल शब्दों में दोबारा बताएं।`,
    pa: `ਮਾਫ਼ ਕਰਨਾ, ਮੈਂ ਠੀਕ ਤਰ੍ਹਾਂ ਸਮਝ ਨਹੀਂ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਦੱਸੋ।`,
    mr: `क्षमस्व, मला नीट समजले नाही. कृपया पुन्हा सोप्या शब्दांत सांगा.`,
  },
  invalid_step_hint: {
    en: `Please complete the current step first, or reply *CANCEL* to start over.`,
    hi: `कृपया पहले वर्तमान चरण पूरा करें, या फिर से शुरू करने के लिए *CANCEL* भेजें।`,
    pa: `ਕਿਰਪਾ ਕਰਕੇ ਪਹਿਲਾਂ ਮੌਜੂਦਾ ਕਦਮ ਪੂਰਾ ਕਰੋ, ਜਾਂ ਦੁਬਾਰਾ ਸ਼ੁਰੂ ਕਰਨ ਲਈ *CANCEL* ਭੇਜੋ।`,
    mr: `कृपया आधी सध्याची पायरी पूर्ण करा, किंवा पुन्हा सुरू करण्यासाठी *CANCEL* पाठवा.`,
  },
  listing_not_found: {
    en: `That listing is not available right now. Reply \`/listings\` to see active listings.`,
    hi: `यह लिस्टिंग अभी उपलब्ध नहीं है। सक्रिय लिस्टिंग देखने के लिए \`/listings\` भेजें।`,
    pa: `ਇਹ ਲਿਸਟਿੰਗ ਇਸ ਵੇਲੇ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਲਿਸਟਿੰਗ ਦੇਖਣ ਲਈ \`/listings\` ਭੇਜੋ।`,
    mr: `ही यादी सध्या उपलब्ध नाही. सक्रिय याद्या पाहण्यासाठी \`/listings\` पाठवा.`,
  },
  location_hub_found: {
    en:
      `📍 *Nearest Collection Hub*\n\n` +
      `• Hub: *{{hubName}}*\n` +
      `• Village: {{hubVillage}}\n` +
      `• Distance: *{{distanceKm}} km away*\n` +
      `• Hours: {{hubHours}}\n` +
      `• Maps: {{mapsUrl}}`,
    hi:
      `📍 *नज़दीकी संग्रह केंद्र*\n\n` +
      `• केंद्र: *{{hubName}}*\n` +
      `• गाँव: {{hubVillage}}\n` +
      `• दूरी: *{{distanceKm}} किमी*\n` +
      `• समय: {{hubHours}}\n` +
      `• नक्शा: {{mapsUrl}}`,
    pa:
      `📍 *ਨੇੜਲਾ ਸੰਗ੍ਰਹਿ ਕੇਂਦਰ*\n\n` +
      `• ਕੇਂਦਰ: *{{hubName}}*\n` +
      `• ਪਿੰਡ: {{hubVillage}}\n` +
      `• ਦੂਰੀ: *{{distanceKm}} ਕਿਮੀ*\n` +
      `• ਸਮਾਂ: {{hubHours}}\n` +
      `• ਨਕਸ਼ਾ: {{mapsUrl}}`,
    mr:
      `📍 *जवळचे संकलन केंद्र*\n\n` +
      `• केंद्र: *{{hubName}}*\n` +
      `• गाव: {{hubVillage}}\n` +
      `• अंतर: *{{distanceKm}} किमी*\n` +
      `• वेळ: {{hubHours}}\n` +
      `• नकाशा: {{mapsUrl}}`,
  },
  photo_grade_report: {
    en:
      `📸 *Crop Waste Quality Report*\n\n` +
      `• Item: *{{item}}*\n` +
      `• Quality Grade: *Grade {{grade}}* ({{moisture}})\n` +
      `• Suggested Price: *{{price}}/ton*\n\n` +
      `{{summary}}\n\n` +
      `How many *tons* do you have to sell?`,
    hi:
      `📸 *फसल कचरा गुणवत्ता रिपोर्ट*\n\n` +
      `• सामग्री: *{{item}}*\n` +
      `• गुणवत्ता ग्रेड: *ग्रेड {{grade}}* ({{moisture}})\n` +
      `• सुझाई गई कीमत: *{{price}}/टन*\n\n` +
      `{{summary}}\n\n` +
      `आपके पास बेचने के लिए कितने *टन* हैं?`,
    pa:
      `📸 *ਫ਼ਸਲੀ ਕਚਰਾ ਗੁਣਵੱਤਾ ਰਿਪੋਰਟ*\n\n` +
      `• ਸਮੱਗਰੀ: *{{item}}*\n` +
      `• ਗ੍ਰੇਡ: *ਗ੍ਰੇਡ {{grade}}* ({{moisture}})\n` +
      `• ਸੁਝਾਈ ਕੀਮਤ: *{{price}}/ਟਨ*\n\n` +
      `{{summary}}\n\n` +
      `ਤੁਹਾਡੇ ਕੋਲ ਵੇਚਣ ਲਈ ਕਿੰਨੇ *ਟਨ* ਹਨ?`,
    mr:
      `📸 *शेती कचरा गुणवत्ता अहवाल*\n\n` +
      `• साहित्य: *{{item}}*\n` +
      `• ग्रेड: *ग्रेड {{grade}}* ({{moisture}})\n` +
      `• सुचवलेला भाव: *{{price}}/टन*\n\n` +
      `{{summary}}\n\n` +
      `तुमच्याकडे विक्रीसाठी किती *टन* आहेत?`,
  },
  photo_grade_report_buyer: {
    en:
      `📸 *Crop Waste Quality Report*\n\n` +
      `• Item: *{{item}}*\n` +
      `• Quality Grade: *Grade {{grade}}* ({{moisture}})\n` +
      `• Estimated Market Price: *{{price}}/ton*\n\n` +
      `{{summary}}\n\n` +
      `_Want to list & sell this yourself? Send \`/role farmer\` to switch, or \`/listings\` to buy._`,
    hi:
      `📸 *फसल कचरा गुणवत्ता रिपोर्ट*\n\n` +
      `• सामग्री: *{{item}}*\n` +
      `• गुणवत्ता ग्रेड: *ग्रेड {{grade}}* ({{moisture}})\n` +
      `• अनुमानित बाज़ार कीमत: *{{price}}/टन*\n\n` +
      `{{summary}}\n\n` +
      `_यदि आप इसे बेचना चाहते हैं, तो \`/role farmer\` भेजकर किसान मोड में बदलें, या खरीदने के लिए \`/listings\` देखें।_`,
    pa:
      `📸 *ਫ਼ਸਲੀ ਕਚਰਾ ਗੁਣਵੱਤਾ ਰਿਪੋਰਟ*\n\n` +
      `• ਸਮੱਗਰੀ: *{{item}}*\n` +
      `• ਗ੍ਰੇਡ: *ਗ੍ਰੇਡ {{grade}}* ({{moisture}})\n` +
      `• ਅੰਦਾਜ਼ਨ ਕੀਮਤ: *{{price}}/ਟਨ*\n\n` +
      `{{summary}}\n\n` +
      `_ਜੇਕਰ ਤੁਸੀਂ ਇਸਨੂੰ ਵੇਚਣਾ ਚਾਹੁੰਦੇ ਹੋ, ਤਾਂ \`/role farmer\` ਭੇਜੋ, ਜਾਂ ਖਰੀਦਣ ਲਈ \`/listings\` ਦੇਖੋ।_`,
    mr:
      `📸 *शेती कचरा गुणवत्ता अहवाल*\n\n` +
      `• साहित्य: *{{item}}*\n` +
      `• ग्रेड: *ग्रेड {{grade}}* ({{moisture}})\n` +
      `• अंदाजे बाजारभाव: *{{price}}/टन*\n\n` +
      `{{summary}}\n\n` +
      `_तुम्हाला हे विकायचे असल्यास \`/role farmer\` पाठवा, किंवा खरेदीसाठी \`/listings\` पहा._`,
  },
  ton_unit: {
    en: 'Tons',
    hi: 'टन',
    pa: 'ਟਨ',
    mr: 'टन',
  },
  deadline_label: {
    en: 'Deadline',
    hi: 'अंतिम तिथि',
    pa: 'ਆਖਰੀ ਮਿਤੀ',
    mr: 'अंतिम मुदत',
  },
  pools_header: {
    en: 'Live Industry Pools',
    hi: 'लाइव उद्योग पूल',
    pa: 'ਲਾਈਵ ਉਦਯੋਗ ਪੂਲ',
    mr: 'लाइव्ह उद्योग पूल',
  },
  payment_pending_reminder: {
    en: `⏳ Payment is still pending. Please complete it using the link above, or reply *CANCEL* to cancel this order.`,
    hi: `⏳ भुगतान अभी भी बाकी है। ऊपर दिए गए लिंक से पेमेंट पूरा करें, या ऑर्डर रद्द करने के लिए *CANCEL* भेजें।`,
    pa: `⏳ ਭੁਗਤਾਨ ਅਜੇ ਬਾਕੀ ਹੈ। ਉੱਪਰ ਦਿੱਤੇ ਲਿੰਕ ਤੋਂ ਭੁਗਤਾਨ ਪੂਰਾ ਕਰੋ, ਜਾਂ ਰੱਦ ਕਰਨ ਲਈ *CANCEL* ਭੇਜੋ।`,
    mr: `⏳ पेमेंट अद्याप बाकी आहे. वरील लिंकवरून पेमेंट पूर्ण करा, किंवा रद्द करण्यासाठी *CANCEL* पाठवा.`,
  },
  role_switched: {
    en: `🔄 Switched to *{{roleLabel}}* mode.`,
    hi: `🔄 अब आप *{{roleLabel}}* मोड में हैं।`,
    pa: `🔄 ਹੁਣ ਤੁਸੀਂ *{{roleLabel}}* ਮੋਡ ਵਿੱਚ ਹੋ।`,
    mr: `🔄 आता तुम्ही *{{roleLabel}}* मोडमध्ये आहात.`,
  },
  generic_error: {
    en: `⚠️ Something went wrong. Please try again in a moment.`,
    hi: `⚠️ कुछ गड़बड़ हो गई। कृपया थोड़ी देर में फिर प्रयास करें।`,
    pa: `⚠️ ਕੁਝ ਗਲਤ ਹੋ ਗਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਥੋੜ੍ਹੀ ਦੇਰ ਬਾਅਦ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।`,
    mr: `⚠️ काहीतरी चूक झाली. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.`,
  },
} as const;

export type I18nKey = keyof typeof DICTIONARY;
export const ALL_I18N_KEYS = Object.keys(DICTIONARY) as I18nKey[];

export function getDictionary(): typeof DICTIONARY {
  return DICTIONARY;
}

export function t(
  lang: LangCode,
  key: I18nKey,
  vars?: Record<string, string | number>
): string {
  const entry = DICTIONARY[key] as Record<LangCode, string>;
  let template = entry?.[lang];
  if (!template) {
    console.warn(`[i18n] Missing key "${key}" for language "${lang}", falling back to "en".`);
    template = entry?.en ?? String(key);
  }

  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_match, varName: string) =>
    vars[varName] !== undefined ? String(vars[varName]) : ''
  );
}
