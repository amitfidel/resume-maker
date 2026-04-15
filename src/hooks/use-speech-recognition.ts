"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Web Speech API types (not fully in default TS libs)
type SpeechRecognitionAlternative = { transcript: string; confidence: number };
type SpeechRecognitionResult = {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
  length: number;
};
type SpeechRecognitionResultList = {
  [index: number]: SpeechRecognitionResult;
  length: number;
};
type SpeechRecognitionEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};
type SpeechRecognitionErrorEvent = { error: string };

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type Props = {
  lang?: string;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
};

export function useSpeechRecognition({
  lang = "en-US",
  onTranscript,
}: Props = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldRestartRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SR =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor })
        .webkitSpeechRecognition;

    if (!SR) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (final) {
        onTranscript?.(final, true);
      } else if (interim) {
        onTranscript?.(interim, false);
      }
    };

    rec.onerror = (ev: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", ev.error);
      if (ev.error === "no-speech" || ev.error === "aborted") {
        // These are often non-fatal; allow restart
        return;
      }
      setError(ev.error);
      setIsListening(false);
    };

    rec.onend = () => {
      // Auto-restart if user is still supposed to be listening (browser sometimes ends early)
      if (shouldRestartRef.current) {
        try {
          rec.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = rec;

    return () => {
      shouldRestartRef.current = false;
      try {
        rec.abort();
      } catch {
        // ignore
      }
    };
  }, [lang, onTranscript]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    setError(null);
    shouldRestartRef.current = true;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // Already started - ignore
      console.warn("Speech recognition start error:", e);
    }
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    shouldRestartRef.current = false;
    try {
      recognitionRef.current.stop();
    } catch {
      // ignore
    }
    setIsListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  return { isSupported, isListening, error, start, stop, toggle };
}
