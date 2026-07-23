// src/lib/voice.js
// Voice-first input for rural / low-literacy accessibility.
// Uses the Web Speech API with a graceful text fallback.

export function createSpeechRecognizer({ onResult, onEnd, lang = 'en-US' }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null; // caller renders text-only UI
  const rec = new SR();
  rec.lang = lang; rec.interimResults = true; rec.continuous = true;
  rec.onresult = (e) => {
    const transcript = Array.from(e.results).map((r) => r[0].transcript).join(' ');
    onResult(transcript, e.results[e.results.length - 1].isFinal);
  };
  rec.onend = () => onEnd?.();
  return rec;
}

export async function recordVoiceNote() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);
  const stop = () => new Promise((resolve) => {
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      resolve(new Blob(chunks, { type: 'audio/webm' }));
    };
    recorder.stop();
  });
  recorder.start();
  return { stop };
}
