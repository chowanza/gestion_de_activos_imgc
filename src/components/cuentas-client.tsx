"use client";

import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/utils/loading';
import { usePermissions } from '@/hooks/usePermissions';
import PasswordInput from '@/components/PasswordInput';

interface UserItem {
  id: string;
  username: string;
  email?: string | null;
  role?: string;
  permissions?: string[];
}

export default function CuentasClient() {
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<{ username: string; email: string; role: string; password?: string }>({ username: '', email: '', role: 'No-Admin' });
  const { hasPermission, isAdmin } = usePermissions();

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Error cargando cuentas');
      const data = await res.json();
      setItems(data || []);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error('Error creando cuenta');
      await load();
      setCreating(false);
      setForm({ username: '', email: '', role: 'No-Admin' });
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const handleEdit = (item: UserItem) => {
    setEditing(item);
    setForm({ username: item.username, email: item.email || '', role: item.role || 'No-Admin' });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const res = await fetch(`/api/users/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error('Error actualizando cuenta');
      setEditing(null);
      await load();
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar cuenta? Esta acción es irreversible.')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error eliminando cuenta');
      await load();
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const triggerPasswordReset = async (id: string) => {
    if (!confirm('Iniciar recuperación de contraseña para este usuario?')) return;
    try {
      const res = await fetch(`/api/users/${id}/password-reset`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.message || 'Error iniciando recuperación');
      }

      // Show token if returned (when SMTP not configured) or success message when emailed
      const emailPresent = data?.emailPresent !== undefined ? data.emailPresent : Boolean(data?.email);
      if (data?.token) {
        const msg = emailPresent ? (data.message || 'Token creado') : (data.message ? `${data.message} - Usuario no tiene email registrado` : 'Token creado (usuario no tiene email)');
        setResetResult({ success: true, message: msg, token: data.token });
      } else {
        const msg = data?.message || 'Token creado y enviado por correo';
        setResetResult({ success: true, message: msg });
      }
    } catch (e: any) {
      setError(e.message || String(e));
    }
  };

  const [resetResult, setResetResult] = useState<{ success: boolean; message?: string; token?: string } | null>(null);

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      // small UX feedback
      setResetResult(s => s ? { ...s, message: 'Token copiado al portapapeles' } : null);
    } catch (err) {
      setError('No se pudo copiar el token automáticamente. Copia manualmente.');
    }
  };

  if (loading) return <LoadingSpinner message="Cargando cuentas..." size="md" />;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Cuentas del sistema</h1>
            <p className="text-sm text-gray-600">Crear, editar y eliminar cuentas del sistema.</p>
          </div>
          <div>
            {hasPermission('canManageUsers') && (
              <button onClick={() => setCreating(true)} className="px-3 py-2 bg-indigo-600 text-white rounded">Crear cuenta</button>
            )}
          </div>
        </div>
      </div>

          {resetResult && (
            <div className="mb-4 p-4 bg-white rounded shadow">
              <div className="font-medium">{resetResult.message}</div>
              {resetResult.token && (
                <div className="mt-2 flex items-center gap-2">
                  <code className="bg-gray-100 p-2 rounded break-all">{resetResult.token}</code>
                  <button onClick={() => copyToken(resetResult.token || '')} className="px-2 py-1 bg-blue-500 text-white rounded">Copiar</button>
                </div>
              )}
              <div className="mt-2">
                <button onClick={() => setResetResult(null)} className="px-2 py-1 bg-gray-200 rounded">Cerrar</button>
              </div>
            </div>
          )}

      {creating && (
        <form onSubmit={handleCreate} className="mb-6 p-4 bg-white rounded shadow">
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="username" value={form.username} onChange={e => setForm(s => ({ ...s, username: e.target.value }))} className="border p-2" />
            <input placeholder="email" value={form.email} onChange={e => setForm(s => ({ ...s, email: e.target.value }))} className="border p-2" />
            <select value={form.role} onChange={e => setForm(s => ({ ...s, role: e.target.value }))} className="border p-2">
              <option value="No-Admin">No-Admin</option>
              <option value="Admin">Admin</option>
            </select>
            <div className="border p-2">
              <PasswordInput placeholder="password" value={form.password || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(s => ({ ...s, password: e.target.value }))} />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" className="px-3 py-2 bg-green-600 text-white rounded">Crear</button>
            <button type="button" onClick={() => setCreating(false)} className="px-3 py-2 bg-gray-200 rounded">Cancelar</button>
          </div>
        </form>
      )}

      {editing && (
        <form onSubmit={handleUpdate} className="mb-6 p-4 bg-white rounded shadow">
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="username" value={form.username} onChange={e => setForm(s => ({ ...s, username: e.target.value }))} className="border p-2" />
            <input placeholder="email" value={form.email} onChange={e => setForm(s => ({ ...s, email: e.target.value }))} className="border p-2" />
            <select value={form.role} onChange={e => setForm(s => ({ ...s, role: e.target.value }))} className="border p-2">
              <option value="No-Admin">No-Admin</option>
              <option value="Admin">Admin</option>
            </select>
            <div className="border p-2">
              <PasswordInput placeholder="password (nuevo)" value={form.password || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(s => ({ ...s, password: e.target.value }))} />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">Guardar</button>
            <button type="button" onClick={() => setEditing(null)} className="px-3 py-2 bg-gray-200 rounded">Cancelar</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-3">
        {items.map(u => (
          <div key={u.id} className="p-3 bg-white rounded shadow flex items-center justify-between">
            <div>
              <div className="font-medium">{u.username}</div>
              <div className="text-sm text-gray-500">{u.email || '—'}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">{u.role}</div>
              {hasPermission('canManageUsers') ? (
                <>
                  <button onClick={() => handleEdit(u)} className="px-2 py-1 bg-yellow-100 rounded">Editar</button>
                  <button onClick={() => handleDelete(u.id)} className="px-2 py-1 bg-red-100 rounded">Eliminar</button>
                  <button onClick={() => triggerPasswordReset(u.id)} className="px-2 py-1 bg-indigo-100 rounded">Recuperar</button>
                </>
              ) : (
                // If not manager, only show view label (no actions)
                null
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
