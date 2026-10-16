'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { type AdminUserResponse } from '@brasa-viva/contracts';
import {
  createAdminUserAccess,
  getAdminBranchOptions,
  getAdminUsers,
  updateAdminUserAccess
} from '../../../lib/admin-api';
import { AdminForm } from '../admin-form';
import { roleLabels, userStatusLabels } from '../admin-labels';
import {
  roles,
  ManagerLayout,
  toggleId,
  showError,
  type Notice,
  type BranchOption
} from './shared';

export function UserManager() {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [editing, setEditing] = useState<AdminUserResponse | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [newUser, setNewUser] = useState({
    email: '',
    fullName: '',
    role: 'OPERATOR' as (typeof roles)[number],
    branchIds: [] as string[]
  });
  const load = () =>
    Promise.all([getAdminUsers(page), getAdminBranchOptions()])
      .then(([userResult, branchResult]) => {
        setTotal(userResult.pagination.total);
        setUsers(userResult.items);
        setBranches(branchResult.items.map((branch) => ({ id: branch.id, name: branch.name })));
      })
      .catch(showError(setNotice));
  useEffect(() => {
    void load();
  }, [page]);
  async function save(): Promise<void> {
    if (!editing) return;
    try {
      await updateAdminUserAccess(editing.id, {
        status: editing.status,
        roles: editing.roles,
        branchIds: editing.branchIds
      });
      setNotice({ kind: 'success', message: 'Acceso actualizado.' });
      setEditing(null);
      load();
    } catch (reason) {
      showError(setNotice)(reason);
    }
  }
  async function create(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    try {
      await createAdminUserAccess({
        email: newUser.email,
        fullName: newUser.fullName,
        status: 'ACTIVE',
        roles: [newUser.role],
        branchIds: newUser.branchIds
      });
      setNewUser({ email: '', fullName: '', role: 'OPERATOR', branchIds: [] });
      setNotice({
        kind: 'success',
        message: 'Acceso creado. La cuenta debe existir en Supabase Auth con el mismo correo.'
      });
      load();
    } catch (reason) {
      showError(setNotice)(reason);
    }
  }
  return (
    <ManagerLayout
      title="Usuarios"
      description="Preautoriza cuentas de Supabase Auth, asigna roles y limita su alcance por sucursal."
      notice={notice}
      pagination={{ page, total, setPage }}
      onRefresh={load}
    >
      <AdminForm className="admin-form-grid" onSubmit={create}>
        <label>
          Nombre completo
          <input
            value={newUser.fullName}
            onChange={(event) => setNewUser({ ...newUser, fullName: event.target.value })}
            required
          />
        </label>
        <label>
          Correo de Supabase Auth
          <input
            type="email"
            value={newUser.email}
            onChange={(event) => setNewUser({ ...newUser, email: event.target.value })}
            required
          />
        </label>
        <label>
          Rol inicial
          <select
            value={newUser.role}
            onChange={(event) =>
              setNewUser({ ...newUser, role: event.target.value as (typeof roles)[number] })
            }
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role]}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Sucursales asignadas</legend>
          <p>
            Los encargados y operadores necesitan una sucursal asignada para gestionar sus pedidos.
          </p>
          <div className="admin-check-list">
            {branches.map((branch) => (
              <label key={branch.id}>
                <input
                  type="checkbox"
                  checked={newUser.branchIds.includes(branch.id)}
                  onChange={() =>
                    setNewUser({ ...newUser, branchIds: toggleId(newUser.branchIds, branch.id) })
                  }
                />{' '}
                {branch.name}
              </label>
            ))}
          </div>
        </fieldset>
        <button className="admin-primary-button" type="submit">
          Preautorizar usuario
        </button>
      </AdminForm>
      <label className="admin-list-search">
        Buscar en esta página
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Escribe un nombre…"
        />
      </label>
      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Roles</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users
                .filter((entry) =>
                  entry.fullName.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))
                )
                .map((user) => (
                  <tr key={user.id}>
                    <td data-label="Usuario">
                      {user.fullName}
                      <small>{user.email}</small>
                    </td>
                    <td data-label="Roles">
                      {user.roles.map((role) => roleLabels[role]).join(', ')}
                    </td>
                    <td data-label="Estado">{userStatusLabels[user.status]}</td>
                    <td data-label="Acciones">
                      <button
                        className="admin-secondary-button"
                        type="button"
                        onClick={() =>
                          setEditing({
                            ...user,
                            roles: [...user.roles],
                            branchIds: [...user.branchIds]
                          })
                        }
                      >
                        Editar acceso
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      {editing ? (
        <section className="admin-panel">
          <h2>Acceso de {editing.fullName}</h2>
          <AdminForm
            className="admin-form-grid"
            onSubmit={async (event) => {
              event.preventDefault();
              await save();
            }}
          >
            <label>
              Estado
              <select
                value={editing.status}
                onChange={(event) =>
                  setEditing({
                    ...editing,
                    status: event.target.value as AdminUserResponse['status']
                  })
                }
              >
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
                <option value="SUSPENDED">Suspendido</option>
              </select>
            </label>
            <fieldset>
              <legend>Roles</legend>
              <div className="admin-check-list">
                {roles.map((role) => (
                  <label key={role}>
                    <input
                      type="checkbox"
                      checked={editing.roles.includes(role)}
                      onChange={() =>
                        setEditing({
                          ...editing,
                          roles: toggleId(editing.roles, role) as AdminUserResponse['roles']
                        })
                      }
                    />{' '}
                    {roleLabels[role]}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Sucursales asignadas</legend>
              <div className="admin-check-list">
                {branches.map((branch) => (
                  <label key={branch.id}>
                    <input
                      type="checkbox"
                      checked={editing.branchIds.includes(branch.id)}
                      onChange={() =>
                        setEditing({
                          ...editing,
                          branchIds: toggleId(editing.branchIds, branch.id)
                        })
                      }
                    />{' '}
                    {branch.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="admin-action-row">
              <button className="admin-primary-button" type="submit">
                Guardar acceso
              </button>
              <button
                className="admin-secondary-button"
                type="button"
                onClick={() => setEditing(null)}
              >
                Cancelar
              </button>
            </div>
          </AdminForm>
        </section>
      ) : null}
    </ManagerLayout>
  );
}
