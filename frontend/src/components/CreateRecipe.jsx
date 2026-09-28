import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Clock, ChefHat, Tag, CheckCircle, Loader, X } from 'lucide-react';
import api from '../api/axios';
import UniversalImageInput from './UniversalImageInput';

// Lista de tags sugeridos
const PREDEFINED_TAGS = [
  "Desayuno", "Almuerzo", "Cena", "Postre", 
  "Vegano", "Vegetariano", "Sin TACC", "Rápido", 
  "Saludable", "Pasta", "Carne", "Ensalada", "Picante"
];

const CreateRecipe = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Cloudinary Config
  const CLOUD_NAME = "dl2inp0cz"; 
  const UPLOAD_PRESET = "burned_uploads"; 

  // ESTADOS
  const [selectedFile, setSelectedFile] = useState(null); // Archivo para subir
  const [tags, setTags] = useState([]); 
  const [customTagInput, setCustomTagInput] = useState('');
  
  const [formData, setFormData] = useState({
    title: '', 
    description: '', 
    visibility: 'public', 
    totalTime: 0,
    dificultyLevel: 'medium', 
    image: '', // URL directa
    ingredients: [{ name: '', quantity: 0 }],
    step: [{ title: '', descripcion: '', time: 0 }]
  });

  // --- FUNCIÓN DE SUBIDA (Reutilizable) ---
  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);
    
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: data });
    if (!res.ok) throw new Error("Error subiendo imagen");
    const fileData = await res.json();
    return fileData.secure_url;
  };

  // --- HANDLERS GENERALES ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: name === 'totalTime' ? parseInt(value) || 0 : value });
  };
  
  // --- HANDLERS DE TAGS ---
  const togglePredefinedTag = (tag) => {
    if (tags.includes(tag)) setTags(tags.filter(t => t !== tag));
    else setTags([...tags, tag]);
  };

  const handleAddCustomTag = (e) => {
    e.preventDefault(); 
    const val = customTagInput.trim();
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
      setCustomTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // --- HANDLERS DE INGREDIENTES ---
  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index][field] = field === 'quantity' ? parseFloat(value) || 0 : value;
    setFormData({ ...formData, ingredients: newIngredients });
  };
  
  const addIngredient = () => {
    setFormData({ ...formData, ingredients: [...formData.ingredients, { name: '', quantity: 0 }] });
  };
  
  const removeIngredient = (index) => {
    setFormData({ ...formData, ingredients: formData.ingredients.filter((_, i) => i !== index) });
  };

  // --- HANDLERS DE PASOS ---
  const handleStepChange = (index, field, value) => {
    const newSteps = [...formData.step];
    newSteps[index][field] = field === 'time' ? parseInt(value) || 0 : value;
    setFormData({ ...formData, step: newSteps });
  };
  
  const addStep = () => {
    setFormData({ ...formData, step: [...formData.step, { title: '', descripcion: '', time: 0 }] });
  };
  
  const removeStep = (index) => {
    setFormData({ ...formData, step: formData.step.filter((_, i) => i !== index) });
  };


  // --- SUBMIT FINAL ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        let finalImageUrl = formData.image; 

        // Si el usuario eligió un archivo, lo subimos ahora
        if (selectedFile) {
            finalImageUrl = await uploadToCloudinary(selectedFile);
        }

        const payload = {
            ...formData,
            image: finalImageUrl,
            tags: tags,
            totalTime: parseInt(formData.totalTime)
        };

        await api.post('/recipes', payload); 
        setShowSuccess(true);
        setTimeout(() => navigate('/'), 2000);

    } catch (error) {
        console.error(error);
        alert('Error al crear la receta');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-10 relative">
      <div className="flex justify-center p-6">
        <div className="max-w-4xl w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
             <ChefHat className="text-orange-500" /> Crear Nueva Receta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
             
             {/* Sección Superior: Título y Foto */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Título</label>
                    <input 
                        name="title" 
                        value={formData.title} 
                        onChange={handleChange} 
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 outline-none focus:border-orange-500" 
                        placeholder="Ej: Pasta Carbonara"
                        required 
                    />
                </div>

                {/* COMPONENTE UNIVERSAL */}
                <UniversalImageInput 
                    value={formData.image} 
                    onChange={handleChange} 
                    onFileSelect={setSelectedFile} 
                />
             </div>

             {/* Descripción */}
             <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Descripción</label>
                <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    rows="3" 
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 outline-none focus:border-orange-500" 
                    placeholder="Describe tu deliciosa creación..."
                    required 
                />
             </div>

             {/* Detalles Técnicos */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Tiempo Total (mins)</label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                        <input 
                            name="totalTime" 
                            type="number" 
                            value={formData.totalTime} 
                            onChange={handleChange} 
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 pl-10 outline-none focus:border-orange-500" 
                            required 
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Dificultad</label>
                    <select name="dificultyLevel" value={formData.dificultyLevel} onChange={handleChange} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 outline-none">
                        <option value="easy">Fácil</option>
                        <option value="medium">Media</option>
                        <option value="hard">Difícil</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Visibilidad</label>
                    <select name="visibility" value={formData.visibility} onChange={handleChange} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 outline-none">
                        <option value="public">Pública</option>
                        <option value="private">Privada</option>
                    </select>
                </div>
             </div>

             {/* TAGS */}
             <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-700/50">
                <label className="block text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-orange-500" /> Etiquetas / Categorías
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                    {PREDEFINED_TAGS.map(tag => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => togglePredefinedTag(tag)}
                            className={`px-3 py-1 rounded-full text-sm transition border ${tags.includes(tag) ? 'bg-orange-600 border-orange-600 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'}`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2 mb-4">
                    <input 
                        type="text"
                        value={customTagInput}
                        onChange={e => setCustomTagInput(e.target.value)}
                        placeholder="Agregar otra etiqueta..."
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm focus:border-orange-500 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag(e)}
                    />
                    <button type="button" onClick={handleAddCustomTag} className="bg-zinc-700 hover:bg-zinc-600 px-4 rounded-lg text-white font-medium transition"><Plus className="w-4 h-4" /></button>
                </div>
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-zinc-900/50 rounded-lg border border-dashed border-zinc-700">
                        {tags.map(tag => (
                            <span key={tag} className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded text-sm flex items-center gap-1">
                                {tag}
                                <button type="button" onClick={() => removeTag(tag)} className="hover:text-white ml-1"><X className="w-3 h-3" /></button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* INGREDIENTES */}
            <div className="border-t border-zinc-800 pt-6">
              <h3 className="text-xl font-semibold mb-4 text-orange-500">Ingredientes</h3>
              {formData.ingredients.map((ing, index) => (
                <div key={index} className="flex gap-4 mb-3 items-end">
                  <div className="flex-1">
                    <input value={ing.name} onChange={(e) => handleIngredientChange(index, 'name', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 outline-none focus:border-orange-500" placeholder="Nombre" required />
                  </div>
                  <div className="w-24">
                    <input type="number" value={ing.quantity} onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 outline-none focus:border-orange-500" placeholder="Cant." required />
                  </div>
                  <button type="button" onClick={() => removeIngredient(index)} className="p-3 bg-red-900/30 text-red-500 rounded-lg hover:bg-red-900/50"><Trash2 className="w-5 h-5" /></button>
                </div>
              ))}
              <button type="button" onClick={addIngredient} className="mt-2 flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300"><Plus className="w-4 h-4" /> Agregar Ingrediente</button>
            </div>

            {/* PASOS */}
            <div className="border-t border-zinc-800 pt-6">
              <h3 className="text-xl font-semibold mb-4 text-orange-500">Pasos</h3>
              {formData.step.map((step, index) => (
                <div key={index} className="bg-zinc-800/50 p-4 rounded-xl mb-4 border border-zinc-800">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-zinc-400 font-medium">Paso {index + 1}</span>
                    <button type="button" onClick={() => removeStep(index)} className="text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="md:col-span-2">
                      <input value={step.title} onChange={(e) => handleStepChange(index, 'title', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 outline-none focus:border-orange-500" placeholder="Título" required />
                    </div>
                    <div>
                      <input type="number" value={step.time} onChange={(e) => handleStepChange(index, 'time', e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 outline-none focus:border-orange-500" placeholder="Min" required />
                    </div>
                  </div>
                  <textarea value={step.descripcion} onChange={(e) => handleStepChange(index, 'descripcion', e.target.value)} rows="2" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 outline-none focus:border-orange-500" placeholder="Descripción..." required />
                </div>
              ))}
                <button type="button" onClick={addStep} className="mt-2 flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300"><Plus className="w-4 h-4" /> Agregar Paso</button>
            </div>
             
             <div className="pt-6">
               <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-orange-900/20 disabled:opacity-50">
                 {loading ? <Loader className="animate-spin" /> : <>Publicar Receta <Save className="w-5 h-5" /></>}
               </button>
             </div>
          </form>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in zoom-in-95">
            <div className="bg-zinc-900 border border-orange-500/30 p-8 rounded-2xl text-center">
                <div className="mx-auto bg-green-500/10 w-20 h-20 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-white">¡Receta Publicada!</h2>
            </div>
        </div>
      )}
    </div>
  );
};
export default CreateRecipe;