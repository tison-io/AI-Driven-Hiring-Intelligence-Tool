import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
  @Get()
  getHello(@Res() res: Response): void {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <h1>🚀 Hiring Intelligence API is running!</h1>
      <p>Status: <strong>Active</strong></p>
      <p><a href="/api/docs">📚 API Documentation</a></p>
    `);
  }
}