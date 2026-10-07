import { ChefHat } from 'lucide-react';

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
            </div>
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