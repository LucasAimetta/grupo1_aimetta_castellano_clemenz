import React, { useState, useRef, useEffect } from 'react';
import * as nsfwjs from 'nsfwjs';
import { ShieldCheck, AlertTriangle, Loader2, ImageIcon } from 'lucide-react';

const SafeImageInput = ({ value, onChange }) => {
  const [model, setModel] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(null);
  const [isSafe, setIsSafe] = useState(false);
  const imgRef = useRef(null);

  // 1. Cargar el modelo de IA al iniciar el componente (solo una vez)
  useEffect(() => {
    const loadModel = async () => {
      try {
        const _model = await nsfwjs.load();
        setModel(_model);
        console.log("IA de Moderación Cargada 🤖");
      } catch (err) {
        console.error("Error cargando modelo NSFW:", err);
      }
    };
    loadModel();
  }, []);

  // 2. Función que analiza la imagen cuando termina de cargar
  const checkImageSafety = async () => {
    if (!model || !imgRef.current) return;

    setIsChecking(true);
    setError(null);
    setIsSafe(false);

    try {
      // La IA clasifica la imagen
      const predictions = await model.classify(imgRef.current);
      
      // Buscamos si hay algo indebido con más de 60% de certeza
      const restricted = predictions.find(p => 
        ['Porn', 'Hentai', 'Sexy'].includes(p.className) && p.probability > 0.6
      );

      if (restricted) {
        setError("⚠️ Imagen bloqueada por contenido inapropiado.");
        // Opcional: Limpiar el input automáticamente
        // onChange({ target: { name: 'image', value: '' } }); 
      } else {
        setIsSafe(true);
      }
    } catch (err) {
      // Si falla (ej. CORS), dejamos pasar la imagen pero avisamos en consola
      console.warn("No se pudo analizar la imagen (posible bloqueo CORS).", err);
      setIsSafe(true); // Asumimos inocencia si falla la carga técnica
    } finally {
      setIsChecking(false);
    }
  };

  const handleInputChange = (e) => {
    const url = e.target.value;
    setIsSafe(false);
    setError(null);
    onChange(e); // Propagamos el cambio al padre inmediatamente
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-400 mb-1">
        Imagen (URL)
      </label>
      
      <div className="relative">
        <ImageIcon className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
        <input 
          type="text"
          name="image" 
          value={value} 
          onChange={handleInputChange} 
          className={`w-full bg-zinc-800 border ${error ? 'border-red-500' : isSafe ? 'border-green-500' : 'border-zinc-700'} rounded-lg p-3 pl-10 outline-none focus:border-orange-500 transition-colors`}
          placeholder="https://ejemplo.com/foto.jpg"
        />
        
        {/* Iconos de estado a la derecha */}
        <div className="absolute right-3 top-3">
            {isChecking && <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />}
            {!isChecking && isSafe && value && <ShieldCheck className="w-5 h-5 text-green-500" />}
            {!isChecking && error && <AlertTriangle className="w-5 h-5 text-red-500" />}
        </div>
      </div>

      {/* Mensaje de Error */}
      {error && (
        <p className="text-red-400 text-xs animate-pulse font-bold">{error}</p>
      )}

      {/* IMAGEN OCULTA / PREVIEW PARA ANÁLISIS */}
      {/* Usamos crossOrigin="anonymous" para intentar leer imágenes externas */}
      {value && (
        <div className={`mt-4 relative rounded-lg overflow-hidden border border-zinc-700 w-full h-48 bg-zinc-900 ${error ? 'opacity-50 grayscale' : ''}`}>
          <img 
            ref={imgRef}
            src={value} 
            alt="Preview" 
            crossOrigin="anonymous"
            onLoad={checkImageSafety}
            onError={() => setError("La URL no es válida o no carga.")}
            className="w-full h-full object-cover"
          />
          {/* Overlay de Censura si hay error */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                 <span className="text-red-500 font-bold text-xl uppercase tracking-widest">Censurado</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SafeImageInput;