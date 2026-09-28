import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Clock, ChefHat, Star, Flame, Trophy, ChevronDown, Heart, Trash2, Edit } from 'lucide-react';
import FilterBar from './FilterBar';

// --- COMPONENTE TARJETA INDIVIDUAL (OPTIMIZADO CON TRANSPARENCIA) ---
const RecipeCard = ({ recipe, isInitiallySaved, isTop = false, index, onDeleteSuccess }) => {
  const navigate = useNavigate();
  const rating = recipe.averageRating || recipe.AverageRating || 0;

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'admin';

  const [isSaved, setIsSaved] = useState(isInitiallySaved);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    setIsSaved(isInitiallySaved);
  }, [isInitiallySaved]);

  const handleToggleSave = async (e) => {
    e.stopPropagation();
    if (!token) return navigate('/login');
    if (loadingAction) return;
    setLoadingAction(true);
    try {
        if (isSaved) {
            await api.delete(`/saved-recipes/${recipe.id}`);
            setIsSaved(false);
        } else {
            await api.post('/saved-recipes', { recipeId: recipe.id });
            setIsSaved(true);
        }
    } catch (error) { console.error(error); }
    finally { setLoadingAction(false); }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`¿Seguro que quieres eliminar "${recipe.title}"?`)) return;
    try {
        await api.delete(`/recipes/${recipe.id}`);
        if (onDeleteSuccess) onDeleteSuccess(recipe.id);
    } catch (error) { alert("Error al eliminar"); }
  };

  return (
    <div 
        onClick={() => navigate(`/recipes/${recipe.id}`)}
        /* ✅ Tarjeta con transparencia y desenfoque para ver las chispas detrás */
        className={`bg-zinc-900/80 backdrop-blur-sm border ${isTop ? 'border-yellow-500/30' : 'border-zinc-800'} rounded-2xl overflow-hidden transition-all duration-500 cursor-pointer group flex flex-col relative h-full hover:border-orange-500/50 hover:shadow-[0_0_25px_rgba(249,115,22,0.15)] hover:-translate-y-1`}
    >
        {isTop && (
            <div className="absolute top-0 left-0 bg-yellow-500 text-black font-black px-3 py-1.5 rounded-br-xl z-20 flex items-center gap-1 shadow-xl">
                <Trophy className="w-4 h-4 fill-black" />
                <span className="text-sm">{index + 1}</span>
            </div>
        )}

        <div className="h-48 sm:h-52 md:h-56 bg-zinc-800 relative overflow-hidden flex items-center justify-center shrink-0">
            {recipe.image ? (
                <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
            ) : (
                <Flame className="w-12 h-12 text-zinc-700" />
            )}
            
            <div className="absolute top-3 right-3 z-30 flex gap-2">
                {isAdmin ? (
                    <>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/edit-recipe/${recipe.id}`); }} className="p-2 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-500 transition-all active:scale-95"><Edit className="w-4 h-4" /></button>
                        <button onClick={handleDelete} className="p-2 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-500 transition-all active:scale-95"><Trash2 className="w-4 h-4" /></button>
                    </>
                ) : (
                    token && (
                        <button onClick={handleToggleSave} disabled={loadingAction} className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-all active:scale-95">
                            <Heart className={`w-5 h-5 transition-colors ${isSaved ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                        </button>
                    )
                )}
            </div>
            
            <div className="absolute bottom-3 left-3 z-10 flex gap-2">
                <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-white/5">
                    <Clock className="w-3 h-3 text-orange-400" /> {recipe.totalTime} min
                </span>
                <span className="bg-black/60 backdrop-blur-md text-yellow-400 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-white/5">
                    <Star className="w-3 h-3 fill-current" /> {rating > 0 ? Number(rating).toFixed(1) : 'Nuevo'}
                </span>
            </div>
        </div>

        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
            <div>
                <h3 className="text-white font-bold text-lg mb-2 truncate group-hover:text-orange-400 transition-colors duration-300">{recipe.title}</h3>
                
                <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed mb-4 group-hover:text-zinc-400 transition-colors duration-300">
                    {recipe.description || 'Sin descripción disponible.'}
                </p>

                <div className="flex items-center gap-2">
                    <span className={`capitalize px-2 py-0.5 rounded-md text-[10px] font-black tracking-tighter border ${
                        recipe.dificultyLevel === 'easy' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                        recipe.dificultyLevel === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                        'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                        {recipe.dificultyLevel === 'easy' ? 'Fácil' : recipe.dificultyLevel === 'medium' ? 'Media' : 'Difícil'}
                    </span>
                </div>
            </div>
        </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL HOME ---
const Home = () => {
  const [recipes, setRecipes] = useState([]);
  const [topRecipes, setTopRecipes] = useState([]);
  const [savedRecipeIds, setSavedRecipeIds] = useState(new Set());
  const [filters, setFilters] = useState({ tags: '', difficulty: '', time: 480 });
  const [visibleCount, setVisibleCount] = useState(9);

  // ✅ LÓGICA DE GENERACIÓN DE CHISPAS (BRASAS)
  useEffect(() => {
    const createEmber = () => {
      const ember = document.createElement('div');
      ember.className = 'ember';
      
      const size = Math.random() * 3 + 2; // Tamaño aleatorio
      ember.style.width = `${size}px`;
      ember.style.height = `${size}px`;
      ember.style.left = `${Math.random() * 100}vw`; // Posición horizontal aleatoria
      
      const duration = Math.random() * 5 + 5; // Velocidad aleatoria
      ember.style.animation = `float-up ${duration}s linear forwards`;
      
      document.body.appendChild(ember);
      // Eliminar del DOM tras la animación
      setTimeout(() => ember.remove(), duration * 1000);
    };

    const interval = setInterval(createEmber, 700); // Una chispa cada 700ms
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [res, topRes] = await Promise.all([
        api.get('/recipes'),
        api.get('/recipes/top')
      ]);
      setRecipes(res.data);
      setTopRecipes(topRes.data || []);

      const token = localStorage.getItem('token');
      if (token) {
          const savedRes = await api.get('/saved-recipes');
          const ids = new Set(savedRes.data.map(r => r.id));
          setSavedRecipeIds(ids);
      }
    } catch (err) { console.error("Error fetching data:", err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDeleteFromUI = (id) => {
    setRecipes(prev => prev.filter(r => r.id !== id));
    setTopRecipes(prev => prev.filter(r => r.id !== id));
  };

  const filteredRecipes = recipes.filter((recipe) => {
    if (recipe.visibility !== 'public') return false; 
    if (recipe.totalTime > filters.time) return false;
    if (filters.difficulty && recipe.dificultyLevel !== filters.difficulty) return false;
    if (filters.tags && (!recipe.tags || !recipe.tags.includes(filters.tags))) return false;
    return true;
  });

  return (
    <div className="min-h-screen text-white pb-10 animate-gradient-bg relative overflow-x-hidden">
      
      {/* ✅ EFECTO LLAMA DE FONDO (SUBTLE GLOW) */}
      <div className="flame-glow"></div>

      <section className="relative h-[40vh] sm:h-[45vh] md:h-[50vh] overflow-hidden mb-8 md:mb-12 bg-zinc-900 border-b border-zinc-800">
        <div className="absolute inset-0">
            <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1920&auto=format&fit=crop" alt="Fondo" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
        </div>
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-6">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-4 tracking-tighter italic">
                BURNED <Flame className="inline text-orange-500 w-8 h-8 sm:w-10 sm:h-10 md:w-16 md:h-16 mb-2 animate-pulse" />
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-zinc-400 font-medium max-w-md">La comunidad de cocina donde el fuego nunca se apaga.</p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {topRecipes.length > 0 && (
            <section className="mb-12 md:mb-16">
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                    <div className="bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                        <Trophy className="text-yellow-500 w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase italic">Favoritas</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                    {topRecipes.slice(0, 3).map((recipe, index) => (
                        <RecipeCard 
                            key={recipe.id} 
                            recipe={recipe} 
                            isTop={true} 
                            index={index}
                            onDeleteSuccess={handleDeleteFromUI}
                            isInitiallySaved={savedRecipeIds.has(recipe.id)} 
                        />
                    ))}
                </div>
            </section>
        )}

        <div className="mb-8 md:mb-12">
             <FilterBar filters={filters} onFilterChange={setFilters} onClear={() => setFilters({ tags: '', difficulty: '', time: 180 })} />
        </div>

        <section>
            <div className="flex items-center justify-between mb-6 md:mb-8">
                <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 uppercase italic text-orange-500">
                    <ChefHat className="w-5 h-5 md:w-6 md:h-6" /> Descubre más
                </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredRecipes.slice(0, visibleCount).map((recipe) => (
                    <RecipeCard 
                        key={recipe.id} 
                        recipe={recipe} 
                        onDeleteSuccess={handleDeleteFromUI}
                        isInitiallySaved={savedRecipeIds.has(recipe.id)} 
                    />
                ))}
            </div>
            
            {visibleCount < filteredRecipes.length && (
                <div className="flex justify-center mt-12 md:mt-16 pb-12">
                    <button onClick={() => setVisibleCount(prev => prev + 9)} className="bg-zinc-900/80 hover:bg-zinc-800 text-white font-black py-4 px-10 rounded-2xl border border-zinc-800 transition-all hover:border-orange-500/50 shadow-xl flex items-center gap-3 uppercase text-xs tracking-widest w-full sm:w-auto justify-center backdrop-blur-md">
                        <ChevronDown className="w-4 h-4" /> Cargar más recetas
                    </button>
                </div>
            )}
        </section>
      </main>
    </div>
  );
};

export default Home;