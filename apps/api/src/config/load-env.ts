import * as fs from 'fs';
import * as path from 'path';

let loaded = false;

export function loadEnv(): void {
  if (loaded) return;
  loaded = true;

  if (typeof process.loadEnvFile !== 'function') return;

  const candidatePaths = [
    path.resolve(process.cwd(), 'apps', 'api', '.env'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '..', '..', '.env'),
    path.resolve(__dirname, '..', '.env'),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        process.loadEnvFile(p);
        break;
      } catch {
        // ignore load errors
      }
    }
  }
}

loadEnv();
