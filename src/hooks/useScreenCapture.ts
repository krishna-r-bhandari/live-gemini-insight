import { useRef, useCallback, useEffect } from 'react';

export const useScreenCapture = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const currentFrameRef = useRef<string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { max: 640 },
          height: { max: 480 },
        },
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              console.log("video loaded metadata");
              resolve();
            };
          }
        });
      }

      // Start capturing frames every 3 seconds
      intervalRef.current = setInterval(captureImage, 3000);
    } catch (err) {
      console.error("Error accessing the screen: ", err);
    }
  }, []);

  const captureImage = useCallback(() => {
    if (streamRef.current && videoRef.current && canvasRef.current && 
        videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
      
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = 640;
        canvasRef.current.height = 480;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const imageData = canvasRef.current.toDataURL("image/jpeg").split(",")[1].trim();
        currentFrameRef.current = imageData;
      }
    } else {
      console.log("no stream or video metadata not loaded");
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const getCurrentFrame = useCallback(() => {
    return currentFrameRef.current;
  }, []);

  useEffect(() => {
    return () => {
      stopScreenShare();
    };
  }, [stopScreenShare]);

  return {
    videoRef,
    canvasRef,
    startScreenShare,
    stopScreenShare,
    getCurrentFrame,
  };
};