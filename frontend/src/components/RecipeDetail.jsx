import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Clock, ChefHat, Star, ArrowLeft, LogIn, X, CheckCircle, AlertCircle, Heart, Flame, MessageSquare, Send, User, Bookmark, Trash2, Loader } from 'lucide-react';

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  // Comentarios
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Estados de Modales y Notificaciones
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: 'success', message: '' });
  
  // Estado para el modal de borrar comentario
  const [deleteModal, setDeleteModal] = useState({ show: false, commentId: null });

  // --- LÓGICA DE USUARIO Y ADMIN ---
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const isAdmin = currentUser?.role === 'admin';
  const isRecipeOwner = currentUser?.id === recipe?.userId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const recipeRes = await api.get(`/recipes/${id}`);
        setRecipe(recipeRes.data);
        
        try {
            const rateRes = await api.post(`/get-rate/${id}`);
            const val = rateRes.data?.Avg || rateRes.data?.avg || 0;
            setAverageRating(val);
        } catch (e) { console.error("Rating error"); }

        try {
            const countRes = await api.get(`/recipes/count/${id}`);
            setSavedCount(countRes.data.count ?? countRes.data ?? 0);
        } catch (e) { console.error("Count error"); }

        try {
            const commentsRes = await api.get(`/recipes/comments/${id}`);
            setComments(commentsRes.data || []);
        } catch (e) { setComments([]); }

        const token = localStorage.getItem('token');
        if (token) {
            const savedRes = await api.get('/saved-recipes');
            const savedList = Array.isArray(savedRes.data) ? savedRes.data : [];
            setIsSaved(savedList.some(r => String(r.id) === String(id)));
        }
      } catch (err) {
        console.error("Error general:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // --- HANDLERS ---

  const handleDeleteRecipe = async () => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta receta definitivamente?")) return;
    try {
        await api.delete(`/recipes/${id}`);
        setNotification({ show: true, type: 'success', message: 'Receta eliminada correctamente.' });
        setTimeout(() => navigate('/'), 2000);
    } catch (error) {
        setNotification({ show: true, type: 'error', message: 'No se pudo eliminar la receta.' });
    }
  };

  const handleToggleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
        if (isSaved) {
            await api.delete(`/saved-recipes/${id}`);
            setIsSaved(false);
            setSavedCount(prev => Math.max(0, prev - 1));
            setNotification({ show: true, type: 'success', message: 'Eliminada de guardados.' });
        } else {
            await api.post('/saved-recipes', { recipeId: id });
            setIsSaved(true);
            setSavedCount(prev => prev + 1);
            setNotification({ show: true, type: 'success', message: '¡Guardada en tu colección!' });
        }
    } catch (error) {
        if (error.response?.status === 401) setShowLoginModal(true);
        else setNotification({ show: true, type: 'error', message: 'Error al actualizar.' });
    } finally { setSaving(false); }
  };

  const handleRate = async (ratingValue) => {
    setIsSubmitting(true);
    try {
        await api.post(`/rate-recipe/${id}`, { stars: ratingValue });
        setAverageRating(ratingValue); 
        setNotification({ show: true, type: 'success', message: `¡Votaste ${ratingValue} estrellas!` });
    } catch (error) {
        if (error.response?.status === 401) setShowLoginModal(true);
        else setNotification({ show: true, type: 'error', message: "Error al votar." });
    } finally { setIsSubmitting(false); }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
        const res = await api.post('/comments', { recipeId: id, text: newComment });
        setComments([res.data, ...comments]);
        setNewComment('');
        setNotification({ show: true, type: 'success', message: 'Comentario publicado' });
    } catch (error) {
        if (error.response?.status === 401) setShowLoginModal(true);
        else setNotification({ show: true, type: 'error', message: error.response?.data?.error || "Error al comentar." });
    } finally { setSubmittingComment(false); }
  };

  const openDeleteModal = (commentId) => {
    setDeleteModal({ show: true, commentId });
  };

  const confirmDeleteComment = async () => {
    const { commentId } = deleteModal;
    try {
        await api.delete(`/comments/${commentId}`);
        setComments(comments.filter(c => c.id !== commentId));
        setNotification({ show: true, type: 'success', message: 'Comentario eliminado.' });
    } catch (error) {
        setNotification({ show: true, type: 'error', message: 'No tienes permiso para borrar este comentario.' });
    } finally {
        setDeleteModal({ show: false, commentId: null });
    }
  };

  const closeNotification = () => setNotification({ ...notification, show: false });

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );

  if (!recipe) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-10 relative">
      <div className="max-w-4xl mx-auto px-4 pt-6 flex justify-between items-center mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" /> Volver
        </button>

        {/* --- BOTONES DE ACCIÓN PARA DUEÑO O ADMIN --- */}
        {(isRecipeOwner || isAdmin) && (
            <div className="flex gap-3">
                <button 
                    onClick={() => navigate(`/edit-recipe/${id}`)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition border border-zinc-700"
                >
                    Editar Receta
                </button>
                <button 
                    onClick={handleDeleteRecipe}
                    className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition border border-red-500/20"
                >
                    Eliminar Receta
                </button>
            </div>
        )}
      </div>

      <main className="max-w-4xl mx-auto px-4">
        {/* IMAGEN */}
        <div className="w-full h-64 md:h-96 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden mb-8 relative shadow-2xl flex items-center justify-center">
            {recipe.image ? (
                <>
                    <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent"></div>
                </>
            ) : (
                <Flame className="w-24 h-24 text-zinc-700/50" />
            )}

            {/* ✅ CORAZÓN: Solo aparece si NO es Admin */}
            {!isAdmin && (
                <button onClick={handleToggleSave} disabled={saving} className="absolute top-4 left-4 p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 transition-all active:scale-95">
                    <Heart className={`w-7 h-7 transition-all ${isSaved ? 'fill-red-500 text-red-500 scale-110' : 'text-white'}`} />
                </button>
            )}
        </div>

        {/* INFO PRINCIPAL */}
        <div className="mb-10">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{recipe.title}</h1>
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg self-start shadow-xl">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <span className="text-xl font-bold">{averageRating > 0 ? Number(averageRating).toFixed(1) : '0.0'}</span>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 mb-6 text-zinc-400 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold"><User className="w-3 h-3" /></div>
                    <span>Publicado por <span className="text-white font-semibold">{recipe.userName || "Chef"}</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-orange-500" />
                    <span>Guardada <span className="text-white font-bold">{savedCount}</span> veces</span>
                </div>
            </div>

            <p className="text-zinc-400 text-lg leading-relaxed mb-6 border-l-4 border-orange-500/50 pl-4">{recipe.description}</p>
            
            <div className="flex flex-wrap items-center gap-4">
                <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg flex items-center gap-2 text-orange-400 shadow-md">
                    <Clock className="w-5 h-5" /> <span className="font-semibold">{recipe.totalTime} min</span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg flex items-center gap-2 text-blue-400 shadow-md">
                    <ChefHat className="w-5 h-5" /> <span className="capitalize font-semibold">{recipe.dificultyLevel}</span>
                </div>
                <div className="flex gap-1 ml-4 bg-zinc-900/50 p-2 rounded-full border border-zinc-800">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => handleRate(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} className="transition-transform hover:scale-125 px-0.5">
                            <Star className={`w-6 h-6 ${star <= (hoverRating || averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-700'}`} />
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* INGREDIENTES Y PASOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="md:col-span-1">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 sticky top-24 backdrop-blur-sm">
                    <h3 className="text-xl font-bold text-orange-500 mb-6 flex items-center gap-2">Ingredientes</h3>
                    <ul className="space-y-4">
                        {recipe.ingredients?.map((ing, idx) => (
                            <li key={idx} className="flex justify-between border-b border-zinc-800/50 pb-2 text-sm">
                                <span className="text-zinc-300">{ing.name}</span>
                                <span className="text-zinc-500 font-mono">{ing.quantity}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="md:col-span-2 space-y-6">
                <h3 className="text-2xl font-bold mb-4">Instrucciones</h3>
                {recipe.step?.map((step, idx) => (
                    <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg hover:border-zinc-700 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <span className="bg-orange-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">{idx + 1}</span>
                                <h4 className="text-lg font-bold text-white">{step.title}</h4>
                            </div>
                            <span className="text-zinc-500 text-xs font-mono flex items-center gap-1"><Clock className="w-3 h-3"/> {step.time} min</span>
                        </div>
                        <p className="text-zinc-400 leading-relaxed ml-11 text-sm md:text-base">{step.descripcion}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* COMENTARIOS */}
        <section className="border-t border-zinc-800 pt-10">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <MessageSquare className="text-orange-500" /> Comentarios <span className="text-zinc-500 text-lg font-normal">({comments.length})</span>
            </h3>

            <form onSubmit={handlePostComment} className="mb-10 bg-zinc-900/30 p-6 rounded-2xl border border-zinc-800/50 flex gap-4 items-start shadow-inner">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700"><User className="text-zinc-500 w-5 h-5" /></div>
                <div className="flex-1">
                    <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="¿Qué te pareció esta receta? Deja tu opinión..." className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-orange-500 min-h-[100px] mb-3 transition-all" />
                    <div className="flex justify-end">
                        <button type="submit" disabled={submittingComment || !newComment.trim()} className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-orange-950/20">
                            {submittingComment ? <Loader className="animate-spin w-4 h-4" /> : 'Publicar'} <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </form>

            <div className="space-y-6">
                {comments.length === 0 ? <p className="text-zinc-500 text-center py-10 italic">Aún no hay opiniones. ¡Sé el primero!</p> : (
                    comments.map((comment) => {
                        const isCommentOwner = currentUser?.id === comment.userId;

                        return (
                            <div key={comment.id} className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-orange-500 shrink-0 shadow-lg">
                                    {comment.userName?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 relative hover:bg-zinc-900/60 transition-colors">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-bold text-zinc-200 text-sm md:text-base">{comment.userName}</h4>
                                            {/* ✅ BORRAR COMENTARIO: Dueño, Admin o Dueño de la receta */}
                                            {(isCommentOwner || isAdmin || isRecipeOwner) && (
                                                <button onClick={() => openDeleteModal(comment.id)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 bg-zinc-800 rounded-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-zinc-400 text-sm md:text-base leading-relaxed">{comment.text}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
      </main>

      {/* --- SECCIÓN DE MODALES --- */}

      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-200">
            <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center scale-up-center border-t-red-500/20">
                <div className="mx-auto bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                    <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">¿Borrar comentario?</h2>
                <p className="text-zinc-500 mb-8 text-sm leading-relaxed">Esta acción no se puede deshacer. El comentario desaparecerá para siempre.</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteModal({ show: false, commentId: null })} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-2xl transition-all">Cancelar</button>
                    <button onClick={confirmDeleteComment} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-2xl transition-all shadow-lg shadow-red-900/20">Borrar</button>
                </div>
            </div>
        </div>
      )}

      {notification.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] animate-in fade-in">
            <div className={`bg-zinc-950 border p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center ${notification.type === 'success' ? 'border-green-500/30' : 'border-red-500/30'}`}>
                <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${notification.type === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {notification.type === 'success' ? <CheckCircle className="w-8 h-8 text-green-500" /> : <AlertCircle className="w-8 h-8 text-red-500" />}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{notification.type === 'success' ? '¡Hecho!' : 'Error'}</h2>
                <p className="text-zinc-400 mb-6 text-sm">{notification.message}</p>
                <button onClick={closeNotification} className={`w-full font-black py-4 rounded-2xl text-white tracking-widest uppercase text-xs ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>Aceptar</button>
            </div>
        </div>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[90]">
            <div className="bg-zinc-950 border border-orange-500/30 p-10 rounded-3xl max-w-sm w-full text-center relative shadow-2xl">
                <button onClick={() => setShowLoginModal(false)} className="absolute top-6 right-6 text-zinc-600 hover:text-white"><X className="w-6 h-6" /></button>
                <div className="mx-auto bg-orange-500/10 w-20 h-20 rounded-full flex items-center justify-center mb-8"><LogIn className="w-10 h-10 text-orange-500" /></div>
                <h2 className="text-3xl font-bold text-white mb-3">Únete a Burned</h2>
                <p className="text-zinc-500 mb-8 text-sm">Inicia sesión para interactuar con esta receta, calificarla o guardarla en tu colección.</p>
                <div className="flex flex-col gap-4">
                    <button onClick={() => navigate('/login')} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-950/20">Iniciar Sesión</button>
                    <button onClick={() => navigate('/register')} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-4 rounded-2xl transition-all">Crear una cuenta</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default RecipeDetail;