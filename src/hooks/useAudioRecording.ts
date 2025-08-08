import { useRef, useCallback } from 'react';

export const useAudioRecording = (onAudioData: (b64PCM: string) => void) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const pcmDataRef = useRef<number[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);

  const recordChunk = useCallback(() => {
    const buffer = new ArrayBuffer(pcmDataRef.current.length * 2);
    const view = new DataView(buffer);
    pcmDataRef.current.forEach((value, index) => {
      view.setInt16(index * 2, value, true);
    });

    const base64 = btoa(
      String.fromCharCode.apply(null, new Uint8Array(buffer))
    );

    onAudioData(base64);
    pcmDataRef.current = [];
  }, [onAudioData]);

  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return;

    try {
      audioContextRef.current = new AudioContext({
        sampleRate: 16000,
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
        },
      });

      const source = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcm16[i] = inputData[i] * 0x7fff;
        }
        pcmDataRef.current.push(...pcm16);
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      intervalRef.current = setInterval(recordChunk, 3000);
      isRecordingRef.current = true;
    } catch (error) {
      console.error("Error starting audio recording:", error);
    }
  }, [recordChunk]);

  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return;

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    isRecordingRef.current = false;
  }, []);

  return {
    startRecording,
    stopRecording,
    isRecording: isRecordingRef.current,
  };
};