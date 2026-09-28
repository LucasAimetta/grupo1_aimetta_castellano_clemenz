import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Clock, ChefHat, Search, ArrowLeft, Filter, X, Tag } from 'lucide-react';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // 1. Leemos los parámetros actuales de la URL
  const query = searchParams.get('q') || '';
  const initialTime = searchParams.get('time') || '';
  const initialDiff = searchParams.get('difficulty') || '';
  const initialTags = searchParams.get('tags') || '';
  const initialDesc = searchParams.get('desc') || '';

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. Estado local para los inputs (Sidebar)
  const [filters, setFilters] = useState({
    time: initialTime,
    difficulty: initialDiff,
    tags: initialTags,
    desc: initialDesc
  });

  // --- BUSCAR CUANDO CAMBIA LA URL ---
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (initialTime) params.append('time', initialTime);
        if (initialDiff) params.append('difficulty', initialDiff);
        if (initialTags) params.append('tags', initialTags);
        if (initialDesc) params.append('desc', initialDesc);

        const res = await api.get(`/recipes/search?${params.toString()}`);
        setRecipes(res.data || []);
      } catch (err) {
        console.error("Error buscando:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchParams]);

  // --- HANDLERS ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    const newParams = new URLSearchParams();
    if (query) newParams.set('q', query);
    
    if (filters.time) newParams.set('time', filters.time);
    if (filters.difficulty) newParams.set('difficulty', filters.difficulty);
    if (filters.tags) newParams.set('tags', filters.tags);
    if (filters.desc) newParams.set('desc', filters.desc);

    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setFilters({ time: '', difficulty: '', tags: '', desc: '' });
    setSearchParams({ q: query });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-10">
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate('/')} className="bg-zinc-900 p-2 rounded-full hover:bg-zinc-800 transition">
                <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </button>
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    Resultados para: <span className="text-orange-500">"{query}"</span>
                </h1>
                <p className="text-zinc-400 text-sm">
                    {loading ? 'Buscando...' : `Encontramos ${recipes.length} coincidencias`}
                </p>
            </div>
        </div>

        {/* CONTENEDOR PRINCIPAL: SIDEBAR + GRID */}
        <div className="flex flex-col lg:flex-row gap-8">
            
            {/* --- SIDEBAR DE FILTROS (Izquierda) --- */}
            <aside className="w-full lg:w-1/4 space-y-6">
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl sticky top-24 backdrop-blur-sm">
                    
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold flex items-center gap-2 text-lg">
                            <Filter className="w-5 h-5 text-orange-500" /> Filtros
                        </h3>
                        {(filters.time || filters.difficulty || filters.tags || filters.desc) && (
                            <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-medium transition">
                                <X className="w-3 h-3" /> Limpiar
                            </button>
                        )}
                    </div>

                    {/* Dificultad */}
                    <div className="mb-5">
                        <label className="text-sm font-medium text-zinc-400 mb-2 block">Dificultad</label>
                        <select 
                            name="difficulty" 
                            value={filters.difficulty} 
                            onChange={handleFilterChange}
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-sm focus:border-orange-500 outline-none transition"
                        >
                            <option value="">Todas</option>
                            <option value="easy">Fácil</option>
                            <option value="medium">Media</option>
                            <option value="hard">Difícil</option>
                        </select>
                    </div>

                    {/* Tiempo */}
                    <div className="mb-5">
                        <label className="text-sm font-medium text-zinc-400 mb-2 block flex justify-between items-center">
                            <span>Tiempo Máximo</span>
                            <span className="text-orange-400 font-bold bg-orange-400/10 px-2 py-0.5 rounded text-xs">
                                {filters.time ? filters.time + ' min' : 'Todos'}
                            </span>
                        </label>
                        <input 
                            type="range" 
                            name="time" 
                            min="5" 
                            max="300" 
                            step="5"
                            value={filters.time || 300} 
                            onChange={handleFilterChange}
                            className="w-full accent-orange-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-zinc-600 mt-1">
                            <span>5m</span>
                            <span>4h</span>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="mb-5">
                        <label className="text-sm font-medium text-zinc-400 mb-2 block flex items-center gap-2">
                            <Tag className="w-3 h-3" /> Tags / Etiquetas
                        </label>
                        <input 
                            type="text"
                            name="tags"
                            value={filters.tags}
                            onChange={handleFilterChange}
                            placeholder="Ej: vegano, desayuno..."
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-sm focus:border-orange-500 outline-none placeholder-zinc-700 transition"
                        />
                    </div>

                    {/* Descripción */}
                    <div className="mb-6">
                        <label className="text-sm font-medium text-zinc-400 mb-2 block">Palabra clave</label>
                        <input 
                            type="text"
                            name="desc"
                            value={filters.desc}
                            onChange={handleFilterChange}
                            placeholder="Ej: crujiente..."
                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-sm focus:border-orange-500 outline-none placeholder-zinc-700 transition"
                        />
                    </div>

                    <button 
                        onClick={applyFilters}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-orange-900/20 active:scale-95"
                    >
                        Aplicar Filtros
                    </button>
                </div>
            </aside>

            {/* --- GRID DE RESULTADOS (Derecha) --- */}
            <div className="flex-1">
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
                    </div>
                )}

                {!loading && recipes.length === 0 && (
                    <div className="text-center py-20 text-zinc-500 bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-800">
                        <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No encontramos recetas con estos filtros.</p>
                        <button onClick={clearFilters} className="text-orange-500 hover:underline mt-2">Limpiar filtros</button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {recipes.map((recipe) => (
                    <div 
                    key={recipe.id} 
                    onClick={() => navigate(`/recipes/${recipe.id}`)}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-orange-500/50 transition cursor-pointer group shadow-lg flex flex-col"
                    >
                        <div className="h-48 bg-zinc-800 relative">
                            <img 
                            src={recipe.image || "https://images.unsplash.com/photo-1495521827678-59767350556b?auto=format&fit=crop&q=80&w=800"} 
                            alt={recipe.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            />
                            {/* Badges */}
                            <div className="absolute bottom-2 left-2">
                                <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-orange-400" /> {recipe.totalTime} min
                                </span>
                            </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2 truncate group-hover:text-orange-400 transition">{recipe.title}</h3>
                                <p className="text-zinc-500 text-sm line-clamp-2">{recipe.description}</p>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-400 text-sm pt-4 border-t border-zinc-800/50 mt-4">
                                <span className={`capitalize px-2 py-0.5 rounded text-xs font-bold ${
                                    recipe.dificultyLevel === 'easy' ? 'bg-green-500/10 text-green-400' : 
                                    recipe.dificultyLevel === 'medium' ? 'bg-yellow-500/10 text-yellow-400' : 
                                    'bg-red-500/10 text-red-400'
                                }`}>
                                    {recipe.dificultyLevel === 'easy' ? 'Fácil' : recipe.dificultyLevel === 'medium' ? 'Media' : 'Difícil'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default SearchResults;