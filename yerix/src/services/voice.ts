export type VoiceResult = { phrase: string; final: boolean };

export interface VoiceRecognizer {
  start: (onResult: (result: VoiceResult) => void) => Promise<void>;
  stop: () => Promise<void>;
}

export class VoiceRecognizerStub implements VoiceRecognizer {
  async start(): Promise<void> {
    return;
  }
  async stop(): Promise<void> {
    return;
  }
}

export const voiceRecognizer: VoiceRecognizer = new VoiceRecognizerStub();
