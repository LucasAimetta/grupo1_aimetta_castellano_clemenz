import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home';
import CreateRecipe from './components/CreateRecipe';
import RecipeDetail from './components/RecipeDetail';
import MyRecipes from './components/MyRecipes';
import Navbar from './components/Navbar';
import EditRecipe from './components/EditRecipe';
import Profile from './components/Profile';
import Footer from './components/Footer'; // <--- 1. IMPORTARLO AQUÍ

// --- LAYOUT PRIVADO MODIFICADO ---
const PrivateLayout = ({ children }) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    // 2. AÑADIMOS 'flex flex-col' PARA QUE EL CONTENIDO OCUPE TODO EL ALTO
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />
      
      {/* 3. WRAPPER CON 'flex-1': Empuja el footer hacia abajo */}
      <main className="flex-1">
        {children}
      </main>

      {/* 4. FOOTER AL FINAL */}
      <Footer />
    </div>
  );
};

// --- LAYOUT PÚBLICO MODIFICADO ---
const PublicLayout = ({ children }) => {
  return (
    // Mismas clases CSS para mantener la consistencia
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {children}
      </main>

      <Footer />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login se queda SIN footer (Correcto) */}
        <Route path="/login" element={<Login />} />
        
        {/* --- ZONA PÚBLICA --- */}
        <Route path="/" element={
          <PublicLayout> 
            <Home /> 
          </PublicLayout>
        } />
        
        <Route path="/recipes/:id" element={ 
          <PublicLayout>
            <RecipeDetail />
          </PublicLayout>
        } />
        
        {/* --- ZONA PRIVADA --- */}
        <Route path="/create-recipe" element={
          <PrivateLayout>
            <CreateRecipe />
          </PrivateLayout>
        } />

        <Route path="/profile" element={
            <PrivateLayout>
                <Profile />
            </PrivateLayout>
        } />

        <Route path="/my-recipes" element={ 
          <PrivateLayout>
            <MyRecipes />
          </PrivateLayout>
        } />
        
        <Route path="/edit-recipe/:id" element={ 
          <PrivateLayout>
            <EditRecipe />
          </PrivateLayout>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;