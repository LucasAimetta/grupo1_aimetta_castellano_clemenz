import React, { useState, useEffect, useRef } from 'react';
import * as nsfwjs from 'nsfwjs';
import { UploadCloud, Link as LinkIcon, X, Loader, AlertTriangle, Image as ImageIcon } from 'lucide-react';

const UniversalImageInput = ({ value, onChange, onFileSelect }) => {
  // value: URL actual (string)
  // onChange: Función para actualizar URL (si es modo link)
  // onFileSelect: Función para devolver el archivo a subir (si es modo archivo)

  const [mode, setMode] = useState('upload'); // 'upload' | 'url'
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
        if(!value) setMode('upload'); // Si está vacío, sugerir subir
        else setMode('url'); // Si ya tiene URL, poner modo URL
    }
  }, [value]);

  // --- LÓGICA DE VALIDACIÓN IA (Compartida) ---
  const checkSafety = async (imgElement) => {
    if (!model) return true; // Si falla la IA, dejamos pasar (fail-open) o bloquear (fail-close)
    
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
            onFileSelect(null);
            onChange({ target: { name: 'image', value: '' } });
            setLoading(false);
            return false;
        }
        return true;
    } catch (err) {
        console.warn("Error IA:", err);
        setLoading(false);
        return true; // Asumimos segura si hay error técnico
    } finally {
        setLoading(false);
    }
  };

  // --- HANDLER: SUBIR ARCHIVO ---
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        
        // Crear imagen invisible para la IA
        const img = document.createElement('img');
        img.src = objectUrl;
        img.onload = async () => {
            const isSafe = await checkSafety(img);
            if (isSafe) {
                onFileSelect(file); // Enviamos el archivo al padre
                // Limpiamos la URL de texto para evitar conflictos
                onChange({ target: { name: 'image', value: '' } });
            }
        };
    }
  };

  // --- HANDLER: PEGAR URL ---
  const handleUrlChange = (e) => {
    const url = e.target.value;
    setPreview(url);
    onChange(e); // Actualizamos el estado del padre
    onFileSelect(null); // Anulamos cualquier archivo seleccionado
  };

  const handleImageLoad = () => {
     if(imgRef.current) checkSafety(imgRef.current);
  };

  const clearImage = () => {
      setPreview('');
      setError(null);
      onFileSelect(null);
      onChange({ target: { name: 'image', value: '' } });
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-zinc-400">Foto del Plato</label>

      {/* TABS SELECCIONADORAS */}
      <div className="flex gap-4 border-b border-zinc-800 pb-2">
        <button 
            type="button"
            onClick={() => setMode('upload')}
            className={`flex items-center gap-2 text-sm pb-2 transition ${mode === 'upload' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-zinc-500 hover:text-white'}`}
        >
            <UploadCloud className="w-4 h-4" /> Subir Archivo
        </button>
        <button 
            type="button"
            onClick={() => setMode('url')}
            className={`flex items-center gap-2 text-sm pb-2 transition ${mode === 'url' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-zinc-500 hover:text-white'}`}
        >
            <LinkIcon className="w-4 h-4" /> Pegar Enlace
        </button>
      </div>

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
                {/* AQUI ESTA EL CAMBIO: object-contain */}
                <img 
                    ref={imgRef}
                    src={preview} 
                    alt="Preview" 
                    crossOrigin="anonymous"
                    onLoad={() => mode === 'url' && handleImageLoad()} // Solo chequeamos URL al cargar
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
            // Si no hay imagen, mostramos el input correspondiente
            mode === 'upload' ? (
                <div className="relative w-full h-32 border-2 border-dashed border-zinc-700 rounded-lg bg-zinc-800/30 hover:bg-zinc-800 hover:border-orange-500/50 transition flex flex-col items-center justify-center cursor-pointer group">
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-2 text-zinc-500 group-hover:text-orange-400">
                        <UploadCloud className="w-8 h-8" />
                        <span className="text-sm font-medium">Click para subir imagen</span>
                    </div>
                </div>
            ) : (
                <div className="relative">
                    <ImageIcon className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                    <input 
                        name="image" 
                        value={value || ''} 
                        onChange={handleUrlChange} 
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 pl-10 outline-none focus:border-orange-500 transition"
                        placeholder="https://..."
                    />
                </div>
            )
        )}
      </div>
    </div>
  );
};

export default UniversalImageInput;