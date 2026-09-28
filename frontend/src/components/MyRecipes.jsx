import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Clock, ChefHat, Trash2, Edit, Bookmark, Heart, AlertTriangle, X, CheckCircle, AlertCircle, Flame } from 'lucide-react';

const MyRecipes = () => {
  const [activeTab, setActiveTab] = useState('created'); // 'created' | 'saved'
  const [createdRecipes, setCreatedRecipes] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- ESTADOS PARA MODALES ---
  const [notification, setNotification] = useState({ show: false, type: 'success', message: '' });
  
  const [confirmModal, setConfirmModal] = useState({ 
    show: false, 
    id: null, 
    action: '' // 'delete_created' o 'unsave'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [createdRes, savedRes] = await Promise.all([
          api.get('/user/recipes'),
          api.get('/saved-recipes')
        ]);
        setCreatedRecipes(createdRes.data || []);
        setSavedRecipes(savedRes.data || []);
      } catch (err) {
        console.error("Error cargando recetas:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const requestDelete = (e, id, actionType) => {
    e.stopPropagation();
    setConfirmModal({ show: true, id: id, action: actionType });
  };

  const executeDelete = async () => {
    const { id, action } = confirmModal;
    setConfirmModal({ show: false, id: null, action: '' });

    try {
        if (action === 'delete_created') {
            await api.delete(`/recipes/${id}`);
            setCreatedRecipes(createdRecipes.filter(r => r.id !== id));
            setNotification({ show: true, type: 'success', message: 'Receta eliminada permanentemente.' });
        
        } else if (action === 'unsave') {
            await api.delete(`/saved-recipes/${id}`);
            setSavedRecipes(savedRecipes.filter(r => r.id !== id));
            setNotification({ show: true, type: 'success', message: 'Receta quitada de tus guardados.' });
        }
    } catch (error) {
        console.error(error);
        setNotification({ show: true, type: 'error', message: 'Ocurrió un error al intentar eliminar.' });
    }
  };

  const closeNotification = () => setNotification({ ...notification, show: false });

  const recipesToShow = activeTab === 'created' ? createdRecipes : savedRecipes;

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex justify-center items-center">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-10 relative">
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Encabezado y Pestañas */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <ChefHat className="text-orange-500" /> Mi Colección
            </h1>

            <div className="bg-zinc-900 p-1 rounded-xl flex gap-1 border border-zinc-800 self-start md:self-auto">
                <button 
                    onClick={() => setActiveTab('created')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        activeTab === 'created' 
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                >
                    <ChefHat className="w-4 h-4" /> Mis Creaciones
                    <span className="bg-black/20 px-2 py-0.5 rounded-full text-xs ml-1">{createdRecipes.length}</span>
                </button>
                
                <button 
                    onClick={() => setActiveTab('saved')}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        activeTab === 'saved' 
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                >
                    <Bookmark className="w-4 h-4" /> Guardadas
                    <span className="bg-black/20 px-2 py-0.5 rounded-full text-xs ml-1">{savedRecipes.length}</span>
                </button>
            </div>
        </div>

        {/* Estado Vacío */}
        {recipesToShow.length === 0 && (
            <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
                <div className="flex justify-center mb-4">
                    {activeTab === 'created' ? <ChefHat className="w-12 h-12 opacity-20" /> : <Heart className="w-12 h-12 opacity-20" />}
                </div>
                <p className="mb-2">
                    {activeTab === 'created' 
                        ? "Aún no has cocinado nada." 
                        : "No tienes recetas guardadas."}
                </p>
                {activeTab === 'created' ? (
                    <button onClick={() => navigate('/create-recipe')} className="text-orange-500 hover:text-orange-400 font-bold underline">
                        ¡Crea tu primera receta!
                    </button>
                ) : (
                    <button onClick={() => navigate('/')} className="text-orange-500 hover:text-orange-400 font-bold underline">
                        Explorar el feed
                    </button>
                )}
            </div>
        )}

        {/* Grid de Recetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500" key={activeTab}>
          {recipesToShow.map((recipe) => (
            <div 
                key={recipe.id} 
                onClick={() => navigate(`/recipes/${recipe.id}`)} 
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition cursor-pointer group relative shadow-lg flex flex-col"
            >
              
              <div className="h-48 bg-zinc-800 relative flex items-center justify-center overflow-hidden">
                 {/* IMAGEN CONDICIONAL */}
                 {recipe.image ? (
                     <img 
                        src={recipe.image} 
                        alt={recipe.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                     />
                 ) : (
                     <Flame className="w-16 h-16 text-zinc-700/50" />
                 )}
                 
                 {/* BOTONES DE ACCIÓN */}
                 <div className="absolute top-2 right-2 flex gap-2 z-10">
                    
                    {activeTab === 'created' && (
                        <>
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    navigate(`/edit-recipe/${recipe.id}`); 
                                }}
                                className="bg-black/60 backdrop-blur-md p-2 rounded-full text-white hover:bg-blue-600 transition"
                                title="Editar"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={(e) => requestDelete(e, recipe.id, 'delete_created')}
                                className="bg-black/60 backdrop-blur-md p-2 rounded-full text-white hover:bg-red-600 transition"
                                title="Eliminar"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </>
                    )}

                    {activeTab === 'saved' && (
                        <button 
                            onClick={(e) => requestDelete(e, recipe.id, 'unsave')}
                            className="bg-orange-600 p-2 rounded-full text-white hover:bg-red-600 transition shadow-lg"
                            title="Quitar de guardados"
                        >
                            <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                    )}
                 </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                    <h3 className="text-xl font-bold text-white mb-2 truncate">{recipe.title}</h3>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        <Clock className="w-4 h-4" /> {recipe.totalTime} min
                        <span className="mx-1">•</span>
                        <span className={`capitalize ${recipe.dificultyLevel === 'easy' ? 'text-green-400' : recipe.dificultyLevel === 'medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                            {recipe.dificultyLevel === 'easy' ? 'Fácil' : recipe.dificultyLevel === 'medium' ? 'Media' : 'Difícil'}
                        </span>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* --- MODALES --- */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full relative transform animate-in zoom-in-95 mx-4">
                
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mb-4 text-orange-500 border border-orange-500/20">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">
                        {confirmModal.action === 'unsave' ? '¿Quitar de guardados?' : '¿Eliminar receta?'}
                    </h3>
                    
                    <p className="text-zinc-400 text-sm mb-6">
                        {confirmModal.action === 'unsave' 
                            ? 'Esta receta desaparecerá de tu colección personal.' 
                            : 'Esta acción es irreversible y la receta se borrará para siempre.'}
                    </p>

                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2.5 rounded-lg transition"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={executeDelete}
                            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-medium py-2.5 rounded-lg transition shadow-lg shadow-red-900/20"
                        >
                            {confirmModal.action === 'unsave' ? 'Sí, quitar' : 'Sí, eliminar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {notification.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] animate-in fade-in duration-300">
            <div className={`bg-zinc-900 border p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 mx-4 ${
                notification.type === 'success' ? 'border-green-500/30' : 'border-red-500/30'
            }`}>
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 border ${
                    notification.type === 'success' ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
                }`}>
                    {notification.type === 'success' ? <CheckCircle className="w-8 h-8 text-green-500" /> : <AlertCircle className="w-8 h-8 text-red-500" />}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{notification.type === 'success' ? '¡Hecho!' : 'Error'}</h2>
                <p className="text-zinc-400 mb-6 text-sm">{notification.message}</p>
                <button onClick={closeNotification} className={`w-full font-bold py-3 rounded-xl text-white ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>Aceptar</button>
            </div>
        </div>
      )}

    </div>
  );
};

export default MyRecipes;