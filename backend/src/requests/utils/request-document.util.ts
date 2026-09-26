import { BadRequestException, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { basename, extname, isAbsolute, resolve, sep } from 'path';
import { RequestDocument } from '../../documents/entities/request-document.entity';

const EXTENSIONS_BY_MIME: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

export function detectDocumentMime(buffer: Buffer): string | undefined {
  if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  ) return 'image/jpeg';
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) return 'image/png';
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) return 'image/webp';
  return undefined;
}

export async function validateUploadedDocument(
  filePath: string,
  originalName: string,
  declaredMime: string,
): Promise<void> {
  const allowedExtensions = EXTENSIONS_BY_MIME[declaredMime];
  const extension = extname(originalName).toLowerCase();
  if (!allowedExtensions?.includes(extension)) {
    throw new BadRequestException('La extensión no coincide con un tipo de archivo permitido');
  }

  const content = await fs.readFile(filePath);
  if (detectDocumentMime(content) !== declaredMime) {
    throw new BadRequestException('El contenido del archivo no coincide con su tipo declarado');
  }
}

export function resolveStoredDocumentPath(document: RequestDocument): string {
  const prefix = `/uploads/requests/${document.requestId}/`;
  if (!document.url.startsWith(prefix)) {
    throw new NotFoundException('No se encontró el archivo asociado al documento');
  }

  const storedName = document.url.slice(prefix.length);
  if (!storedName || storedName !== basename(storedName)) {
    throw new NotFoundException('No se encontró el archivo asociado al documento');
  }

  const requestDirectory = resolve(process.cwd(), 'uploads', 'requests', document.requestId);
  const filePath = resolve(requestDirectory, storedName);
  if (isAbsolute(storedName) || !filePath.startsWith(`${requestDirectory}${sep}`)) {
    throw new NotFoundException('No se encontró el archivo asociado al documento');
  }

  return filePath;
}
