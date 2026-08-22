import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const maplibreDist = join(projectRoot, 'node_modules', 'maplibre-gl', 'dist');
const outputDirectory = join(projectRoot, 'public', 'vendor', 'maplibre');
const workerFiles = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs'];

await mkdir(outputDirectory, { recursive: true });
await Promise.all(
  workerFiles.map((fileName) =>
    copyFile(join(maplibreDist, fileName), join(outputDirectory, fileName)),
  ),
);

console.log(`Prepared MapLibre worker assets in ${outputDirectory}`);
