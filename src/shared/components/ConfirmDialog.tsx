import * as React from 'react';
import { Dialog, DialogFooter } from './Dialog';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isPending = false,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => !isPending && onCancel()}
      title={title}
      description={message}
      size="sm"
    >
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel} disabled={isPending}>
          {cancelText}
        </Button>
        <Button variant="destructive" onClick={onConfirm} isLoading={isPending}>
          {confirmText}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
