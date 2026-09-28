import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom'; // Asegúrate de tener NavLink aquí
import api from '../api/axios';
import { Flame, PlusSquare, LogOut, Home, User, LogIn, Search, BookOpen, Menu, X } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]); 
  const [showSuggestions, setShowSuggestions] = useState(false); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const wrapperRef = useRef(null); 

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'admin';

  // --- DEFINICIÓN DE ESTILOS PARA LOS LINKS ---
  // Esto hace que el código sea más limpio. 
  // Si está activo: Fondo Blanco + Texto Negro.
  // Si no: Texto Gris + Hover.
  const navLinkClass = ({ isActive }) => 
    isActive 
      ? "bg-white text-black px-4 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2" 
      : "text-zinc-400 hover:bg-zinc-800 hover:text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2";

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setIsMenuOpen(false);
    navigate('/login');
  };

  // --- LÓGICA DE BÚSQUEDA ---
  useEffect(() => {
    if (searchTerm.length < 2) {
        setSuggestions([]);
        return;
    }
    const delayDebounceFn = setTimeout(async () => {
        try {
            const res = await api.get(`/recipes/search?q=${searchTerm}`);
            setSuggestions(res.data || []);
            setShowSuggestions(true);
        } catch (error) {
            console.error("Error fetching suggestions", error);
        }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
        setShowSuggestions(false);
        setIsMenuOpen(false);
        navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="bg-orange-600/10 p-2 rounded-full group-hover:bg-orange-600/20 transition">
              <Flame className="text-orange-500 w-6 h-6" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">Burned</span>
          </Link>

          {/* --- BARRA DE BÚSQUEDA (Visible solo en escritorio) --- */}
          <div ref={wrapperRef} className="hidden md:flex flex-col relative w-full max-w-md mx-8">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
                <Search className="absolute left-3 top-2.5 text-zinc-500 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Buscar recetas..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 pl-10 pr-4 py-2 rounded-full focus:outline-none focus:border-orange-500 transition-all text-sm focus:bg-zinc-900"
                />
            </form>

            {/* SUGERENCIAS */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-12 left-0 right-0 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <ul className="max-h-64 overflow-y-auto">
                        {suggestions.map((recipe) => (
                            <li key={recipe.id}>
                                <button
                                    onClick={() => {
                                        navigate(`/recipes/${recipe.id}`);
                                        setShowSuggestions(false);
                                        setSearchTerm(''); 
                                    }}
                                    className="w-full text-left px-4 py-3 hover:bg-zinc-800 transition flex items-center gap-3 group border-b border-zinc-800/50 last:border-0"
                                >
                                    <div className="w-10 h-10 rounded-md overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center border border-zinc-700/50">
                                        {recipe.image ? <img src={recipe.image} className="w-full h-full object-cover" /> : <Flame className="w-5 h-5 text-orange-500/50" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white text-sm font-medium truncate group-hover:text-orange-400 transition">{recipe.title}</h4>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
          </div>

          {/* BOTONES ESCRITORIO (md:flex) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            
            {/* 1. EXPLORAR (HOME) - Ahora usa NavLink */}
            <NavLink to="/" className={navLinkClass}>
              <Home className="w-5 h-5" />
              <span className="hidden lg:inline">Explorar</span>
            </NavLink>
            
            {token ? (
              <>
                {/* 2. MIS RECETAS - Ahora usa NavLink */}
                {!isAdmin && (
                  <NavLink to="/my-recipes" className={navLinkClass}>
                    <BookOpen className="w-5 h-5" />
                    <span className="hidden lg:inline">Mis Recetas</span>
                  </NavLink>
                )}

                {/* 3. MI PERFIL - Ahora usa NavLink */}
                <NavLink to="/profile" className={navLinkClass}>
                    <User className="w-5 h-5" />
                    <span className="hidden lg:inline">Mi Perfil</span>
                </NavLink>

                {/* BOTÓN CREAR (Este lo dejamos naranja porque es una acción principal) */}
                <Link to="/create-recipe" className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg transition font-medium flex items-center gap-2 shadow-lg shadow-orange-900/20 ml-2">
                  <PlusSquare className="w-5 h-5" />
                  <span className="hidden sm:inline">Crear</span>
                </Link>

                <div className="h-6 w-px bg-zinc-800 mx-2"></div>
                <button onClick={handleLogout} className="text-zinc-400 hover:text-red-500 p-2 transition"><LogOut className="w-5 h-5" /></button>
              </>
            ) : (
              <Link to="/login" className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg transition font-medium flex items-center gap-2 ml-2">
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </Link>
            )}
          </div>

          {/* ✅ BOTÓN MENÚ MÓVIL (md:hidden) */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-zinc-400 hover:text-white transition p-2"
            >
              {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ CONTENIDO MENÚ MÓVIL */}
      {isMenuOpen && (
        <div className="md:hidden bg-zinc-900 border-t border-zinc-800 animate-in slide-in-from-top duration-300">
          <div className="px-4 pt-4 pb-6 space-y-4">
            
            <form onSubmit={handleSearchSubmit} className="relative w-full">
                <Search className="absolute left-3 top-3 text-zinc-500 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Buscar..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 pl-10 py-3 rounded-xl outline-none"
                />
            </form>

            <NavLink 
                to="/" 
                onClick={() => setIsMenuOpen(false)} 
                className={({ isActive }) => isActive ? "flex items-center gap-4 bg-white text-black py-2 px-4 rounded-lg text-lg font-bold" : "flex items-center gap-4 text-zinc-300 hover:text-white py-2 px-4 text-lg font-medium"}
            >
              <Home className="w-6 h-6" /> Explorar
            </NavLink>

            {token ? (
              <>
                {!isAdmin && (
                  <NavLink 
                    to="/my-recipes" 
                    onClick={() => setIsMenuOpen(false)} 
                    className={({ isActive }) => isActive ? "flex items-center gap-4 bg-white text-black py-2 px-4 rounded-lg text-lg font-bold" : "flex items-center gap-4 text-zinc-300 hover:text-white py-2 px-4 text-lg font-medium"}
                  >
                    <BookOpen className="w-6 h-6" /> Mis Recetas
                  </NavLink>
                )}
                <NavLink 
                    to="/profile" 
                    onClick={() => setIsMenuOpen(false)} 
                    className={({ isActive }) => isActive ? "flex items-center gap-4 bg-white text-black py-2 px-4 rounded-lg text-lg font-bold" : "flex items-center gap-4 text-zinc-300 hover:text-white py-2 px-4 text-lg font-medium"}
                >
                  <User className="w-6 h-6" /> Mi Perfil
                </NavLink>

                <Link to="/create-recipe" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 bg-orange-600 text-white p-4 rounded-xl font-bold text-center justify-center mt-2">
                  <PlusSquare className="w-6 h-6" /> Crear Receta
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-4 text-red-500 w-full py-2 px-4 text-lg font-medium border-t border-zinc-800 pt-4 mt-2">
                  <LogOut className="w-6 h-6" /> Cerrar Sesión
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 bg-zinc-800 text-white p-4 rounded-xl font-bold text-center justify-center uppercase tracking-widest text-xs">
                <LogIn className="w-5 h-5" /> Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;