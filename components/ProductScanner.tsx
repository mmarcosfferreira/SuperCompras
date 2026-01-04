import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Zap, Loader2 } from 'lucide-react';
import { identifyProductFromImage } from '../services/geminiService';

interface Props {
  onScanComplete: (data: { name: string; price?: number }) => void;
  onClose: () => void;
}

export const ProductScanner: React.FC<Props> = ({ onScanComplete, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Prefer rear camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    setIsProcessing(true);
    
    // Draw current video frame to canvas
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      
      // Send to AI
      const result = await identifyProductFromImage(base64Image);
      
      if (result && result.name) {
        onScanComplete(result);
        stopCamera();
      } else {
        alert("Não consegui identificar o produto ou preço. Tente aproximar a etiqueta.");
        setIsProcessing(false);
      }
    } else {
        setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/50 absolute top-0 w-full z-10 text-white">
        <h3 className="font-bold text-lg">Escanear Produto</h3>
        <button onClick={onClose} className="p-2 bg-white/20 rounded-full">
          <X size={24} />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {error ? (
           <div className="text-white text-center p-6">
             <Camera size={48} className="mx-auto mb-4 opacity-50" />
             <p>{error}</p>
             <button onClick={onClose} className="mt-4 px-4 py-2 bg-white text-black rounded-lg">Voltar</button>
           </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Overlay Guides */}
            <div className="absolute inset-0 border-2 border-white/30 m-12 rounded-xl pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand-500 -mt-1 -ml-1 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand-500 -mt-1 -mr-1 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand-500 -mb-1 -ml-1 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand-500 -mb-1 -mr-1 rounded-br-lg"></div>
            </div>

            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm z-20">
                <Loader2 size={48} className="text-brand-500 animate-spin mb-4" />
                <p className="text-white font-bold text-lg animate-pulse">Analisando produto...</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls - Added significant bottom padding (pb-32) to clear bottom nav area */}
      {!error && (
        <div className="bg-black pt-8 pb-32 px-8 flex justify-center items-center relative">
           <button 
             onClick={handleCapture}
             disabled={isProcessing}
             className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
           >
             <div className="w-16 h-16 bg-white border-2 border-black rounded-full" />
           </button>
           <p className="absolute bottom-16 text-gray-500 text-xs text-center w-full">
             Aponte para o produto e preço
           </p>
        </div>
      )}
    </div>
  );
};