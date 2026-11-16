import { BadRequestException, Controller, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
};

function uploadsDirectory() {
  const configured = process.env.UPLOADS_DIR;
  return configured
    ? (configured.startsWith('/') ? configured : join(process.cwd(), configured))
    : join(process.cwd(), 'uploads');
}

@Controller('uploads')
export class UploadsController {
  @UseGuards(JwtAuthGuard)
  @Post('image')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req, _file, callback) => {
        const directory = uploadsDirectory();
        mkdirSync(directory, { recursive: true });
        callback(null, directory);
      },
      filename: (_req, file, callback) => {
        const extension = MIME_EXTENSIONS[file.mimetype] ?? extname(file.originalname).toLowerCase();
        callback(null, `${randomUUID()}${extension}`);
      },
    }),
    limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
    fileFilter: (_req, file, callback) => {
      if (!MIME_EXTENSIONS[file.mimetype]) {
        callback(new BadRequestException('Formato não permitido. Envie JPG, PNG, WEBP, GIF ou HEIC.'), false);
        return;
      }
      callback(null, true);
    },
  }))
  enviarImagem(@UploadedFile() file: any, @Req() req: any) {
    if (!file) throw new BadRequestException('Selecione uma imagem para enviar.');
    const configuredBaseUrl = process.env.PUBLIC_API_URL?.trim().replace(/\/+$/, '');
    const baseUrl = configuredBaseUrl || `${req.protocol}://${req.get('host')}`;
    return {
      url: `${baseUrl}/uploads/${encodeURIComponent(file.filename)}`,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
