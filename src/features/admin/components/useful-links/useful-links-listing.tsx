'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconLoader2,
  IconExternalLink
} from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  UsefulLinkFormDialog,
  type UsefulLinkRow
} from './useful-link-form-dialog';

export default function UsefulLinksListing() {
  const [links, setLinks] = useState<UsefulLinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editLink, setEditLink] = useState<UsefulLinkRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadLinks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/useful-links');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setLinks(data.links ?? []);
    } catch {
      toast.error('Failed to load useful links');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  const openAdd = () => {
    setEditLink(null);
    setModalOpen(true);
  };

  const openEdit = (link: UsefulLinkRow) => {
    setEditLink(link);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/useful-links/${deleteId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Link deleted');
      setDeleteId(null);
      loadLinks();
    } catch {
      toast.error('Failed to delete link');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-12'>
          <IconLoader2 className='text-muted-foreground h-8 w-8 animate-spin' />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>Useful links</CardTitle>
            <Button onClick={openAdd}>
              <IconPlus className='mr-2 h-4 w-4' />
              Add link
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <p className='text-muted-foreground py-8 text-center text-sm'>
              No useful links yet. Add one to show on the user useful-links
              page.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className='w-[120px] text-right'>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell className='text-muted-foreground w-16'>
                      {link.order}
                    </TableCell>
                    <TableCell className='font-medium'>{link.title}</TableCell>
                    <TableCell>
                      <a
                        href={link.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-primary inline-flex items-center gap-1 text-sm hover:underline'
                      >
                        {link.url.length > 50
                          ? link.url.slice(0, 50) + '…'
                          : link.url}
                        <IconExternalLink className='h-3 w-3' />
                      </a>
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => openEdit(link)}
                          aria-label='Edit'
                        >
                          <IconPencil className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => setDeleteId(link.id)}
                          aria-label='Delete'
                          className='text-destructive hover:text-destructive'
                        >
                          <IconTrash className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <UsefulLinkFormDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        editLink={editLink}
        onSuccess={loadLinks}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={() => !deleting && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete link?</AlertDialogTitle>
            <AlertDialogDescription>
              This link will be removed from the useful links page. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {deleting ? (
                <>
                  <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
