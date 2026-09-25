// Zal AI voice: speech-to-text (voice messages) and text-to-speech (answers read aloud), in the browser, free.
// A "call" is a loop: listen → ask Zal AI → speak the answer → listen again, until hang-up.
(() => {
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  const LOC = { ar: "ar-SA", fr: "fr-BE", nl: "nl-BE", en: "en-GB" };
  let rec = null, call = null;

  function listen(lang) {
    return new Promise((ok, fail) => {
      if (!R) return fail(new Error("unsupported"));
      stopListen();
      const r = rec = new R();
      r.lang = LOC[lang] || lang || "en-GB"; r.interimResults = false; r.maxAlternatives = 1;
      let said = "";
      r.onresult = e => { said = e.results[0][0].transcript; };
      r.onerror = e => { rec = null; e.error === "no-speech" || e.error === "aborted" ? ok("") : fail(new Error(e.error)); };
      r.onend = () => { rec = null; ok(said.trim()); };
      r.start();
    });
  }
  function stopListen() { if (rec) { try { rec.abort(); } catch (e) {} rec = null; } }

  // strip markdown and emojis so the voice reads clean sentences
  const clean = t => String(t || "").replace(/\*\*|__|[*_#`>]/g, "").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").replace(/\n+/g, ". ");
  function speak(text, lang) {
    return new Promise(ok => {
      if (!window.speechSynthesis) return ok();
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean(text));
      const code = /[؀-ۿ]/.test(text) ? "ar" : (lang || "en");
      u.lang = LOC[code] || code;
      const v = speechSynthesis.getVoices().find(x => x.lang && x.lang.toLowerCase().startsWith(code));
      if (v) u.voice = v;
      u.onend = u.onerror = () => ok();
      speechSynthesis.speak(u);
    });
  }

  // ask(text) must return a Promise of the answer text; onState("listening"|"thinking"|"speaking"|"ended")
  async function startCall({ lang, ask, onState, greeting }) {
    endCall();
    const me = call = { on: true };
    const st = s => { if (call === me && onState) onState(s); };
    if (greeting) { st("speaking"); await speak(greeting, lang); }
    let silent = 0;
    while (call === me && me.on) {
      st("listening");
      let q = "";
      try { q = await listen(lang); } catch (e) { st("ended"); call = null; return; }
      if (call !== me) break;
      if (!q) { if (++silent >= 3) break; continue; }
      silent = 0;
      st("thinking");
      const a = await ask(q);
      if (call !== me) break;
      st("speaking"); await speak(a, lang);
    }
    if (call === me) { call = null; st("ended"); }
  }
  function endCall() { call = null; stopListen(); if (window.speechSynthesis) speechSynthesis.cancel(); }

  if (window.speechSynthesis) speechSynthesis.getVoices();  // warm up the voice list
  window.ZalVoice = { supported: !!R, listen, stopListen, speak, startCall, endCall };
})();
