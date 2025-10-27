"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CuentasRedirectPage() {
	const router = useRouter();

	useEffect(() => {
		// Redirect to the new Gestión de Cuentas route
		router.replace('/gestion-de-cuentas');
	}, [router]);

	return null;
}
