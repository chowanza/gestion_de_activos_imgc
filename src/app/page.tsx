'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertCircle, ArrowRight, Cpu, Eye, EyeOff, Lock, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingLogin } from '@/utils/LoadingLogin';




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

  // Estilos condicionales
  const backgroundStyles = "bg-black";

  const cardStyles = "bg-white border-gray-200";

  const textColor = "text-gray-900";
  const mutedTextColor = "text-gray-600";
  const inputBorder = "border-gray-300";
  const inputBackground = "bg-white";


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
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-10" />

      {/* Geometric background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-[#167DBA]/10 to-[#EA7704]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-[#EA7704]/10 to-[#167DBA]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-[#167DBA]/10 to-[#EA7704]/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(22, 125, 186, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(22, 125, 186, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      ></div>

      {/* Login Card */}
      <Card className={`w-full max-w-md ${cardStyles} backdrop-blur-xl shadow-2xl relative z-10`}>
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                <img src="/img/logo.png" alt="IMGC Logo" className="w-16 h-16 object-contain" />
              </div>
              <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-[#167DBA] to-[#EA7704] rounded-full animate-ping opacity-20"></div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-[#167DBA] to-[#EA7704] bg-clip-text text-transparent">
            Iron Metallics Global Consultants
          </CardTitle>
          <p className="text-gray-600 text-sm mt-2">Sistema de Gestión de Activos</p>
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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
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
              className="w-full h-12 bg-gradient-to-r from-[#167DBA] to-[#EA7704] hover:from-[#0f5a8a] hover:to-[#d65a04] text-white font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500">Sistema seguro de autenticación</p>
              <div className="flex items-center justify-center mt-2 space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600">Conexión segura</span>
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
      <div className="absolute top-10 left-10 w-4 h-4 bg-[#167DBA]/20 rounded-full animate-bounce delay-0"></div>
      <div className="absolute top-20 right-20 w-3 h-3 bg-[#EA7704]/20 rounded-full animate-bounce delay-300"></div>
      <div className="absolute bottom-20 left-20 w-5 h-5 bg-[#167DBA]/20 rounded-full animate-bounce delay-700"></div>
      <div className="absolute bottom-10 right-10 w-2 h-2 bg-[#EA7704]/20 rounded-full animate-bounce delay-1000"></div>
    </div>
  )
}
