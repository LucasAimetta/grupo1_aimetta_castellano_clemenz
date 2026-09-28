import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star, Clock, Flame } from 'lucide-react';

const HeroCarousel = ({ recipes }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Si no hay recetas populares, no mostramos nada
  if (!recipes || recipes.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === recipes.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? recipes.length - 1 : prev - 1));
  };

  // Auto-play cada 5 segundos
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [recipes.length]);

  const currentRecipe = recipes[currentIndex];

  return (
    <div className="relative w-full h-[500px] overflow-hidden group">
      
      {/* Imagen de Fondo con Gradiente */}
      <div className="absolute inset-0">
        <img 
          src={currentRecipe.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836"} 
          alt={currentRecipe.title}
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
        />
        {/* Gradiente oscuro para que se lea el texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/40 to-transparent"></div>
      </div>

      {/* Contenido Texto */}
      <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-10">
        <div className="max-w-4xl animate-in slide-in-from-bottom-5 fade-in duration-500 key={currentIndex}"> 
          
          <div className="flex items-center gap-2 mb-3">
             <span className="bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider">
               <Flame className="w-3 h-3" /> Tendencia #{currentIndex + 1}
             </span>
             <span className="bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 border border-white/10">
               <Star className="w-3 h-3 text-yellow-400" /> {currentRecipe.rating || 5.0}
             </span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            {currentRecipe.title}
          </h2>
          
          <p className="text-zinc-300 text-lg mb-6 line-clamp-2 max-w-2xl">
            {currentRecipe.description}
          </p>

          <div className="flex gap-4">
            <button 
              onClick={() => navigate(`/recipes/${currentRecipe.id}`)}
              className="bg-white text-zinc-950 font-bold px-8 py-3 rounded-full hover:bg-zinc-200 transition"
            >
              Ver Receta
            </button>
            <div className="flex items-center gap-2 text-white bg-black/40 backdrop-blur-sm px-6 py-3 rounded-full border border-white/10">
                <Clock className="w-5 h-5" />
                <span>{currentRecipe.totalTime} min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flechas de Navegación */}
      <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-orange-600 text-white p-3 rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100 border border-white/10">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-orange-600 text-white p-3 rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100 border border-white/10">
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Indicadores (Puntitos) */}
      <div className="absolute bottom-6 right-8 flex gap-2">
        {recipes.map((_, idx) => (
          <div 
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-orange-500' : 'w-2 bg-zinc-600'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;