import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { env } from '../config/env.js';

const absoluteDbPath = path.isAbsolute(env.SQLITE_DB_PATH)
  ? env.SQLITE_DB_PATH
  : path.resolve(process.cwd(), env.SQLITE_DB_PATH);

fs.mkdirSync(path.dirname(absoluteDbPath), { recursive: true });

export const db = new DatabaseSync(absoluteDbPath);

db.exec(`
  create table if not exists users (
    id text primary key,
    email text not null unique,
    password_hash text not null,
    created_at text not null
  );

  create table if not exists generation_tasks (
    id text primary key,
    user_id text not null references users(id) on delete cascade,
    original_input text not null,
    ai_result text,
    status text not null check (status in ('pending', 'completed', 'failed')),
    created_at text not null
  );

  create index if not exists generation_tasks_user_created_idx
    on generation_tasks (user_id, created_at desc);
`);
