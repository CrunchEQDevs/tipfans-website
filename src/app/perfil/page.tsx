// src/app/perfil/page.tsx
import PerfilForm from '@/components/perfil/PerfilForm';
import PasswordForm from '@/components/perfil/PasswordForm';
import DangerZone from '@/components/perfil/DangerZone';

export const metadata = {
  title: 'Perfil',
};

export default function PerfilPage() {
  return (
    <>
      <PerfilForm />

      {/* separador */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/90 to-transparent my-2" />

      <PasswordForm />

      {/* separador */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/90 to-transparent my-2" />

      <DangerZone />
    </>
  );
}
