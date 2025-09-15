import Constants from 'expo-constants';

// Mobile Cloudinary uploader using unsigned preset
// Expect the following in app config extra or env:
// EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET, EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME, EXPO_PUBLIC_CLOUDINARY_URL

interface UploadResult { url: string; }

const getEnv = (key: string): string | undefined => {
  const fromProcess = (process.env as any)[key];
  const fromConstants = (Constants as any)?.expoConfig?.extra?.[key];
  return (fromProcess || fromConstants) as string | undefined;
};

const CLOUDINARY_URL = getEnv('EXPO_PUBLIC_CLOUDINARY_URL');
const CLOUDINARY_PRESET = getEnv('EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
const CLOUDINARY_CLOUD = getEnv('EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME');

export async function uploadImageAsync(uri: string): Promise<UploadResult> {
  if (!CLOUDINARY_URL || !CLOUDINARY_PRESET || !CLOUDINARY_CLOUD) {
    throw new Error('Cloudinary configuration missing');
  }
  // Prepare file
  const filename = uri.split('/').pop() || `upload-${Date.now()}.jpg`;
  const match = /\.([0-9a-zA-Z]+)$/.exec(filename || '');
  const ext = match ? match[1] : 'jpg';
  const type = ext === 'png' ? 'image/png' : 'image/jpeg';

  const formData: any = new FormData();
  formData.append('file', { uri, name: filename, type } as any);
  formData.append('upload_preset', CLOUDINARY_PRESET);
  formData.append('cloud_name', CLOUDINARY_CLOUD);

  const res = await fetch(CLOUDINARY_URL, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error('Upload failed: ' + txt.slice(0,120));
  }
  const json = await res.json();
  return { url: json.secure_url };
}
