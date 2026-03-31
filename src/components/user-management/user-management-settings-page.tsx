'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  IconChevronDown,
  IconEye,
  IconEyeOff,
  IconLoader2,
  IconLock,
  IconPhoto
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';

const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'ES', label: 'Spain' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'IT', label: 'Italy' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'IN', label: 'India' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'JP', label: 'Japan' }
] as const;

function splitName(full: string | null | undefined) {
  const t = (full ?? '').trim();
  if (!t) return { first: '', last: '' };
  const i = t.indexOf(' ');
  if (i === -1) return { first: t, last: '' };
  return { first: t.slice(0, i), last: t.slice(i + 1).trim() };
}

function fmtDob(iso: string | Date | null | undefined) {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

type ProfileUser = {
  name: string | null;
  email: string;
  image: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  gender: string | null;
  hasPassword: boolean;
};

export function UserManagementSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<ProfileUser | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const [addrOpen, setAddrOpen] = useState(true);
  const [secOpen, setSecOpen] = useState(true);
  const [editingPw, setEditingPw] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState<Record<string, boolean>>({});
  const [savingPw, setSavingPw] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/profile?balanceType=REAL');
      if (!res.ok) {
        toast.error('Could not load profile');
        return;
      }
      const data = (await res.json()) as { user: ProfileUser };
      const u = data.user;
      setUser(u);
      const { first, last } = splitName(u.name);
      setFirstName(first);
      setLastName(last);
      setPhone(u.phone ?? '');
      setDob(fmtDob(u.dateOfBirth));
      setGender(u.gender ?? '');
      setAddress(u.address ?? '');
      setPostalCode(u.postalCode ?? '');
      setCity(u.city ?? '');
      setCountry(u.country ?? '');
      setImagePreview(null);
      setImageFile(null);
    } catch {
      toast.error('Could not load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const onPickImage = (f: File | null) => {
    setImageFile(f);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(f ? URL.createObjectURL(f) : null);
  };

  const saveProfile = async () => {
    try {
      setSavingProfile(true);
      const fd = new FormData();
      fd.set('section', 'profile');
      fd.set('firstName', firstName);
      fd.set('lastName', lastName);
      fd.set('phone', phone);
      fd.set('dateOfBirth', dob);
      fd.set('gender', gender);
      if (imageFile) fd.set('image', imageFile);
      const res = await fetch('/api/user/profile', { method: 'PATCH', body: fd });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Save failed');
        return;
      }
      toast.success('Profile saved');
      void loadProfile();
    } catch {
      toast.error('Save failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const saveAddress = async () => {
    try {
      setSavingAddress(true);
      const fd = new FormData();
      fd.set('section', 'address');
      fd.set('address', address);
      fd.set('postalCode', postalCode);
      fd.set('city', city);
      fd.set('country', country);
      const res = await fetch('/api/user/profile', { method: 'PATCH', body: fd });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Save failed');
        return;
      }
      toast.success('Address saved');
      void loadProfile();
    } catch {
      toast.error('Save failed');
    } finally {
      setSavingAddress(false);
    }
  };

  const savePassword = async () => {
    if (newPw.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPw !== confirmPw) {
      toast.error('New passwords do not match');
      return;
    }
    if (user?.hasPassword && !currentPw) {
      toast.error('Enter your current password');
      return;
    }
    try {
      setSavingPw(true);
      const res = await fetch('/api/user/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPw || undefined,
          newPassword: newPw
        })
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? 'Could not update password');
        return;
      }
      toast.success('Password updated');
      setEditingPw(false);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      void loadProfile();
    } catch {
      toast.error('Could not update password');
    } finally {
      setSavingPw(false);
    }
  };

  const avatarSrc = useMemo(
    () => imagePreview ?? user?.image ?? undefined,
    [imagePreview, user?.image]
  );

  const togglePw = (key: string) => {
    setShowPw((s) => ({ ...s, [key]: !s[key] }));
  };

  if (loading && !user) {
    return (
      <div className="flex flex-1 items-center justify-center gap-2 p-12 text-[var(--trade-text-muted)]">
        <IconLoader2 className="size-6 animate-spin" />
        Loading settings…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <header className="shrink-0 border-b border-[var(--trade-border)] bg-[var(--trade-panel)] px-6 py-4">
        <h1 className="text-base font-semibold text-[var(--trade-text)]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--trade-text-muted)]">
          Manage your profile, address, and security settings.
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="mx-auto w-full max-w-3xl space-y-4">
              <section className="rounded-xl border border-[var(--trade-border)] bg-[var(--trade-panel)] p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-[var(--trade-text)]">
                  Profile
                </h2>
                <p className="mt-1 text-xs text-[var(--trade-text-muted)]">
                  Your name and contact details as they appear on your account.
                </p>

                <div className="mt-6 flex flex-col gap-6 sm:flex-row">
                  <div className="flex flex-col items-start gap-2">
                    <div className="relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)]">
                      {avatarSrc ? (
                        <Image
                          src={avatarSrc}
                          alt=""
                          width={112}
                          height={112}
                          className="size-full object-cover"
                          unoptimized={
                            avatarSrc.startsWith('blob:') ||
                            avatarSrc.startsWith('data:')
                          }
                        />
                      ) : (
                        <IconPhoto
                          className="size-10 text-[var(--trade-text-muted)]"
                          stroke={1.25}
                        />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      id="settings-avatar"
                      onChange={(e) =>
                        onPickImage(e.target.files?.[0] ?? null)
                      }
                    />
                    <label
                      htmlFor="settings-avatar"
                      className="cursor-pointer rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2 text-xs font-medium text-[var(--trade-text)] hover:bg-[var(--trade-border)]/40"
                    >
                      Upload photo
                    </label>
                  </div>

                  <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="fn"
                        className="text-xs font-medium text-[var(--trade-text-muted)]"
                      >
                        First name
                      </label>
                      <input
                        id="fn"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2 text-sm text-[var(--trade-text)] outline-none focus:border-[var(--trade-accent-blue)] focus:ring-2 focus:ring-[var(--trade-accent-blue)]/25"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="ln"
                        className="text-xs font-medium text-[var(--trade-text-muted)]"
                      >
                        Last name
                      </label>
                      <input
                        id="ln"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2 text-sm text-[var(--trade-text)] outline-none focus:border-[var(--trade-accent-blue)] focus:ring-2 focus:ring-[var(--trade-accent-blue)]/25"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="em"
                        className="text-xs font-medium text-[var(--trade-text-muted)]"
                      >
                        Email
                      </label>
                      <input
                        id="em"
                        readOnly
                        value={user?.email ?? ''}
                        className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-[var(--trade-border)] bg-[var(--trade-border)]/30 px-3 py-2 text-sm text-[var(--trade-text-muted)]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="ph"
                        className="text-xs font-medium text-[var(--trade-text-muted)]"
                      >
                        Phone
                      </label>
                      <input
                        id="ph"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2 text-sm text-[var(--trade-text)] outline-none focus:border-[var(--trade-accent-blue)] focus:ring-2 focus:ring-[var(--trade-accent-blue)]/25"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="dob"
                        className="text-xs font-medium text-[var(--trade-text-muted)]"
                      >
                        Date of birth
                      </label>
                      <input
                        id="dob"
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="mt-1.5 w-full rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2 text-sm text-[var(--trade-text)] outline-none focus:border-[var(--trade-accent-blue)] focus:ring-2 focus:ring-[var(--trade-accent-blue)]/25"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-[var(--trade-text-muted)]">
                        Gender
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {['male', 'female', 'other'].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGender(g)}
                            className={cn(
                              'rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors',
                              gender === g
                                ? 'border-[var(--trade-accent-blue)] bg-[var(--trade-accent-blue)]/15 text-[var(--trade-accent-blue)]'
                                : 'border-[var(--trade-border)] bg-[var(--trade-dark)] text-[var(--trade-text)] hover:border-[var(--trade-text-muted)]/40'
                            )}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void saveProfile()}
                    disabled={savingProfile}
                    className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg bg-[#45a29e] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {savingProfile ? (
                      <IconLoader2 className="size-4 animate-spin" />
                    ) : null}
                    Save
                  </button>
                </div>
              </section>

              <Collapsible open={addrOpen} onOpenChange={setAddrOpen}>
                <div className="rounded-xl border border-[var(--trade-border)] bg-[var(--trade-panel)] shadow-sm">
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-6 py-4 text-left">
                    <span className="text-sm font-semibold text-[var(--trade-text)]">
                      Address
                    </span>
                    <IconChevronDown
                      className={cn(
                        'size-5 text-[var(--trade-text-muted)] transition-transform',
                        addrOpen && 'rotate-180'
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-4 border-t border-[var(--trade-border)] px-6 py-4">
                      <div>
                        <label
                          htmlFor="addr1"
                          className="text-xs font-medium text-[var(--trade-text-muted)]"
                        >
                          Full address
                        </label>
                        <textarea
                          id="addr1"
                          rows={3}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="mt-1.5 w-full rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2 text-sm text-[var(--trade-text)] outline-none focus:border-[var(--trade-accent-blue)] focus:ring-2 focus:ring-[var(--trade-accent-blue)]/25"
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="ct"
                            className="text-xs font-medium text-[var(--trade-text-muted)]"
                          >
                            Country
                          </label>
                          <select
                            id="ct"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="mt-1.5 w-full rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2 text-sm text-[var(--trade-text)] outline-none focus:border-[var(--trade-accent-blue)] focus:ring-2 focus:ring-[var(--trade-accent-blue)]/25"
                          >
                            <option value="">Select country</option>
                            {COUNTRIES.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor="city"
                            className="text-xs font-medium text-[var(--trade-text-muted)]"
                          >
                            City
                          </label>
                          <input
                            id="city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="mt-1.5 w-full rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2 text-sm text-[var(--trade-text)] outline-none focus:border-[var(--trade-accent-blue)] focus:ring-2 focus:ring-[var(--trade-accent-blue)]/25"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label
                            htmlFor="zip"
                            className="text-xs font-medium text-[var(--trade-text-muted)]"
                          >
                            Postal code
                          </label>
                          <input
                            id="zip"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            className="mt-1.5 w-full rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-3 py-2 text-sm text-[var(--trade-text)] outline-none focus:border-[var(--trade-accent-blue)] focus:ring-2 focus:ring-[var(--trade-accent-blue)]/25"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => void saveAddress()}
                          disabled={savingAddress}
                          className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg bg-[#45a29e] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                        >
                          {savingAddress ? (
                            <IconLoader2 className="size-4 animate-spin" />
                          ) : null}
                          Save
                        </button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              <Collapsible open={secOpen} onOpenChange={setSecOpen}>
                <div className="rounded-xl border border-[var(--trade-border)] bg-[var(--trade-panel)] shadow-sm">
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-6 py-4 text-left">
                    <span className="text-sm font-semibold text-[var(--trade-text)]">
                      Privacy and security
                    </span>
                    <IconChevronDown
                      className={cn(
                        'size-5 text-[var(--trade-text-muted)] transition-transform',
                        secOpen && 'rotate-180'
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-4 border-t border-[var(--trade-border)] px-6 py-4">
                      <div className="flex gap-3 rounded-lg border border-[var(--trade-green)]/40 bg-[var(--trade-green)]/10 px-4 py-3 text-sm text-[var(--trade-text)]">
                        <IconLock
                          className="mt-0.5 size-5 shrink-0 text-[var(--trade-green)]"
                          stroke={1.75}
                        />
                        <p>
                          Two-factor authentication is enforced when your
                          account uses email verification at sign-in. Keep your
                          email secure to protect your account.
                        </p>
                      </div>

                      {!editingPw ? (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-medium text-[var(--trade-text-muted)]">
                              Password
                            </p>
                            <p className="mt-1 font-mono text-sm text-[var(--trade-text)]">
                              ••••••••••••
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingPw(true)}
                            className="text-sm font-medium text-[var(--trade-accent-blue)] hover:underline"
                          >
                            Edit password
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3 max-w-md">
                          {user?.hasPassword ? (
                            <PwField
                              id="cur"
                              label="Current password"
                              value={currentPw}
                              onChange={setCurrentPw}
                              show={showPw.cur}
                              onToggle={() => togglePw('cur')}
                            />
                          ) : null}
                          <PwField
                            id="nw"
                            label="New password"
                            value={newPw}
                            onChange={setNewPw}
                            show={showPw.nw}
                            onToggle={() => togglePw('nw')}
                          />
                          <PwField
                            id="cf"
                            label="Confirm new password"
                            value={confirmPw}
                            onChange={setConfirmPw}
                            show={showPw.cf}
                            onToggle={() => togglePw('cf')}
                          />
                          <div className="flex flex-wrap gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPw(false);
                                setCurrentPw('');
                                setNewPw('');
                                setConfirmPw('');
                              }}
                              className="rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] px-4 py-2 text-sm font-medium text-[var(--trade-text)] hover:bg-[var(--trade-border)]/40"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => void savePassword()}
                              disabled={savingPw}
                              className="inline-flex items-center gap-2 rounded-lg bg-[#45a29e] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                            >
                              {savingPw ? (
                                <IconLoader2 className="size-4 animate-spin" />
                              ) : null}
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
        </div>
      </div>
    </div>
  );
}

function PwField({
  id,
  label,
  value,
  onChange,
  show,
  onToggle
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs font-medium text-[var(--trade-text-muted)]"
      >
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={
            id === 'cur' ? 'current-password' : 'new-password'
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-[var(--trade-border)] bg-[var(--trade-dark)] py-2 pl-3 pr-10 text-sm text-[var(--trade-text)] outline-none focus:border-[var(--trade-accent-blue)] focus:ring-2 focus:ring-[var(--trade-accent-blue)]/25"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--trade-text-muted)] hover:text-[var(--trade-text)]"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            <IconEyeOff className="size-4" />
          ) : (
            <IconEye className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}
