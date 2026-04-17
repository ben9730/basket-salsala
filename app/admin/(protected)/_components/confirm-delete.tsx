'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { deleteProduct } from '../products/[id]/edit/actions';

export function ConfirmDelete({ id, label = 'מחק' }: { id: string; label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="ghost" size="md" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        ariaLabel="למחוק את המוצר?"
      >
        <h2 className="mb-2 text-lg font-bold">למחוק את המוצר?</h2>
        <p className="mb-4 text-sm text-neutral-600">לא ניתן לשחזר פעולה זו.</p>
        <form action={deleteProduct} className="flex justify-end gap-2">
          <input type="hidden" name="id" value={id} />
          <Button type="button" variant="ghost" size="md" onClick={() => setOpen(false)}>
            ביטול
          </Button>
          <Button type="submit" variant="danger" size="md" data-testid="confirm-delete-submit">
            מחק
          </Button>
        </form>
      </Modal>
    </>
  );
}
