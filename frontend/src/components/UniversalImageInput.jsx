import React, { useState, useEffect, useRef } from 'react';
import * as nsfwjs from 'nsfwjs';
import { Link as LinkIcon, X, Loader, AlertTriangle, Image as ImageIcon } from 'lucide-react';

const UniversalImageInput = ({ value, onChange }) => {
  // value: URL actual (string)
  // onChange: Función para actualizar URL

  const [model, setModel] = useState(null);
  const [preview, setPreview] = useState(value || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const imgRef = useRef(null);

  // 1. Cargar IA
  useEffect(() => {
    const loadModel = async () => {
      try {
        const _model = await nsfwjs.load();
        setModel(_model);
      } catch (err) {
        console.error("Error cargando modelo IA", err);
      }
    };
    loadModel();
  }, []);

  // Sincronizar preview si cambia el valor externo (para EditRecipe)
  useEffect(() => {
    if (typeof value === 'string' && value.startsWith('http')) {
        setPreview(value);
    }
  }, [value]);

  // --- LÓGICA DE VALIDACIÓN IA ---
  const checkSafety = async (imgElement) => {
    if (!model) return true;
    
    setLoading(true);
    setError(null);
    try {
        const predictions = await model.classify(imgElement);
        const isNSFW = predictions.some(p => 
            ['Porn', 'Hentai', 'Sexy'].includes(p.className) && p.probability > 0.6
        );

        if (isNSFW) {
            setError("⚠️ Imagen bloqueada: Contenido inapropiado.");
            setPreview('');
            onChange({ target: { name: 'image', value: '' } });
            setLoading(false);
            return false;
        }
        return true;
    } catch (err) {
        console.warn("Error IA:", err);
        setLoading(false);
        return true;
    } finally {
        setLoading(false);
    }
  };

  // --- HANDLER: PEGAR URL ---
  const handleUrlChange = (e) => {
    const url = e.target.value;
    setPreview(url);
    onChange(e);
  };

  const handleImageLoad = () => {
     if(imgRef.current) checkSafety(imgRef.current);
  };

  const clearImage = () => {
      setPreview('');
      setError(null);
      onChange({ target: { name: 'image', value: '' } });
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-zinc-400 flex items-center gap-2">
        <LinkIcon className="w-4 h-4 text-orange-500" /> Foto del Plato (URL)
      </label>

      {/* ÁREA DE INPUT */}
      <div className="relative">
        {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-2 rounded mb-2 text-sm flex items-center gap-2 animate-pulse">
                <AlertTriangle className="w-4 h-4" /> {error}
            </div>
        )}

        {/* Si ya hay imagen (preview), la mostramos */}
        {preview && !error ? (
            <div className="relative w-full h-64 bg-black rounded-lg border border-zinc-700 overflow-hidden group">
                <img 
                    ref={imgRef}
                    src={preview} 
                    alt="Preview" 
                    crossOrigin="anonymous"
                    onLoad={handleImageLoad}
                    className={`w-full h-full object-contain ${loading ? 'opacity-50 blur-sm' : ''}`} 
                />
                
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader className="animate-spin text-orange-500 w-8 h-8" />
                    </div>
                )}

                <button 
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-red-600 transition"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        ) : (
            <div className="relative">
                <ImageIcon className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                <input 
                    name="image" 
                    value={value || ''} 
                    onChange={handleUrlChange} 
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 pl-10 outline-none focus:border-orange-500 transition"
                    placeholder="https://ejemplo.com/imagen.jpg"
                />
            </div>
        )}
      </div>
    </div>
  );
};

export default UniversalImageInput;