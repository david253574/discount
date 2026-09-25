import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  if (!filename) return NextResponse.json({ error: 'Filename is required' }, { status: 400 });

  try {
    // If local dev environment, fallback to local disk to bypass Vercel OIDC blocker
    if (process.env.NODE_ENV === 'development') {
      const arrayBuffer = await request.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filepath = path.join(uploadDir, filename);
      fs.writeFileSync(filepath, buffer);
      
      return NextResponse.json({ url: `/uploads/${filename}` });
    }

    const blob = await put(filename, request.body!, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    return NextResponse.json(blob);
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
