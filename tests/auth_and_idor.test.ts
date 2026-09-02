import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server';

describe('Security Remediation & Integration Test Suite', () => {
  let userAToken: string;
  let userACookie: string;
  let userADeckId: string;
  let userACardId: string;

  let userBCookie: string;

  it('1. Rejects unauthenticated requests with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/tutor')
      .send({ message: 'Explain limits', subject: 'Mathematics' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Authentication required');
  });

  it('2. Registers User A and returns HttpOnly session cookies', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `testuser_a_${Date.now()}@studygenie.ai`,
        password: 'securePassword123',
        name: 'User A'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    userACookie = cookies.find((c: string) => c.startsWith('studygenie_token='));
    expect(userACookie).toBeDefined();
    expect(userACookie).toContain('HttpOnly');
  });

  it('3. Allows User A to access protected /api/tutor endpoint with valid cookie', async () => {
    const res = await request(app)
      .post('/api/tutor')
      .set('Cookie', [userACookie])
      .send({ message: '2+5', subject: 'Mathematics' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('4. Allows User A to create a flashcard deck', async () => {
    const res = await request(app)
      .post('/api/db/decks')
      .set('Cookie', [userACookie])
      .send({
        title: 'Calculus Test Deck',
        subject: 'Mathematics',
        cards: [
          { front: 'Derivative of x^2', back: '2x' }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    userADeckId = res.body.data.id;
    userACardId = res.body.data.cards[0].id;
  });

  it('5. Enforces IDOR protection: User B gets 404 when probing User A card', async () => {
    // Register User B
    const regB = await request(app)
      .post('/api/auth/register')
      .send({
        email: `testuser_b_${Date.now()}@studygenie.ai`,
        password: 'securePassword123',
        name: 'User B'
      });

    userBCookie = regB.headers['set-cookie'].find((c: string) => c.startsWith('studygenie_token='));

    // User B attempts to mutate User A's card
    const res = await request(app)
      .put(`/api/db/decks/${userADeckId}/cards/${userACardId}/sm2`)
      .set('Cookie', [userBCookie])
      .send({
        repetition: 2,
        easeFactor: 2.6,
        interval: 3,
        nextReviewDate: new Date().toISOString(),
        mastered: true
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
