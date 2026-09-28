import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, Clock, ChefHat, Tag, CheckCircle, ArrowLeft, Loader, X } from 'lucide-react';
import api from '../api/axios';
import UniversalImageInput from './UniversalImageInput';

const EditRecipe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Cloudinary Config (Ahora Edit también lo necesita)
  const CLOUD_NAME = "dl2inp0cz"; 
  const UPLOAD_PRESET = "burned_uploads"; 

  const [selectedFile, setSelectedFile] = useState(null); // Archivo nuevo (si se cambia)
  
  const [formData, setFormData] = useState({
    title: '', 
    description: '', 
    visibility: 'public', 
    totalTime: 0,
    dificultyLevel: 'medium', 
    image: '', 
    tags: '', // Esto lo manejamos como string en Edit
    ingredients: [], 
    step: []
  });

  // 1. CARGAR DATOS
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const { data } = await api.get(`/recipes/${id}`);
        setFormData({
            title: data.title, 
            description: data.description, 
            visibility: data.visibility || 'public',
            totalTime: data.totalTime, 
            dificultyLevel: data.dificultyLevel,
            image: data.image, // Carga la imagen existente
            tags: data.tags ? data.tags.join(', ') : '',
            ingredients: data.ingredients || [],
            step: data.step || []
        });
      } catch (err) { 
        console.error("Error loading recipe:", err);
        navigate('/my-recipes'); 
      } 
      finally { setLoading(false); }
    };
    fetchRecipe();
  }, [id, navigate]);

  // --- FUNCIÓN DE SUBIDA ---
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

  // --- HANDLERS INGREDIENTES ---
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

  // --- HANDLERS PASOS ---
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


  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
        let finalImageUrl = formData.image;

        // Si seleccionó un archivo NUEVO, lo subimos
        if (selectedFile) {
            finalImageUrl = await uploadToCloudinary(selectedFile);
        }

        const payload = {
            ...formData,
            image: finalImageUrl,
            // Convertir tags de string a array
            tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
            totalTime: parseInt(formData.totalTime),
        };

        await api.put(`/recipes/${id}`, payload); 
        setShowSuccess(true);
        setTimeout(() => navigate('/my-recipes'), 2000);
    } catch (error) {
        console.error(error);
        alert('Error al actualizar');
    } finally {
        setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-10 relative">
        <div className="flex justify-center p-6">
            <div className="max-w-4xl w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
                
                <button onClick={() => navigate('/my-recipes')} className="text-zinc-500 hover:text-white mb-4 flex items-center gap-2 transition">
                    <ArrowLeft className="w-4 h-4" /> Cancelar y Volver
                </button>
                
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                    <ChefHat className="text-orange-500" /> Editar Receta
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Título y Foto */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Título</label>
                            <input name="title" value={formData.title} onChange={handleChange} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 outline-none focus:border-orange-500" required />
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
                        <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 outline-none focus:border-orange-500" required />
                    </div>

                    {/* Detalles Técnicos */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Tiempo (mins)</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                                <input name="totalTime" type="number" value={formData.totalTime} onChange={handleChange} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 pl-10 outline-none focus:border-orange-500" required />
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

                    {/* Tags (Versión simple para Edit) */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Tags (separados por coma)</label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                            <input name="tags" value={formData.tags} onChange={handleChange} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 pl-10 outline-none focus:border-orange-500" />
                        </div>
                    </div>

                    {/* Ingredientes */}
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

                    {/* Pasos */}
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
                                <textarea value={step.descripcion} onChange={(e) => handleStepChange(index, 'descripcion', e.target.value)} rows="2" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 outline-none focus:border-orange-500" placeholder="Descripción" required />
                            </div>
                        ))}
                        <button type="button" onClick={addStep} className="mt-2 flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300"><Plus className="w-4 h-4" /> Agregar Paso</button>
                    </div>

                    <div className="pt-6">
                        <button type="submit" disabled={saving} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 shadow-lg shadow-orange-900/20 disabled:opacity-50">
                            {saving ? 'Guardando...' : 'Guardar Cambios'} <Save className="w-5 h-5" />
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
                    <h2 className="text-2xl font-bold text-white">¡Receta Actualizada!</h2>
                </div>
            </div>
        )}
    </div>
  );
};
export default EditRecipe;