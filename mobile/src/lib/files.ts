import { Directory, File, Paths } from "expo-file-system";

function floorPlansDir(): Directory {
  const dir = new Directory(Paths.document, "floorplans");
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

const extOf = (mimeType?: string) => (mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg");

/**
 * Floor-plan photos picked from the gallery/camera live in a temporary,
 * OS-managed cache that can be cleared at any time. This copies the image
 * into the app's own persistent storage so it survives, and returns the
 * new file's URI to store alongside the vastu record.
 */
export async function saveFloorPlanImage(sourceUri: string, id: string, mimeType?: string): Promise<string> {
  const dest = new File(floorPlansDir(), `${id}.${extOf(mimeType)}`);
  await new File(sourceUri).copy(dest, { overwrite: true });
  return dest.uri;
}

export function deleteFloorPlanImage(uri: string | null | undefined) {
  if (!uri) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // Already gone, or not a file we manage — nothing to clean up.
  }
}
