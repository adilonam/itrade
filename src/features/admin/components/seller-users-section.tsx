'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IconSearch,
  IconArrowRight,
  IconArrowLeft,
  IconUsers,
  IconChevronLeft,
  IconChevronRight
} from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

interface User {
  id: string;
  name: string | null;
  email: string;
  balance: number;
  role: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface SellerUsersSectionProps {
  sellerId: string;
}

export default function SellerUsersSection({
  sellerId
}: SellerUsersSectionProps) {
  // All users state
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allUsersPagination, setAllUsersPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  const [emailFilter, setEmailFilter] = useState('');
  const [debouncedEmailFilter, setDebouncedEmailFilter] = useState('');

  // Linked users state
  const [linkedUsers, setLinkedUsers] = useState<User[]>([]);
  const [linkedUsersPagination, setLinkedUsersPagination] =
    useState<PaginationInfo>({
      page: 1,
      limit: 20,
      total: 0,
      pages: 0
    });
  const [loadingLinkedUsers, setLoadingLinkedUsers] = useState(true);
  const [linkedUsersEmailFilter, setLinkedUsersEmailFilter] = useState('');
  const [debouncedLinkedUsersEmailFilter, setDebouncedLinkedUsersEmailFilter] =
    useState('');

  // Action states
  const [addingUser, setAddingUser] = useState<string | null>(null);
  const [removingUser, setRemovingUser] = useState<string | null>(null);

  // Debounce email filter for all users
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEmailFilter(emailFilter);
      setAllUsersPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
    }, 500);

    return () => clearTimeout(timer);
  }, [emailFilter]);

  // Debounce email filter for linked users
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLinkedUsersEmailFilter(linkedUsersEmailFilter);
      setLinkedUsersPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
    }, 500);

    return () => clearTimeout(timer);
  }, [linkedUsersEmailFilter]);

  // Load all users with pagination and filtering
  const loadAllUsers = useCallback(async () => {
    try {
      setLoadingAllUsers(true);
      const params = new URLSearchParams({
        page: allUsersPagination.page.toString(),
        limit: allUsersPagination.limit.toString()
      });

      if (debouncedEmailFilter.trim()) {
        params.set('search', debouncedEmailFilter.trim());
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data = await response.json();

      // Exclude already linked users on client side
      const linkedUserIds = new Set(linkedUsers.map((u) => u.id));
      const filteredUsers = (data.users || []).filter(
        (user: User) => !linkedUserIds.has(user.id)
      );

      setAllUsers(filteredUsers);
      setAllUsersPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0
      }));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load users'
      );
    } finally {
      setLoadingAllUsers(false);
    }
  }, [
    allUsersPagination.page,
    allUsersPagination.limit,
    debouncedEmailFilter,
    linkedUsers
  ]);

  // Load linked users with pagination and filtering
  const loadLinkedUsers = useCallback(async () => {
    try {
      setLoadingLinkedUsers(true);
      const params = new URLSearchParams({
        page: linkedUsersPagination.page.toString(),
        limit: linkedUsersPagination.limit.toString()
      });

      if (debouncedLinkedUsersEmailFilter.trim()) {
        params.set('search', debouncedLinkedUsersEmailFilter.trim());
      }

      const response = await fetch(
        `/api/admin/users/${sellerId}/seller-users?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to load linked users');
      }

      const data = await response.json();
      setLinkedUsers(data.users || []);

      // Update pagination if API returns it, otherwise assume single page
      if (data.pagination) {
        setLinkedUsersPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load linked users'
      );
    } finally {
      setLoadingLinkedUsers(false);
    }
  }, [
    sellerId,
    linkedUsersPagination.page,
    linkedUsersPagination.limit,
    debouncedLinkedUsersEmailFilter
  ]);

  // Load data when filters/pagination change
  useEffect(() => {
    if (sellerId) {
      loadAllUsers();
    }
  }, [sellerId, loadAllUsers]);

  useEffect(() => {
    if (sellerId) {
      loadLinkedUsers();
    }
  }, [sellerId, loadLinkedUsers]);

  // Reload all users when linked users change (to update exclusion)
  useEffect(() => {
    if (sellerId) {
      loadAllUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedUsers.length]);

  const handleAddUser = async (userEmail: string) => {
    try {
      setAddingUser(userEmail);
      const response = await fetch(
        `/api/admin/users/${sellerId}/seller-users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: userEmail })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add user');
      }

      toast.success('User added successfully');
      await Promise.all([loadAllUsers(), loadLinkedUsers()]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to add user'
      );
    } finally {
      setAddingUser(null);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      setRemovingUser(userId);
      const response = await fetch(
        `/api/admin/users/${sellerId}/seller-users`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove user');
      }

      toast.success('User removed successfully');
      await Promise.all([loadAllUsers(), loadLinkedUsers()]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove user'
      );
    } finally {
      setRemovingUser(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <IconUsers className='h-5 w-5' />
          Seller Users Management
        </CardTitle>
        <CardDescription>
          Manage users linked to this seller account. Use arrows to add or
          remove users.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          {/* Left Table - All Users */}
          <div className='space-y-4 lg:col-span-1'>
            <div>
              <label className='mb-2 block text-sm font-medium'>
                All Users ({allUsersPagination.total})
              </label>
              <div className='relative'>
                <IconSearch className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  placeholder='Filter by email...'
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
            <div className='max-h-[600px] overflow-auto rounded-lg border'>
              <Table>
                <TableHeader className='bg-background sticky top-0'>
                  <TableRow>
                    <TableHead className='w-[50px]'></TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAllUsers ? (
                    <TableRow>
                      <TableCell colSpan={4} className='py-8 text-center'>
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : allUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className='text-muted-foreground py-8 text-center'
                      >
                        {emailFilter
                          ? 'No users found matching filter'
                          : 'No available users'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    allUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => handleAddUser(user.email)}
                            disabled={addingUser === user.email}
                            className='h-8 w-8 p-0'
                          >
                            {addingUser === user.email ? (
                              <div className='border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent' />
                            ) : (
                              <IconArrowRight className='h-4 w-4' />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className='font-medium'>
                          {user.email}
                        </TableCell>
                        <TableCell className='text-sm'>
                          {user.name || 'No name'}
                        </TableCell>
                        <TableCell>
                          <Badge variant='secondary' className='text-xs'>
                            {user.role}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination Controls for All Users */}
            {allUsersPagination.pages > 1 && (
              <div className='flex items-center justify-between'>
                <div className='text-muted-foreground text-sm'>
                  Page {allUsersPagination.page} of {allUsersPagination.pages}
                </div>
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() =>
                      setAllUsersPagination((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1)
                      }))
                    }
                    disabled={allUsersPagination.page === 1 || loadingAllUsers}
                  >
                    <IconChevronLeft className='h-4 w-4' />
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() =>
                      setAllUsersPagination((prev) => ({
                        ...prev,
                        page: Math.min(prev.pages, prev.page + 1)
                      }))
                    }
                    disabled={
                      allUsersPagination.page >= allUsersPagination.pages ||
                      loadingAllUsers
                    }
                  >
                    <IconChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Middle - Visual Separator (optional) */}
          <div className='hidden items-center justify-center lg:flex'>
            <div className='bg-border h-px w-full lg:h-full lg:w-px'></div>
          </div>

          {/* Right Table - Linked Users */}
          <div className='space-y-4 lg:col-span-1'>
            <div>
              <label className='mb-2 block text-sm font-medium'>
                Linked Users ({linkedUsersPagination.total})
              </label>
              <div className='relative'>
                <IconSearch className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  placeholder='Filter by email...'
                  value={linkedUsersEmailFilter}
                  onChange={(e) => setLinkedUsersEmailFilter(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
            <div className='max-h-[600px] overflow-auto rounded-lg border'>
              <Table>
                <TableHeader className='bg-background sticky top-0'>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className='w-[50px]'></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingLinkedUsers ? (
                    <TableRow>
                      <TableCell colSpan={5} className='py-8 text-center'>
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : linkedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className='text-muted-foreground py-8 text-center'
                      >
                        No users linked yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    linkedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className='font-medium'>
                          {user.email}
                        </TableCell>
                        <TableCell className='text-sm'>
                          {user.name || 'No name'}
                        </TableCell>
                        <TableCell>
                          <Badge variant='secondary' className='text-xs'>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-sm'>
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                          }).format(user.balance)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() => handleRemoveUser(user.id)}
                            disabled={removingUser === user.id}
                            className='h-8 w-8 p-0'
                          >
                            {removingUser === user.id ? (
                              <div className='border-destructive h-4 w-4 animate-spin rounded-full border-2 border-t-transparent' />
                            ) : (
                              <IconArrowLeft className='text-destructive h-4 w-4' />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination Controls for Linked Users */}
            {linkedUsersPagination.pages > 1 && (
              <div className='flex items-center justify-between'>
                <div className='text-muted-foreground text-sm'>
                  Page {linkedUsersPagination.page} of{' '}
                  {linkedUsersPagination.pages}
                </div>
                <div className='flex gap-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() =>
                      setLinkedUsersPagination((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1)
                      }))
                    }
                    disabled={
                      linkedUsersPagination.page === 1 || loadingLinkedUsers
                    }
                  >
                    <IconChevronLeft className='h-4 w-4' />
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() =>
                      setLinkedUsersPagination((prev) => ({
                        ...prev,
                        page: Math.min(prev.pages, prev.page + 1)
                      }))
                    }
                    disabled={
                      linkedUsersPagination.page >=
                        linkedUsersPagination.pages || loadingLinkedUsers
                    }
                  >
                    <IconChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
