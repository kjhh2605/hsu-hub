import { describe, expect, it } from 'vitest';
import config from '../../vite.config.js';

describe('local Kakao reverse proxy', () => {
  it('runs the applicant app on port 5173 and identifies its API traffic', () => {
    expect(config.server.port).toBe(5173);
    expect(config.server.proxy['/api']).toMatchObject({
      target: 'http://localhost:8080',
      headers: { 'X-HSU-Frontend': 'applicant' },
    });
  });
});
