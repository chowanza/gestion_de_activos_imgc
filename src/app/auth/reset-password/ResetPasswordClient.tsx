"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import PasswordInput from '@/components/PasswordInput';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { showToast } from 'nextjs-toast-notify';
import { LoadingSpinner } from '@/utils/loading';

export default function ResetPasswordClient() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      return;
    }

    // Validate token
    const validateToken = async () => {
      try {
        const response = await fetch('/api/auth/validate-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        setIsValidToken(response.ok);
      } catch (error) {
        console.error('Error validating token:', error);
        setIsValidToken(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      showToast.error('Por favor ingresa una contraseña');
      return;
    }

    if (password.length < 6) {
      showToast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      showToast.error('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        showToast.success('Contraseña restablecida exitosamente');
      } else {
        showToast.error(data.message || 'Error al restablecer la contraseña');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast.error('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <LoadingSpinner message="Validando enlace..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-600">Enlace inválido</CardTitle>
            <CardDescription>
              Este enlace de recuperación no es válido o ha expirado.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Solicita un nuevo enlace de recuperación de contraseña.
            </p>
            <Button
              onClick={() => router.push('/auth/forgot-password')}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Solicitar nuevo enlace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-xl text-green-600">Contraseña restablecida</CardTitle>
            <CardDescription>
              Tu contraseña ha sido cambiada exitosamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-6">
              Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
              <Button
              onClick={() => router.push('/')}
              className="w-full"
            >
              Ir al inicio de sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Restablecer contraseña</CardTitle>
          <CardDescription>
            Ingresa tu nueva contraseña
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <PasswordInput
                id="password"
                placeholder="Ingresa tu nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="Confirma tu nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Restableciendo...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Restablecer contraseña
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              onClick={() => router.push('/')}
              variant="link"
              className="text-sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio de sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
