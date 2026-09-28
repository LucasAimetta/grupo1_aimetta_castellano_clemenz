import React from 'react';
import { Filter, Tag, Clock, X } from 'lucide-react';

const PREDEFINED_TAGS = [
  "Desayuno", "Almuerzo", "Cena", "Postre", 
  "Vegano", "Vegetariano", "Sin TACC", "Rápido", 
  "Saludable", "Pasta", "Carne", "Ensalada", "Picante"
];

const FilterBar = ({ filters, onFilterChange, onClear }) => {

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Avisamos inmediatamente al padre (Home) del cambio
    onFilterChange({ ...filters, [name]: value });
  };

  // Verificamos si hay algún filtro activo para mostrar el botón de limpiar
  const hasActiveFilters = filters.tags !== '' || filters.difficulty !== '' || filters.time < 180;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-10 shadow-xl relative overflow-hidden transition-all duration-300">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>

        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-orange-500 font-bold">
                <Filter className="w-5 h-5" />
                <span>Filtra tu próxima comida</span>
            </div>
            
            {/* Botón Limpiar Filtros (Solo aparece si hay filtros) */}
            {hasActiveFilters && (
                <button 
                    onClick={onClear}
                    className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 transition font-medium bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20"
                >
                    <X className="w-3 h-3" /> Limpiar filtros
                </button>
            )}
        </div>

        {/* Grid de Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            
            {/* 1. Tags */}
            <div className="space-y-2">
                <label htmlFor="filter-tags" className="text-xs text-zinc-400 font-medium block">
                    Categoría
                </label>
                <div className="relative">
                    <Tag className="absolute left-3 top-2.5 text-zinc-500 w-4 h-4" />
                    <select 
                        id="filter-tags"
                        name="tags"
                        value={filters.tags}
                        onChange={handleChange}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2 pl-9 pr-3 text-sm text-white focus:border-orange-500 outline-none transition appearance-none cursor-pointer"
                    >
                        <option value="">Todas</option>
                        {PREDEFINED_TAGS.map(tag => (
                            <option key={tag} value={tag}>{tag}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 2. Dificultad */}
            <div className="space-y-2">
                <label htmlFor="filter-difficulty" className="text-xs text-zinc-400 font-medium block">
                    Dificultad
                </label>
                <div className="relative">
                    <div className="absolute left-3 top-2.5 text-zinc-500 w-4 h-4 flex items-center justify-center font-bold text-[10px] border border-zinc-500 rounded-sm">D</div>
                    <select 
                        id="filter-difficulty"
                        name="difficulty"
                        value={filters.difficulty}
                        onChange={handleChange}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2 pl-9 pr-3 text-sm text-white focus:border-orange-500 outline-none transition appearance-none cursor-pointer"
                    >
                        <option value="">Cualquiera</option>
                        <option value="easy">Fácil</option>
                        <option value="medium">Media</option>
                        <option value="hard">Difícil</option>
                    </select>
                </div>
            </div>

            {/* 3. Tiempo Slider */}
            <div className="space-y-2">
                <label htmlFor="filter-time" className="flex justify-between text-xs w-full">
                    <span className="text-zinc-400 font-medium flex items-center gap-1"><Clock className="w-3 h-3"/> Tiempo Máx.</span>
                    <span className="text-orange-400 font-bold">{filters.time}m</span>
                </label>
                <input 
                    id="filter-time"
                    type="range" 
                    name="time"
                    min="5" max="300" step="5"
                    value={filters.time}
                    onChange={handleChange}
                    className="w-full accent-orange-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer block"
                />
            </div>
        </div>
    </div>
  );
};

export default FilterBar;