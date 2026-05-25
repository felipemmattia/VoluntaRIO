// Funções de consulta e manipulação de dados para a entidade de usuários no banco de dados.
import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { InsertUser } from "@db/schema";
import { getDb } from "./connection";

// Busca um usuário a partir do endereço de e-mail fornecido
export async function findUserByEmail(email: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  return rows.at(0);
}

// Busca um usuário pelo ID, retornando apenas informações seguras (sem o hash de senha)
export async function findUserById(id: number) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  const user = rows.at(0);
  if (user) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
  return undefined;
}

// Busca um usuário pelo ID mantendo a informação do hash de senha (útil para autenticação)
export async function findUserByIdWithPassword(id: number) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  return rows.at(0);
}

// Cadastra um novo usuário no banco de dados
export async function createUser(data: InsertUser) {
  const values = { ...data };

  if (values.role === undefined) {
    values.role = "user";
  }

  const result = await getDb()
    .insert(schema.users)
    .values(values);

  const insertId = result[0]?.insertId;
  if (insertId) {
    return findUserByIdWithPassword(insertId);
  }

  const rows = await getDb()
    .select()
    .from(schema.users)
    .orderBy(schema.users.id)
    .limit(1);
  return rows.at(0);
}

// Atualiza os dados cadastrais de um usuário específico
export async function updateUser(id: number, data: Partial<InsertUser>) {
  await getDb()
    .update(schema.users)
    .set(data)
    .where(eq(schema.users.id, id));
}

// Recupera a listagem completa de usuários do sistema, omitindo senhas
export async function getAllUsers() {
  const rows = await getDb()
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      avatar: schema.users.avatar,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
      lastSignInAt: schema.users.lastSignInAt,
    })
    .from(schema.users);
  return rows;
}

// Reseta o papel (role) de um usuário para voluntário comum
export async function suspendUser(id: number) {
  await getDb()
    .update(schema.users)
    .set({ role: "user" })
    .where(eq(schema.users.id, id));
}

// Remove permanentemente o cadastro de um usuário do banco de dados
export async function deleteUser(id: number) {
  await getDb()
    .delete(schema.users)
    .where(eq(schema.users.id, id));
}

