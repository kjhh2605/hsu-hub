import { describe, expect, it } from 'vitest';
import config from '../../vite.config.js';

describe('local Kakao reverse proxy', () => {
  it('runs the operator app on port 5174 and identifies its API traffic', () => {
    expect(config.server.port).toBe(5174);
    expect(config.server.host).toBe('127.0.0.1');
    expect(config.server.proxy['/api']).toMatchObject({
      target: 'http://localhost:8080',
      headers: { 'X-HSU-Frontend': 'admin' },
    });
  });
});
