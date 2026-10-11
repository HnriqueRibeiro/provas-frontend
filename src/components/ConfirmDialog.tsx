import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Excluir', loading = false, onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={loading ? () => undefined : onCancel} title={title}>
      <div className="confirm-body">
        <div className="confirm-icon"><AlertTriangle size={24} /></div>
        <p>{description}</p>
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={onCancel} disabled={loading} type="button">Cancelar</button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={loading} type="button">
          {loading ? <span className="spinner spinner-white" /> : <Trash2 size={16} />}
          {loading ? 'Excluindo...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
