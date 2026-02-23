'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useTemplates, useCreateTemplate, useUpdateTemplate } from '@/app/(frontend)/hooks'
import type { TemplateItem, RoleDefinition } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const DURATION_UNITS = ['hours', 'days', 'weeks', 'months'] as const

const DEFAULT_ROLES: RoleDefinition[] = [
  { name: 'owner', label: 'Owner' },
  { name: 'renter', label: 'Renter' },
  { name: 'validator', label: 'Validator' },
  { name: 'witness', label: 'Witness' },
]

type FormState = {
  name: string
  description: string
  price: string
  currency: string
  duration: string
  durationUnit: string
  deposit: string
  negotiable: boolean
  roles: RoleDefinition[]
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  price: '',
  currency: 'ETH',
  duration: '',
  durationUnit: 'days',
  deposit: '',
  negotiable: false,
  roles: [...DEFAULT_ROLES],
}

function formFromTemplate(t: TemplateItem): FormState {
  return {
    name: t.name,
    description: t.description ?? '',
    price: String(t.terms.price),
    currency: t.terms.currency ?? 'ETH',
    duration: String(t.terms.duration),
    durationUnit: t.terms.durationUnit,
    deposit: String(t.terms.deposit),
    negotiable: t.terms.negotiable ?? false,
    roles: t.roles?.length ? t.roles.map((r) => ({ name: r.name, label: r.label })) : [...DEFAULT_ROLES],
  }
}

function RolesEditor({
  roles,
  onChange,
}: {
  roles: RoleDefinition[]
  onChange: (roles: RoleDefinition[]) => void
}) {
  const addRole = () => onChange([...roles, { name: '', label: '' }])
  const removeRole = (idx: number) => onChange(roles.filter((_, i) => i !== idx))
  const updateRole = (idx: number, field: keyof RoleDefinition, value: string) => {
    const updated = roles.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      <Label>Roles</Label>
      {roles.map((r, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            value={r.name}
            onChange={(e) => updateRole(idx, 'name', e.target.value)}
            placeholder="role key (e.g. validator)"
            className="flex-1"
          />
          <Input
            value={r.label}
            onChange={(e) => updateRole(idx, 'label', e.target.value)}
            placeholder="Display label"
            className="flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeRole(idx)}
            className="shrink-0 text-destructive"
          >
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addRole}>
        Add Role
      </Button>
    </div>
  )
}

function TemplateForm({
  form,
  setForm,
  error,
  isPending,
  onSubmit,
  submitLabel,
}: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  error: string | null
  isPending: boolean
  onSubmit: () => void
  submitLabel: string
}) {
  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Standard Rental" />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional" />
        </div>
        <div className="space-y-2">
          <Label>Price</Label>
          <Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0.1" />
        </div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} placeholder="ETH" />
        </div>
        <div className="space-y-2">
          <Label>Duration</Label>
          <Input type="number" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} placeholder="7" />
        </div>
        <div className="space-y-2">
          <Label>Duration Unit</Label>
          <select
            value={form.durationUnit}
            onChange={(e) => setForm((f) => ({ ...f, durationUnit: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            {DURATION_UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Deposit</Label>
          <Input type="number" value={form.deposit} onChange={(e) => setForm((f) => ({ ...f, deposit: e.target.value }))} placeholder="0.05" />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            checked={form.negotiable}
            onChange={(e) => setForm((f) => ({ ...f, negotiable: e.target.checked }))}
            className="h-4 w-4 rounded border-input"
          />
          <Label>Negotiable</Label>
        </div>
      </div>
      <RolesEditor
        roles={form.roles}
        onChange={(roles) => setForm((f) => ({ ...f, roles }))}
      />
      <Button onClick={onSubmit} disabled={isPending || !form.name.trim()}>
        {isPending ? 'Saving...' : submitLabel}
      </Button>
    </div>
  )
}

export default function TemplatesPage() {
  const { address, isConnected } = useAccount()
  const { data: templates = [], isLoading } = useTemplates()
  const createMutation = useCreateTemplate()
  const updateMutation = useUpdateTemplate()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<FormState>({ ...EMPTY_FORM })
  const [editForm, setEditForm] = useState<FormState>({ ...EMPTY_FORM })

  const handleCreate = async () => {
    if (!address || !createForm.name.trim() || !createForm.price || !createForm.duration || !createForm.deposit) return
    const validRoles = createForm.roles.filter((r) => r.name.trim() && r.label.trim())
    try {
      await createMutation.mutateAsync({
        name: createForm.name.trim(),
        type: 'rental',
        description: createForm.description.trim() || undefined,
        creator: address,
        roles: validRoles.length ? validRoles : undefined,
        terms: {
          price: Number(createForm.price),
          currency: createForm.currency || 'ETH',
          duration: Number(createForm.duration),
          durationUnit: createForm.durationUnit,
          deposit: Number(createForm.deposit),
          negotiable: createForm.negotiable,
        },
      })
      setCreateForm({ ...EMPTY_FORM })
      setShowForm(false)
    } catch {
      // error surfaced via createMutation.error
    }
  }

  const handleUpdate = async () => {
    if (!editingId || !editForm.name.trim()) return
    const validRoles = editForm.roles.filter((r) => r.name.trim() && r.label.trim())
    try {
      await updateMutation.mutateAsync({
        id: editingId,
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        roles: validRoles.length ? validRoles : undefined,
        terms: {
          price: Number(editForm.price),
          currency: editForm.currency || 'ETH',
          duration: Number(editForm.duration),
          durationUnit: editForm.durationUnit,
          deposit: Number(editForm.deposit),
          negotiable: editForm.negotiable,
        },
      })
      setEditingId(null)
    } catch {
      // error surfaced via updateMutation.error
    }
  }

  const startEdit = (t: TemplateItem) => {
    setEditingId(t.id)
    setEditForm(formFromTemplate(t))
    setShowForm(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const createError = createMutation.error instanceof Error ? createMutation.error.message : createMutation.error ? 'Create failed' : null
  const updateError = updateMutation.error instanceof Error ? updateMutation.error.message : updateMutation.error ? 'Update failed' : null

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <nav className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:underline">Home</Link>
              <span>/</span>
              <span className="font-medium text-foreground">Templates</span>
            </nav>
            <h1 className="text-xl font-semibold tracking-tight">Rental Templates</h1>
            <p className="text-sm text-muted-foreground">Reusable service blueprints for rental flows</p>
          </div>
          <ConnectButton />
        </header>

        {isConnected && (
          <div className="flex justify-end">
            <Button
              variant={showForm ? 'secondary' : 'default'}
              onClick={() => { setShowForm(!showForm); setEditingId(null) }}
            >
              {showForm ? 'Cancel' : 'Create Template'}
            </Button>
          </div>
        )}

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>New Template</CardTitle>
              <CardDescription>Define terms and roles for a rental template</CardDescription>
            </CardHeader>
            <CardContent>
              <TemplateForm
                form={createForm}
                setForm={setCreateForm}
                error={createError}
                isPending={createMutation.isPending}
                onSubmit={handleCreate}
                submitLabel="Create"
              />
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
        ) : templates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No templates yet. Create one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {templates.map((t) => (
              <li key={t.id}>
                <Card>
                  {editingId === t.id ? (
                    <>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base">Edit Template</CardTitle>
                        <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
                      </CardHeader>
                      <CardContent>
                        <TemplateForm
                          form={editForm}
                          setForm={setEditForm}
                          error={updateError}
                          isPending={updateMutation.isPending}
                          onSubmit={handleUpdate}
                          submitLabel="Save"
                        />
                      </CardContent>
                    </>
                  ) : (
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{t.name}</p>
                        {t.description && (
                          <p className="text-sm text-muted-foreground">{t.description}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {t.terms.price} {t.terms.currency ?? 'ETH'} / {t.terms.duration} {t.terms.durationUnit}
                          {' '}· Deposit: {t.terms.deposit} {t.terms.currency ?? 'ETH'}
                          {t.terms.negotiable && ' · Negotiable'}
                        </p>
                        {t.roles?.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Roles: {t.roles.map((r) => r.label).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                        {isConnected && address?.toLowerCase() === t.creator.toLowerCase() && (
                          <Button variant="outline" size="sm" onClick={() => startEdit(t)}>
                            Edit
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
