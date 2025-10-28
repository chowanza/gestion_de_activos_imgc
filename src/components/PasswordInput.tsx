"use client";

import React, { InputHTMLAttributes, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id?: string;
  value: string;
  onChange: (e: any) => void;
}

export default function PasswordInput({ id, value, onChange, className, ...rest }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative flex items-center ${className || ''}`}>
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        {...rest}
      />
      <button
        type="button"
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        onClick={() => setVisible(v => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
