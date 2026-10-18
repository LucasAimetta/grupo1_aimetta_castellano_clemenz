import React, { useState } from 'react';
import { Filter, Tag, Clock, X, Plus, Utensils, Search } from 'lucide-react';

const PREDEFINED_TAGS = [
  "Desayuno", "Almuerzo", "Cena", "Postre", 
  "Vegano", "Vegetariano", "Sin TACC", "Rápido", 
  "Saludable", "Pasta", "Carne", "Ensalada", "Picante"
];

const FilterBar = ({ filters, onFilterChange, onClear, onSearch }) => {
  const [ingredientInput, setIngredientInput] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const handleAddIngredient = (e) => {
    if (e) e.preventDefault();
    const trimmed = ingredientInput.trim();
    if (!trimmed) return;

    const currentIngredients = filters.ingredients || [];
    // Evitamos duplicados ignorando mayúsculas/minúsculas
    const exists = currentIngredients.some(ing => ing.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      onFilterChange({
        ...filters,
        ingredients: [...currentIngredients, trimmed]
      });
    }
    setIngredientInput('');
  };

  const handleRemoveIngredient = (indexToRemove) => {
    const updated = (filters.ingredients || []).filter((_, idx) => idx !== indexToRemove);
    onFilterChange({
      ...filters,
      ingredients: updated
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  const hasActiveFilters = 
    (filters.tags && filters.tags !== '') || 
    (filters.difficulty && filters.difficulty !== '') || 
    (filters.time && filters.time < 180) ||
    (filters.ingredients && filters.ingredients.length > 0);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-10 shadow-xl relative overflow-hidden transition-all duration-300">
      {/* Decoración de fondo */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Cabecera */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 text-orange-500 font-bold text-lg">
          <Filter className="w-5 h-5" />
          <span>Filtros avanzados de búsqueda</span>
        </div>
        
        {hasActiveFilters && (
          <button 
            type="button"
            onClick={onClear}
            className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 transition font-medium bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 active:scale-95"
          >
            <X className="w-3.5 h-3.5" /> Limpiar filtros
          </button>
        )}
      </div>

      {/* SECCIÓN 1: INGREDIENTES */}
      <div className="mb-6 p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
        <label className="text-xs text-zinc-300 font-semibold flex items-center gap-2 mb-2">
          <Utensils className="w-4 h-4 text-orange-400" />
          ¿Qué ingredientes tienes en tu cocina?
        </label>
        <p className="text-[11px] text-zinc-500 mb-3">
          Agrega los ingredientes que quieras y filtraremos solo las recetas que los contengan.
        </p>

        {/* Input para agregar ingrediente */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input 
              type="text"
              value={ingredientInput}
              onChange={(e) => setIngredientInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ej: tomate, huevo, harina, queso..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl py-2 px-3.5 text-sm text-white placeholder-zinc-500 focus:border-orange-500 outline-none transition"
            />
          </div>
          <button
            type="button"
            onClick={handleAddIngredient}
            disabled={!ingredientInput.trim()}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-orange-500 text-black font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1 active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>

        {/* Lista de chips / etiquetas de ingredientes agregados */}
        {filters.ingredients && filters.ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-zinc-800/60">
            {filters.ingredients.map((ing, idx) => (
              <span
                key={`${ing}-${idx}`}
                className="bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 animate-fadeIn"
              >
                {ing}
                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(idx)}
                  className="hover:text-white transition rounded-full p-0.5 hover:bg-orange-500/20"
                  title="Eliminar ingrediente"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN 2: GRID DE TIEMPO, DIFICULTAD Y CATEGORÍA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
        {/* 1. Tiempo Slider */}
        <div className="space-y-2">
          <label htmlFor="filter-time" className="flex justify-between text-xs w-full font-medium">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-400"/> Tiempo Máximo
            </span>
            <span className="text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
              {filters.time ? `≤ ${filters.time} min` : 'Sin límite'}
            </span>
          </label>
          <input 
            id="filter-time"
            type="range" 
            name="time"
            min="5" max="180" step="5"
            value={filters.time || 180}
            onChange={handleChange}
            className="w-full accent-orange-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer block"
          />
          <div className="flex justify-between text-[10px] text-zinc-600">
            <span>5 min</span>
            <span>60 min</span>
            <span>180+ min</span>
          </div>
        </div>

        {/* 2. Dificultad */}
        <div className="space-y-2">
          <label htmlFor="filter-difficulty" className="text-xs text-zinc-400 font-medium block">
            Dificultad
          </label>
          <div className="relative">
            <select 
              id="filter-difficulty"
              name="difficulty"
              value={filters.difficulty || ''}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2 px-3 text-sm text-white focus:border-orange-500 outline-none transition cursor-pointer appearance-none"
            >
              <option value="">Todas las dificultades</option>
              <option value="easy">Fácil</option>
              <option value="medium">Media</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
        </div>

        {/* 3. Categoría / Tags */}
        <div className="space-y-2">
          <label htmlFor="filter-tags" className="text-xs text-zinc-400 font-medium block">
            Categoría
          </label>
          <div className="relative">
            <Tag className="absolute left-3 top-2.5 text-zinc-500 w-4 h-4 pointer-events-none" />
            <select 
              id="filter-tags"
              name="tags"
              value={filters.tags || ''}
              onChange={handleChange}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-2 pl-9 pr-3 text-sm text-white focus:border-orange-500 outline-none transition appearance-none cursor-pointer"
            >
              <option value="">Todas las categorías</option>
              {PREDEFINED_TAGS.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Botón de búsqueda / aplicar (opcional si se desea gatillar manualmente) */}
      {onSearch && (
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex justify-end">
          <button
            type="button"
            onClick={onSearch}
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-black font-bold px-6 py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-orange-500/20"
          >
            <Search className="w-4 h-4" /> Buscar recetas con estos filtros
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterBar;