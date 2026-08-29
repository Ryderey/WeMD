import { join } from 'node:path';

export function getUploadsDirectory(): string {
  return process.env.UPLOADS_DIR ?? join(__dirname, '..', 'uploads');
}
