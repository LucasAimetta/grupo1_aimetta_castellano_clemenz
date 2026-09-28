import React, { useState, useEffect } from 'react';
import { Mail, Lock, Flame, User, ArrowRight, AlertCircle, Ghost } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios'; 

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false); // <--- NUEVO ESTADO
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Efecto para detectar el token de Google en la URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const errorParam = params.get('error');

    if (token) {
      // Por defecto, Google Login lo guardamos en localStorage (persistente)
      localStorage.setItem('token', token);
      navigate('/'); 
    }
    
    if (errorParam) {
      setError('Error en la autenticación con Google.');
    }
  }, [location, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); 
  };

  // Validar contraseña
  const validatePassword = (pass) => {
    if (pass.length < 12) return "Mínimo 12 caracteres";
    if (!/[A-Z]/.test(pass)) return "Falta una mayúscula";
    if (!/[a-z]/.test(pass)) return "Falta una minúscula";
    if (!/[0-9]/.test(pass)) return "Falta un número";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validación previa al envío (solo en registro)
    if (!isLogin) {
      const passError = validatePassword(formData.password);
      if (passError) {
        setError(`Contraseña insegura: ${passError}`);
        return;
      }
    }

    setLoading(true);
    const endpoint = isLogin ? '/login' : '/register'; 

    try {
      const response = await api.post(endpoint, formData);

      if (response.data.token) {
        const token = response.data.token;
        // Asumiendo que el backend devuelve también el usuario, es bueno guardarlo
        // Si no lo devuelve, borra las líneas de userString
        const userString = JSON.stringify(response.data.user || {}); 

        // --- LÓGICA DE RECORDAR DATOS (MEJORADA) ---
        if (rememberMe) {
            // 1. Guardamos en Local (Persistente)
            localStorage.setItem('token', token);
            if (response.data.user) localStorage.setItem('user', userString);
            
            // 2. IMPORTANTE: Limpiamos Session para que no haya duplicados
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
        } else {
            // 1. Guardamos en Session (Temporal)
            sessionStorage.setItem('token', token);
            if (response.data.user) sessionStorage.setItem('user', userString);

            // 2. IMPORTANTE: Limpiamos Local por si antes había entrado con "Recordarme"
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }

        navigate('/'); 
      } else {
        setIsLogin(true);
        setError('Cuenta creada. Por favor inicia sesión.');
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.Error || 'Error de conexión o credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "https://burned.onrender.com/auth/google/login";
  };

  // Función para manejar el modo invitado
  const handleGuestLogin = () => {
    navigate('/'); // Simplemente redirige al Home sin token
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Decoración de fondo */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 to-red-600"></div>

        <div className="flex justify-center mb-6">
          <div className="bg-orange-600/10 p-3 rounded-full border border-orange-600/20">
            <Flame className="text-orange-500 w-8 h-8" />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center text-white mb-2">
          {isLogin ? 'Bienvenido Chef' : 'Únete a la Cocina'}
        </h2>
        <p className="text-zinc-400 text-center mb-8 text-sm">
          {isLogin ? 'Gestiona tus recetas profesionales' : 'Crea tu cuenta para empezar'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg flex items-center gap-2 text-red-200 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {!isLogin && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">Nombre</label>
              <div className="relative group">
                <User className="absolute left-3 top-3 w-5 h-5 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                <input 
                  name="name"
                  type="text" 
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  placeholder="Tu nombre completo"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">Email</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
              <input 
                name="email"
                type="email" 
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                placeholder="chef@restaurante.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">Contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
              <input 
                name="password"
                type="password" 
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                placeholder="••••••••••••"
                required
              />
            </div>
            {!isLogin && (
               <p className="text-xs text-zinc-500 mt-2 ml-1">
                 Min. 12 caracteres, mayúscula, minúscula y número.
               </p>
            )}
          </div>

          {/* --- CHECKBOX RECORDAR DATOS (Solo en Login) --- */}
          {isLogin && (
            <div className="flex items-center mt-2">
                <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-orange-600 bg-zinc-950 border-zinc-700 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer accent-orange-600"
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-zinc-400 cursor-pointer select-none">
                    Recordar mis datos
                </label>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg mt-6 shadow-lg shadow-orange-900/20 transition-all flex justify-center items-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">Procesando...</span>
            ) : (
              <>
                {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-zinc-900 text-zinc-500">O continúa con</span>
          </div>
        </div>

        <div className="space-y-3">
            {/* BOTÓN GOOGLE */}
            <button 
                onClick={handleGoogleLogin}
                type="button"
                className="w-full bg-white text-zinc-900 font-medium py-3 rounded-lg hover:bg-zinc-200 transition flex items-center justify-center gap-3"
            >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="google" />
                Google
            </button>

            {/* BOTÓN MODO INVITADO */}
            <button 
                onClick={handleGuestLogin}
                type="button"
                className="w-full bg-zinc-800 text-zinc-300 font-medium py-3 rounded-lg hover:bg-zinc-700 hover:text-white transition flex items-center justify-center gap-2 border border-zinc-700"
            >
                <Ghost className="w-5 h-5" />
                Entrar como Invitado
            </button>
        </div>

        <p className="text-center mt-8 text-zinc-500 text-sm">
          {isLogin ? '¿Primera vez aquí? ' : '¿Ya eres miembro? '}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }} 
            className="text-orange-500 font-semibold hover:text-orange-400 transition ml-1"
          >
            {isLogin ? 'Crear cuenta' : 'Iniciar Sesión'}
          </button>
        </p>

      </div>
    </div>
  );
};

export default Login;