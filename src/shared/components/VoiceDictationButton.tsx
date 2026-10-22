import * as React from 'react';
import { Mic, MicOff, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export interface VoiceDictationButtonProps {
  onTranscript: (newText: string) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'default';
  label?: string;
  onSecurityViolation?: (event: { type: string; details: string }) => void;
}

export const VoiceDictationButton: React.FC<VoiceDictationButtonProps> = ({
  onTranscript,
  disabled = false,
  className = '',
  size = 'sm',
  label = 'Dictate',
  onSecurityViolation,
}) => {
  const [isListening, setIsListening] = React.useState(false);
  const [multiVoiceWarning, setMultiVoiceWarning] = React.useState(false);

  const recognitionRef = React.useRef<any>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const animFrameRef = React.useRef<number | null>(null);
  const primaryPitchHistoryRef = React.useRef<number[]>([]);

  // Stop audio analysis and release microphone stream
  const cleanupAudioAnalysis = React.useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    primaryPitchHistoryRef.current = [];
  }, []);

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      cleanupAudioAnalysis();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [cleanupAudioAnalysis]);

  /**
   * Initializes real-time acoustic analysis to monitor for multiple distinct speakers.
   * Analyzes fundamental human vocal frequencies (85 Hz - 350 Hz) and formant spread.
   */
  const startAcousticIntegrityGuard = React.useCallback(async () => {
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false, // keep ambient vocal nuances for accurate proctoring
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const sampleRate = audioCtx.sampleRate;
      const binWidth = sampleRate / analyser.fftSize; // Hz per bin

      let consecutiveDualVoiceFrames = 0;

      const analyzeFrame = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Scan the fundamental voice frequency band (approx 85 Hz to 350 Hz)
        const minBin = Math.floor(85 / binWidth);
        const maxBin = Math.ceil(350 / binWidth);

        const peaks: { freq: number; amp: number }[] = [];
        const threshold = 130; // Min amplitude for active voiced speech

        for (let i = minBin + 1; i < maxBin - 1; i++) {
          const val = dataArray[i];
          if (val > threshold && val > dataArray[i - 1] && val > dataArray[i + 1]) {
            peaks.push({ freq: Math.round(i * binWidth), amp: val });
          }
        }

        // Sort peaks descending by amplitude
        peaks.sort((a, b) => b.amp - a.amp);

        // Check for multiple distinct fundamental frequencies indicative of dual speakers
        // (separated by at least 45 Hz with substantial energy in both peaks)
        let dualVoiceDetected = false;
        if (peaks.length >= 2) {
          const p1 = peaks[0];
          const p2 = peaks[1];
          const freqDiff = Math.abs(p1.freq - p2.freq);

          // If second speaker peak is at least 70% energy of primary speaker and pitch is distinctly separated
          if (freqDiff >= 45 && p2.amp >= p1.amp * 0.72) {
            dualVoiceDetected = true;
          }
        }

        if (dualVoiceDetected) {
          consecutiveDualVoiceFrames++;
          // Require at least 4 consecutive frames (approx 65-70ms) to avoid single-frame transients
          if (consecutiveDualVoiceFrames >= 4) {
            setMultiVoiceWarning(true);
            toast.error(
              'Security Violation: Multiple voices detected! Examination rules require strict single-speaker silence.',
              { duration: 5000, id: 'multi-voice-alert' }
            );

            onSecurityViolation?.({
              type: 'MULTIPLE_VOICES_DETECTED',
              details: `Secondary speaker detected with prominent acoustic frequencies (${peaks[0]?.freq}Hz & ${peaks[1]?.freq}Hz).`,
            });

            // Immediately halt recognition to reject prompted speech
            if (recognitionRef.current) {
              try {
                recognitionRef.current.abort();
              } catch {}
            }
            setIsListening(false);
            cleanupAudioAnalysis();
            return;
          }
        } else {
          consecutiveDualVoiceFrames = Math.max(0, consecutiveDualVoiceFrames - 1);
        }

        animFrameRef.current = requestAnimationFrame(analyzeFrame);
      };

      animFrameRef.current = requestAnimationFrame(analyzeFrame);
    } catch (err) {
      console.warn('Acoustic proctoring could not be started:', err);
    }
  }, [cleanupAudioAnalysis, onSecurityViolation]);

  const toggleListening = React.useCallback(async () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      cleanupAudioAnalysis();
      return;
    }

    setMultiVoiceWarning(false);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Voice dictation is not supported by your browser. Please use Chrome or Edge.');
      return;
    }

    try {
      // Start multi-voice acoustic integrity monitor
      await startAcousticIntegrityGuard();

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        toast.info('Listening... Speak your answer clearly. Only the examinee may speak.', {
          duration: 3000,
        });
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript.trim()) {
          onTranscript(finalTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        cleanupAudioAnalysis();
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please grant microphone permission to use dictation.');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          toast.error(`Voice dictation stopped: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        cleanupAudioAnalysis();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to initialize speech recognition:', err);
      toast.error('Could not start microphone dictation.');
      setIsListening(false);
      cleanupAudioAnalysis();
    }
  }, [cleanupAudioAnalysis, isListening, onTranscript, startAcousticIntegrityGuard]);

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        title={
          isListening
            ? 'Stop voice dictation (Single-speaker monitor active)'
            : 'Start voice dictation (Single-speaker proctored)'
        }
        aria-label={isListening ? 'Stop voice dictation' : 'Start voice dictation'}
        className={`inline-flex items-center gap-1.5 font-medium transition-all rounded-md ${
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        } border ${
          isListening
            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-400 dark:border-rose-500 animate-pulse'
            : multiVoiceWarning
              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-400'
              : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border-border'
        } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isListening ? (
          <>
            <MicOff className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              Listening (1 Voice Required)...
            </span>
          </>
        ) : multiVoiceWarning ? (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Multiple Voices Blocked</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-primary" />
            <span>{label}</span>
          </>
        )}
      </button>

      {isListening && (
        <span
          title="Single-Speaker Acoustic Sensor: Active. Multiple voices will trigger an immediate integrity halt."
          className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20"
        >
          <Users className="w-2.5 h-2.5" />
          Single-Voice Lock
        </span>
      )}
    </div>
  );
};
