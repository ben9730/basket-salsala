'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { deleteOrder } from '../actions';

// ConfirmDelete is bound to deleteProduct, so orders get their own confirm.
export function DeleteOrder({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="ghost" onClick={() => setOpen(true)}>
        מחק
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} ariaLabel="למחוק את ההזמנה?">
        <h2 className="mb-2 text-lg font-bold">למחוק את ההזמנה?</h2>
        <p className="mb-4 text-sm text-muted">לא ניתן לשחזר פעולה זו.</p>
        <form action={deleteOrder} className="flex justify-end gap-2">
          <input type="hidden" name="id" value={id} />
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            ביטול
          </Button>
          <Button type="submit" variant="danger" data-testid="confirm-delete-submit">
            מחק
          </Button>
        </form>
      </Modal>
    </>
  );
}
