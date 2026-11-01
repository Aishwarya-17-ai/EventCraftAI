/**
 * EventCraft AI - Speech Recognition Module
 * Safe browser speech recognition wrapper supporting English (en-IN) and Tamil (ta-IN).
 * Handles browser capability detection, interim streaming, auto-timeouts,
 * friendly error messages, and immediate cleanup without audio or transcript storage.
 */

export interface SpeechRecognitionController {
  stop: () => void;
  abort: () => void;
}

export interface SpeechRecognitionOptions {
  language: 'en-IN' | 'ta-IN';
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onError: (errorMessage: string) => void;
  onEnd: () => void;
  onStart?: () => void;
}

// Minimal interface for webkit / standard SpeechRecognition
interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence?: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  item: (index: number) => SpeechRecognitionAlternativeLike;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    item: (index: number) => SpeechRecognitionResultLike;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

/**
 * Checks whether the current browser environment supports the Web Speech API.
 * Returns true if standard SpeechRecognition or webkitSpeechRecognition exists.
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

/**
 * Retrieves the available SpeechRecognition constructor or null if unsupported.
 */
function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

/**
 * Starts speech recognition session with strict 30-second ceiling and silence handling.
 * Calls callbacks when speech tokens are parsed and guarantees resources are cleanly released.
 */
export function startSpeechRecognition(
  options: SpeechRecognitionOptions
): SpeechRecognitionController {
  const Constructor = getSpeechRecognitionConstructor();
  if (!Constructor) {
    options.onError('Voice input is not supported in this browser; type instead.');
    options.onEnd();
    return {
      stop: () => {},
      abort: () => {},
    };
  }

  let recognition: SpeechRecognitionInstance | null = null;
  let hasStopped = false;
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;

  const cleanup = () => {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
  };

  const safeStop = () => {
    if (hasStopped) return;
    hasStopped = true;
    cleanup();
    try {
      recognition?.stop();
    } catch {
      // Ignored if already stopped
    }
  };

  const safeAbort = () => {
    if (hasStopped) return;
    hasStopped = true;
    cleanup();
    try {
      recognition?.abort();
    } catch {
      // Ignored if already aborted
    }
  };

  try {
    recognition = new Constructor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = options.language;

    recognition.onstart = () => {
      // 30 seconds maximum hard timeout
      timeoutTimer = setTimeout(() => {
        safeStop();
      }, 30000);

      // Initial 8 seconds silence timer
      silenceTimer = setTimeout(() => {
        safeStop();
      }, 8000);

      options.onStart?.();
    };

    
recognition.onresult = (event: SpeechRecognitionEventLike) => {
  // Reset silence timer whenever speech is detected
  if (silenceTimer) {
    clearTimeout(silenceTimer);
  }

  silenceTimer = setTimeout(() => {
    safeStop();
  }, 5000);

  let finalTranscript = '';

  // Collect only final speech results
  for (let i = 0; i < event.results.length; i++) {
    const res = event.results[i];

    if (res && res.isFinal && res[0]) {
      finalTranscript += res[0].transcript + ' ';
    }
  }

  // Send only finalized speech to SmartIntake
  if (finalTranscript.trim()) {
    options.onTranscript(finalTranscript.trim(), true);
  }
};


    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      cleanup();
      const code = event.error || '';
      let message = 'Voice input error: please type your description.';

      if (code === 'not-allowed' || code === 'service-not-allowed') {
        message = 'Microphone access was denied. Please allow microphone permissions in your browser or type your description.';
      } else if (code === 'no-speech') {
        message = 'No speech was detected. Please try again or type instead.';
      } else if (code === 'aborted') {
        return; // Normal cancellation
      }

      options.onError(message);
    };

    recognition.onend = () => {
      cleanup();
      options.onEnd();
    };

    recognition.start();
  } catch (err) {
    cleanup();
    options.onError(
      err instanceof Error && err.message
        ? `Speech error: ${err.message}`
        : 'Could not initialize speech recognition.'
    );
    options.onEnd();
  }

  return {
    stop: safeStop,
    abort: safeAbort,
  };
}
