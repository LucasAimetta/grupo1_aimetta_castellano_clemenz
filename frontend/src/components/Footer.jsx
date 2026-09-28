import React from 'react';
import { Linkedin, Github, Code, Heart, ChefHat } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-900 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* LADO IZQUIERDO: Nombre del Proyecto */}
          <div className="flex items-center gap-2">
            <div className="bg-orange-500/10 p-2 rounded-full">
                <ChefHat className="w-5 h-5 text-orange-500" />
            </div>
            <div>
                <h3 className="text-white font-bold text-lg leading-tight">Burned</h3>
                <p className="text-zinc-500 text-xs">Proyecto Personal</p>
            </div>
          </div>

          {/* CENTRO: Copyright / Hecho por */}
          <div className="text-zinc-500 text-sm flex flex-col items-center gap-1">
           
            <span className="text-zinc-200 font-semibold tracking-wide">
              Lucas Aimetta
            </span>
          </div>

          {/* LADO DERECHO: Links Sociales */}
          <div className="flex gap-4">
            <a 
              href="https://www.linkedin.com/in/lucas-aimetta-439292225/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center gap-2 bg-zinc-900 hover:bg-[#0077b5] border border-zinc-800 hover:border-transparent px-4 py-2 rounded-full transition-all duration-300"
            >
              <Linkedin className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
              <span className="text-zinc-400 text-sm font-medium group-hover:text-white">LinkedIn</span>
            </a>
            
            {/* Opcional: Si tienes GitHub, puedes descomentar esto */}
            {/* <a href="https://github.com/tu-usuario" target="_blank" rel="noopener noreferrer" className="p-2 bg-zinc-900 rounded-full hover:bg-white/10 transition">
               <Github className="w-5 h-5 text-zinc-400" />
            </a> 
            */}
          </div>

        </div>

        {/* Línea final opcional */}
        <div className="mt-8 pt-8 border-t border-zinc-900 text-center text-zinc-600 text-xs">
          &copy; {new Date().getFullYear()} Burned App. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;