import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, User, Clock, AlertCircle } from 'lucide-react';
import api from '../api/axios';

const RecipeComments = ({ recipeId }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);
    
    // 1. Obtener datos del usuario logueado (puedes sacarlos de tu context o localStorage)
    const currentUser = JSON.parse(localStorage.getItem('user')); // Asumiendo que guardas el objeto user
    const userId = currentUser?.id;
    const userRole = currentUser?.role;

    useEffect(() => {
        fetchComments();
    }, [recipeId]);

    const fetchComments = async () => {
        try {
            const res = await api.get(`/recipes/comments/${recipeId}`);
            setComments(res.data);
        } catch (err) {
            console.error("Error cargando comentarios:", err);
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setLoading(true);
        try {
            const res = await api.post(`/comments`, { 
                recipeId, 
                text: newComment 
            });
            setComments([res.data, ...comments]); // Agregamos el nuevo al inicio
            setNewComment("");
        } catch (err) {
            alert(err.response?.data?.Error || "Error al comentar");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (commentId) => {
        if (!window.confirm("¿Seguro que quieres borrar este comentario?")) return;

        try {
            await api.delete(`/comments/${commentId}`);
            setComments(comments.filter(c => c.id !== commentId)); // Quitamos de la lista
        } catch (err) {
            alert("No tienes permiso para borrar este comentario");
        }
    };

    return (
        <div className="mt-12 border-t border-zinc-800 pt-8 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <MessageSquare className="text-orange-500" /> Comentarios ({comments.length})
            </h3>

            {/* FORMULARIO PARA NUEVO COMENTARIO */}
            {userId ? (
                <form onSubmit={handlePostComment} className="mb-8">
                    <div className="relative group">
                        <textarea 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Añade un comentario..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 pr-12 text-zinc-300 outline-none focus:border-orange-500 transition-all resize-none"
                            rows="2"
                        />
                        <button 
                            type="submit"
                            disabled={loading || !newComment.trim()}
                            className="absolute right-3 bottom-3 p-2 bg-orange-600 rounded-lg text-white hover:bg-orange-500 disabled:opacity-50 transition-colors"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-8 flex items-center gap-3 text-orange-400">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm">Debes iniciar sesión para dejar un comentario.</span>
                </div>
            )}

            {/* LISTA DE COMENTARIOS */}
            <div className="space-y-6">
                {comments.length === 0 ? (
                    <p className="text-zinc-500 text-center py-4 italic">Sé el primero en comentar esta receta...</p>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="flex gap-4 group">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-700">
                                <User className="w-5 h-5 text-zinc-500" />
                            </div>
                            
                            <div className="flex-1 bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl relative">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-orange-400 text-sm">{comment.userName}</span>
                                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {new Date(comment.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-zinc-300 text-sm leading-relaxed">{comment.text}</p>

                                {/* --- LÓGICA DE BORRADO: BOTÓN CONDICIONAL --- */}
                                {(userId === comment.userId || userRole === 'admin') && (
                                    <button 
                                        onClick={() => handleDelete(comment.id)}
                                        className="absolute -right-2 -top-2 p-2 bg-zinc-800 text-zinc-500 hover:text-red-500 rounded-full border border-zinc-700 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                        title="Eliminar comentario"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RecipeComments;