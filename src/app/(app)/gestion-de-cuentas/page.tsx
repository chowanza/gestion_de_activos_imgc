"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import PasswordInput from '@/components/PasswordInput';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showToast } from "nextjs-toast-notify";
import { LoadingSpinner } from "@/utils/loading";
import { Plus, Edit, Trash2, Users, Key } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSession } from "@/hooks/useSession";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  email: string | null;
  role: string;
  createdAt?: string;
}

export default function GestionDeCuentasPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const isAdmin = useIsAdmin();
  const { status: sessionStatus } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Wait until session is loaded before deciding to redirect.
    if (sessionStatus === 'loading') return;

    // If session is loaded and user is not admin, redirect them.
    if (sessionStatus !== 'authenticated' || !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Error al cargar usuarios');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const roles = useMemo(() => {
    const setRoles = new Set<string>();
    users.forEach(u => setRoles.add(u.role || 'No-Admin'));
    return Array.from(setRoles);
  }, [users]);

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = `${u.username} ${u.email || ''}`.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter !== 'all' ? u.role === roleFilter : true;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      showToast.success('Usuario creado exitosamente');
      setIsCreateDialogOpen(false);
      setFormData({ username: '', email: '', password: '', role: 'No-Admin' });
      fetchUsers();
    } catch (error: any) {
      showToast.error(error.message || 'Error al crear usuario');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const body: any = {
        username: formData.username,
        email: formData.email,
        role: formData.role
      };
      // Only include password if admin filled a new one
      if (formData.password && formData.password.trim().length > 0) {
        body.password = formData.password;
      }

      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      showToast.success('Usuario actualizado exitosamente');
      setIsEditDialogOpen(false);
      setEditingUser(null);
      setFormData({ username: '', email: '', password: '', role: 'No-Admin' });
      fetchUsers();
    } catch (error: any) {
      showToast.error(error.message || 'Error al actualizar usuario');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar al usuario "${username}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      showToast.success('Usuario eliminado exitosamente');
      fetchUsers();
    } catch (error: any) {
      showToast.error(error.message || 'Error al eliminar usuario');
    }
  };

  const handleResetPassword = async (userId: string, username: string) => {
    if (!confirm(`Generar token de restablecimiento para "${username}"? (se mostrará el token)`)) return;
    try {
      const response = await fetch(`/api/users/${userId}/password-reset`, { method: 'POST' });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Error creando token');
      }
      const data = await response.json();
      const token = data.token;
      // show token to admin — server currently doesn't send email
      navigator.clipboard?.writeText(token).catch(() => {});
      showToast.success('Token de restablecimiento creado y copiado al portapapeles');
      // Also show the token in an alert for convenience
      alert(`Token para ${username}: ${token}\n(Ya fue copiado al portapapeles)`);
    } catch (error: any) {
      showToast.error(error.message || 'Error al crear token de restablecimiento');
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      password: '', // optional new password
      role: user.role
    });
    setIsEditDialogOpen(true);
  };

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner message="Cargando usuarios..." size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Cuentas</h1>
          <p className="text-gray-600">Administra las cuentas del sistema</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/auth/forgot-password')}>
            Recuperar contraseña
          </Button>
        </div>

        <div className="flex items-center space-x-3">
          <Input placeholder="Buscar usuarios..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                        {roles.map(r => (
                          <SelectItem key={r} value={r}>{(r || '').toString().charAt(0).toUpperCase() + (r || '').toString().slice(1)}</SelectItem>
                        ))}
              </SelectContent>
            </Select>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Crear</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label htmlFor="username">Nombre de Usuario</Label>
                  <Input id="username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required />
                </div>
                <div>
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                    <PasswordInput id="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                </div>
                <div>
                  <Label htmlFor="role">Rol</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">No-Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit">Crear Usuario</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Usuarios del Sistema ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email || 'Sin email'}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{(user.role || '').toString().charAt(0).toUpperCase() + (user.role || '').toString().slice(1)}</Badge>
                  </TableCell>
                  <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') : '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleResetPassword(user.id, user.username)}>
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.id, user.username)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
            <form onSubmit={handleEditUser} className="space-y-4">
            <div>
              <Label htmlFor="edit-username">Nombre de Usuario</Label>
              <Input id="edit-username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required />
            </div>
            <div>
              <Label htmlFor="edit-email">Email (opcional)</Label>
              <Input id="edit-email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            {editingUser && editingUser.role && editingUser.role.toLowerCase() !== 'admin' && (
              <div>
                <Label htmlFor="edit-password">Nueva contraseña (opcional)</Label>
                <PasswordInput id="edit-password" placeholder="Ingrese nueva contraseña" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              </div>
            )}
            <div>
                  <Label htmlFor="edit-role">Rol</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">No-Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">Actualizar Usuario</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
