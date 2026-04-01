import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { errorHandler, APIError } from '../middleware/errorHandler';

describe('Backend Error Handler Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      method: 'GET',
      originalUrl: '/api/test',
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    // Clear console.error to keep test output clean
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should handle APIError with custom status code', () => {
    const error = new APIError('Resource not found', 404);
    
    errorHandler(error as any, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'fail',
        message: 'Resource not found',
      })
    );
  });

  it('should handle generic Error with 500 status code', () => {
    const error = new Error('Database connection failed');
    
    errorHandler(error as any, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: 'Database connection failed',
      })
    );
  });

  it('should include stack trace in development mode', () => {
    process.env.NODE_ENV = 'development';
    const error = new Error('Dev specific error');
    
    errorHandler(error as any, req as Request, res as Response, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        stack: expect.any(String),
      })
    );
  });

  it('should NOT include stack trace in production mode', () => {
    process.env.NODE_ENV = 'production';
    const error = new Error('Prod specific error');
    
    errorHandler(error as any, req as Request, res as Response, next);

    const jsonArg = (res.json as any).mock.calls[0][0];
    expect(jsonArg.stack).toBeUndefined();
  });
});
