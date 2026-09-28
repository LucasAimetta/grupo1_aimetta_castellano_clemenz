import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { User, Lock, Trash2, Save, LogOut, AlertTriangle, CheckCircle, Shield } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal'); 
  
  // Datos del Usuario
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '', 
    image: '', // Solo para mostrar, no se envía
  });

  // Datos de Password
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Estados de UI
  const [status, setStatus] = useState({ type: '', message: '' });
  const [saving, setSaving] = useState(false);

  // 1. CARGAR DATOS DEL USUARIO
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/user/me');
        setUser(res.data);
        setFormData({
            name: res.data.name || '',
            email: res.data.email || '',
            image: res.data.image || res.data.avatar || '', 
        });
      } catch (error) {
        console.error("Error cargando perfil:", error);
        if (error.response?.status === 401) navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  // --- HANDLERS ---

  // Actualizar Info Básica (SOLO NOMBRE)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
        // ELIMINADO: Ya no enviamos image, solo name
        await api.put('/user', {
            name: formData.name
        });
        setStatus({ type: 'success', message: 'Nombre actualizado correctamente.' });
        
        // Actualizamos estado local
        setUser({ ...user, name: formData.name });
    } catch (error) {
        setStatus({ type: 'error', message: 'Error al actualizar perfil.' });
    } finally {
        setSaving(false);
    }
  };

  // Actualizar Contraseña
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (passData.newPassword !== passData.confirmPassword) {
        setStatus({ type: 'error', message: 'Las nuevas contraseñas no coinciden.' });
        return;
    }

    if (passData.newPassword.length < 8) {
        setStatus({ type: 'error', message: 'La contraseña debe tener al menos 8 caracteres.' });
        return;
    }

    setSaving(true);
    try {
        await api.put('/user/password', {
            oldPassword: passData.currentPassword,
            newPassword: passData.newPassword
        });
        
        setStatus({ type: 'success', message: 'Contraseña actualizada. Inicia sesión de nuevo.' });
        setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });

    } catch (error) {
        const backendError = error.response?.data?.Error;
        let displayMsg = 'Error al cambiar contraseña.';
        
        if (backendError === "wrong credentials") displayMsg = "La contraseña actual es incorrecta.";
        else if (backendError === "the new password cannot be the same as the current one") displayMsg = "La nueva contraseña no puede ser igual a la actual.";
        else if (backendError === "password does not meet the security requirements") displayMsg = "La contraseña es débil.";
        else if (backendError) displayMsg = backendError;

        setStatus({ type: 'error', message: displayMsg });
    } finally {
        setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("¿ESTÁS SEGURO? Esta acción borrará todas tus recetas y datos permanentemente.")) {
        return;
    }
    try {
        await api.delete('/user');
        handleLogout();
    } catch (error) {
        alert("Error al eliminar la cuenta.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user'); 
    navigate('/login');
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex justify-center items-center">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-10">
      
      <div className="max-w-5xl mx-auto px-4 pt-10">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
            <User className="text-orange-500" /> Mi Perfil
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* SIDEBAR */}
            <div className="md:col-span-1 space-y-2">
                <button 
                    onClick={() => setActiveTab('personal')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'personal' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}
                >
                    <User className="w-5 h-5" /> Datos Personales
                </button>
                <button 
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'security' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}
                >
                    <Shield className="w-5 h-5" /> Seguridad
                </button>
                <button 
                    onClick={() => setActiveTab('danger')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === 'danger' ? 'bg-red-600/20 text-red-500 border border-red-500/20' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'}`}
                >
                    <AlertTriangle className="w-5 h-5" /> Zona de Peligro
                </button>
                
                <div className="pt-4 border-t border-zinc-800 mt-4">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition">
                        <LogOut className="w-5 h-5" /> Cerrar Sesión
                    </button>
                </div>
            </div>

            {/* CONTENIDO */}
            <div className="md:col-span-3">
                
                {status.message && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        {status.message}
                    </div>
                )}

                {/* TAB: DATOS PERSONALES */}
                {activeTab === 'personal' && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-xl font-bold mb-6">Información Básica</h2>
                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            
                           

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Nombre de Usuario</label>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Correo Electrónico</label>
                                    <input 
                                        type="email" 
                                        value={formData.email}
                                        disabled
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-500 cursor-not-allowed"
                                        title="No puedes cambiar tu email directamente."
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-800">
                                <button type="submit" disabled={saving} className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition flex items-center gap-2">
                                    {saving ? 'Guardando...' : 'Guardar Cambios'} <Save className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* TAB: SEGURIDAD (Igual que antes) */}
                {activeTab === 'security' && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-xl font-bold mb-2">Cambiar Contraseña</h2>
                        <p className="text-zinc-400 text-sm mb-6">Usa al menos 8 caracteres, mayúsculas y números.</p>

                        <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Contraseña Actual</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                                    <input 
                                        type="password" 
                                        value={passData.currentPassword}
                                        onChange={(e) => setPassData({...passData, currentPassword: e.target.value})}
                                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 pl-10 text-white outline-none focus:border-orange-500"
                                        placeholder="Tu contraseña actual"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="border-t border-zinc-800 my-4"></div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Nueva Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-5 h-5 text-orange-500" />
                                    <input 
                                        type="password" 
                                        value={passData.newPassword}
                                        onChange={(e) => setPassData({...passData, newPassword: e.target.value})}
                                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 pl-10 text-white outline-none focus:border-orange-500"
                                        placeholder="Mínimo 8 caracteres"
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Confirmar Nueva Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-5 h-5 text-orange-500" />
                                    <input 
                                        type="password" 
                                        value={passData.confirmPassword}
                                        onChange={(e) => setPassData({...passData, confirmPassword: e.target.value})}
                                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 pl-10 text-white outline-none focus:border-orange-500"
                                        placeholder="Repite la nueva contraseña"
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>
                            <div className="pt-4">
                                <button type="submit" disabled={saving} className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-8 rounded-xl border border-zinc-700 transition flex items-center gap-2">
                                    {saving ? 'Procesando...' : 'Actualizar Contraseña'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* TAB: DANGER (Igual que antes) */}
                {activeTab === 'danger' && (
                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 md:p-8 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6" /> Zona de Peligro
                        </h2>
                        <p className="text-zinc-300 mb-6">
                            Si eliminas tu cuenta, se perderán todas tus recetas guardadas...
                            <br/><span className="font-bold">Esta acción no se puede deshacer.</span>
                        </p>
                        <button 
                            onClick={handleDeleteAccount}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-red-900/20 transition flex items-center gap-2"
                        >
                            <Trash2 className="w-5 h-5" /> Eliminar mi Cuenta Definitivamente
                        </button>
                    </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;