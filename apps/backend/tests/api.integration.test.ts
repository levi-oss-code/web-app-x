import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

let app: import('express').Express;
let dbPath: string;
let db: import('node:sqlite').DatabaseSync;

describe('API integration', () => {
  beforeAll(async () => {
    dbPath = path.join(os.tmpdir(), `web-app-x-test-${Date.now()}.sqlite`);
    process.env.NODE_ENV = 'test';
    process.env.SQLITE_DB_PATH = dbPath;
    process.env.JWT_SECRET = 'test-jwt-secret-12345';
    process.env.FRONTEND_ORIGIN = 'http://localhost:5173';

    const appModule = await import('../src/app.js');
    app = appModule.createApp();

    const dbModule = await import('../src/lib/db.js');
    db = dbModule.db;
  }, 30_000);

  beforeEach(async () => {
    const dbModule = await import('../src/lib/db.js');
    dbModule.db.prepare('delete from generation_tasks').run();
    dbModule.db.prepare('delete from users').run();
  });

  afterAll(() => {
    db.close();
    if (fs.existsSync(dbPath)) {
      fs.rmSync(dbPath, { force: true });
    }
  });

  it('supports signup, create generation, list, and delete history', async () => {
    const signupResponse = await request(app).post('/api/auth/signup').send({
      email: 'member@example.com',
      password: 'password123',
    });

    expect(signupResponse.status).toBe(201);
    const cookie = signupResponse.headers['set-cookie'];
    expect(cookie).toBeTruthy();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            choices: [{ message: { content: 'AI output text' } }],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    );

    const createResponse = await request(app).post('/api/generations').set('Cookie', cookie).send({
      original_input: 'Explain testability briefly',
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.generation.status).toBe('completed');
    expect(createResponse.body.data.generation.ai_result).toBe('AI output text');

    const generationId = String(createResponse.body.data.generation.id);

    const listResponse = await request(app).get('/api/generations').set('Cookie', cookie);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.generations).toHaveLength(1);
    expect(listResponse.body.data.generations[0].id).toBe(generationId);

    const deleteResponse = await request(app).delete(`/api/generations/${generationId}`).set('Cookie', cookie);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data.deleted).toBe(true);

    vi.unstubAllGlobals();
  });

  it('denies generation list without auth', async () => {
    const response = await request(app).get('/api/generations');
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
