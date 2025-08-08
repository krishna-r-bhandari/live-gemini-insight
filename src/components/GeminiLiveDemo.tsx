import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Monitor, MonitorStop } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import { useScreenCapture } from "@/hooks/useScreenCapture";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  type: 'user' | 'gemini';
  text: string;
  timestamp: Date;
}

const GeminiLiveDemo = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const { toast } = useToast();

  const { videoRef, canvasRef, startScreenShare, stopScreenShare, getCurrentFrame } = useScreenCapture();
  const { initializeAudioContext, playAudioChunk } = useAudioPlayback();

  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.text) {
      setChatMessages(prev => [...prev, {
        type: 'gemini',
        text: data.text,
        timestamp: new Date()
      }]);
    }
    if (data.audio) {
      playAudioChunk(data.audio);
    }
  }, [playAudioChunk]);

  const { connect, sendVoiceMessage, isConnected } = useWebSocket(
    "ws://localhost:9083",
    handleWebSocketMessage
  );

  const handleAudioData = useCallback((b64PCM: string) => {
    const currentFrame = getCurrentFrame();
    sendVoiceMessage(b64PCM, currentFrame);
  }, [sendVoiceMessage, getCurrentFrame]);

  const { startRecording, stopRecording } = useAudioRecording(handleAudioData);

  useEffect(() => {
    const initialize = async () => {
      await initializeAudioContext();
      connect();
    };
    initialize();
  }, [initializeAudioContext, connect]);

  const handleStartScreenShare = async () => {
    try {
      await startScreenShare();
      setIsScreenSharing(true);
      toast({
        title: "Screen sharing started",
        description: "Your screen is now being shared with Gemini",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start screen sharing",
        variant: "destructive",
      });
    }
  };

  const handleStopScreenShare = () => {
    stopScreenShare();
    setIsScreenSharing(false);
    toast({
      title: "Screen sharing stopped",
      description: "Screen sharing has been disabled",
    });
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "Voice recording is now active",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start voice recording",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    setIsRecording(false);
    toast({
      title: "Recording stopped",
      description: "Voice recording has been disabled",
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              Gemini Live Demo
            </CardTitle>
            <div className="flex justify-center items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video and Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Screen Share & Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Screen Share Controls */}
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={isScreenSharing ? handleStopScreenShare : handleStartScreenShare}
                  variant={isScreenSharing ? "destructive" : "default"}
                  size="sm"
                >
                  {isScreenSharing ? (
                    <>
                      <MonitorStop className="w-4 h-4 mr-2" />
                      Stop Sharing
                    </>
                  ) : (
                    <>
                      <Monitor className="w-4 h-4 mr-2" />
                      Share Screen
                    </>
                  )}
                </Button>
              </div>

              {/* Video Element */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-[320px] object-cover"
                  style={{ aspectRatio: '4/3' }}
                />
                {!isScreenSharing && (
                  <div className="absolute inset-0 flex items-center justify-center text-white bg-black/50">
                    <p>Click "Share Screen" to start</p>
                  </div>
                )}
              </div>

              {/* Hidden Canvas */}
              <canvas
                ref={canvasRef}
                className="hidden"
                width={640}
                height={480}
              />

              {/* Voice Controls */}
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  variant={isRecording ? "destructive" : "secondary"}
                  size="sm"
                  disabled={!isScreenSharing}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Start Recording
                    </>
                  )}
                </Button>
              </div>

              {isRecording && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Recording active
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Log */}
          <Card>
            <CardHeader>
              <CardTitle>Chat Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] overflow-y-auto space-y-3 p-4 bg-muted/20 rounded-lg">
                {chatMessages.length === 0 ? (
                  <p className="text-center text-muted-foreground">
                    Start screen sharing and recording to begin conversation
                  </p>
                ) : (
                  chatMessages.map((message, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          {message.type === 'gemini' ? 'GEMINI' : 'USER'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm bg-background p-2 rounded border">
                        {message.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Make sure the Python WebSocket server is running on localhost:9083</li>
              <li>Click "Share Screen" to start screen sharing</li>
              <li>Click "Start Recording" to begin voice recording</li>
              <li>Gemini will analyze your screen and respond to voice input</li>
              <li>Audio responses will play automatically</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GeminiLiveDemo;