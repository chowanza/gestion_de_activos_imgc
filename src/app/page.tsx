'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, ArrowRight, Cpu, Eye, EyeOff, Lock, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingLogin } from '@/utils/LoadingLogin';
import { useTheme } from 'next-themes';




type Particle = {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  update: () => void;
  draw: (context: CanvasRenderingContext2D, allParticles: Particle[]) => void;
};


export default function LoginPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, systemTheme } = useTheme();
  


  const currentTheme = theme === "system" ? systemTheme : theme;

    useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Puedes devolver un loader o null mientras se determina el tema
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  

   const isDarkMode = currentTheme === "dark";

  // Estilos condicionales
  const backgroundStyles = isDarkMode 
    ? "bg-gradient-to-br from-black via-slate-900 to-slate-800"
    : "bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200";

  const cardStyles = isDarkMode
    ? "bg-slate-900/80 border-slate-700/50"
    : "bg-white/90 border-slate-200/80";

  const textColor = isDarkMode ? "text-slate-300" : "text-slate-700";
  const mutedTextColor = isDarkMode ? "text-slate-400" : "text-slate-500";
  const inputBorder = isDarkMode ? "border-slate-700" : "border-slate-300";
  const inputBackground = isDarkMode ? "bg-slate-800" : "bg-white";


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        // Redirección al dashboard si el login es exitoso
        window.location.href = '/dashboard'; 
        router.refresh(); // Refresca la página para que el middleware actúe
      } else {
        const data = await res.json();
        setError(data.message || 'Error al iniciar sesión.');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${backgroundStyles} flex items-center justify-center p-4 relative overflow-hidden`}>
      {/* Background particle effect */}
      <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full ${isDarkMode ? 'opacity-40' : 'opacity-20'}`} />

      {/* Geometric background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-1/4 left-1/4 w-64 h-64 ${
          isDarkMode 
            ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10' 
            : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20'
        } rounded-full blur-3xl animate-pulse`}></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      ></div>

      {/* Login Card */}
      <Card className={`w-full max-w-md ${cardStyles} backdrop-blur-xl shadow-2xl relative z-10`}>
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <Cpu className="h-8 w-8 text-white" />
              </div>
              <div className="absolute inset-0 w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-ping opacity-20"></div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            VENTORY
          </CardTitle>
          <p className="text-slate-400 text-sm mt-2">Sistema de Inventario de Equipos</p>
        </CardHeader>

        <CardContent className="p-6 pt-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className={`${textColor} text-sm font-medium`}>
                Nombre de Usuario
              </Label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${mutedTextColor}`}/>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Ingrese su usuario"
                  className={`pl-10 ${inputBorder} ${inputBackground}`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className={`${textColor} text-sm font-medium`}>
                Contraseña
              </Label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${mutedTextColor}`} />
                <Input
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingrese su contraseña"
                  className={`pl-10 pr-10 ${inputBorder} ${inputBackground} `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
             {error && (
              <div className="flex items-center p-3 text-sm text-red-400 bg-red-900/30 border border-red-500/50 rounded-md">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  Iniciar Sesión
                  <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <div className="text-center">
              <p className="text-xs text-slate-500">Sistema seguro de autenticación</p>
              <div className="flex items-center justify-center mt-2 space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-400">Conexión segura</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading overlay */}
      {isLoading && (
          <LoadingLogin  message='AUTENTICANDO...' />
      )}

      {/* Floating elements */}
      <div className="absolute top-10 left-10 w-4 h-4 bg-cyan-500/20 rounded-full animate-bounce delay-0"></div>
      <div className="absolute top-20 right-20 w-3 h-3 bg-blue-500/20 rounded-full animate-bounce delay-300"></div>
      <div className="absolute bottom-20 left-20 w-5 h-5 bg-purple-500/20 rounded-full animate-bounce delay-700"></div>
      <div className="absolute bottom-10 right-10 w-2 h-2 bg-emerald-500/20 rounded-full animate-bounce delay-1000"></div>
    </div>
  )
}
