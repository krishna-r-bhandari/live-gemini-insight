import { useRef, useCallback } from 'react';

export const useAudioPlayback = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const initializedRef = useRef(false);

  const initializeAudioContext = useCallback(async () => {
    if (initializedRef.current) return;

    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      });

      await audioContextRef.current.audioWorklet.addModule("/pcm-processor.js");
      workletNodeRef.current = new AudioWorkletNode(audioContextRef.current, "pcm-processor");
      workletNodeRef.current.connect(audioContextRef.current.destination);
      initializedRef.current = true;
    } catch (error) {
      console.error("Error initializing audio context:", error);
    }
  }, []);

  const base64ToArrayBuffer = useCallback((base64: string) => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }, []);

  const convertPCM16LEToFloat32 = useCallback((pcmData: ArrayBuffer) => {
    const inputArray = new Int16Array(pcmData);
    const float32Array = new Float32Array(inputArray.length);

    for (let i = 0; i < inputArray.length; i++) {
      float32Array[i] = inputArray[i] / 32768;
    }

    return float32Array;
  }, []);

  const playAudioChunk = useCallback(async (base64AudioChunk: string) => {
    try {
      if (!audioContextRef.current || !workletNodeRef.current) {
        await initializeAudioContext();
      }

      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }

      const arrayBuffer = base64ToArrayBuffer(base64AudioChunk);
      const float32Data = convertPCM16LEToFloat32(arrayBuffer);

      workletNodeRef.current?.port.postMessage(float32Data);
    } catch (error) {
      console.error("Error processing audio chunk:", error);
    }
  }, [initializeAudioContext, base64ToArrayBuffer, convertPCM16LEToFloat32]);

  return {
    initializeAudioContext,
    playAudioChunk,
  };
};