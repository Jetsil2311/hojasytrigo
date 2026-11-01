/* eslint-disable react/prop-types */
import { useState } from 'react';
import { Landmark, LockOpen } from 'lucide-react';
import { useRegister } from '../../hooks/useRegister';
import { OpenRegisterDialog } from '../../views/admin/Register';
import { Button } from '../ui';

// Gate for screens that need an open register (the POS).
export const RegisterOverlay = ({ children }) => {
  const { isRegisterOpen } = useRegister();
  const [showModal, setShowModal] = useState(false);

  if (isRegisterOpen) return <>{children}</>;

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="flex max-w-sm flex-col items-center text-center animate-fade-in">
        <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-on-accent">
          <Landmark size={28} />
        </span>
        <h2 className="font-display text-2xl font-bold text-ink">Primero, la caja</h2>
        <p className="mt-2 text-muted">Para cobrar en el punto de venta necesitas abrir la caja con el fondo inicial.</p>
        <Button size="lg" className="mt-6" onClick={() => setShowModal(true)}>
          <LockOpen size={18} /> Abrir caja
        </Button>
      </div>
      <OpenRegisterDialog open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};
