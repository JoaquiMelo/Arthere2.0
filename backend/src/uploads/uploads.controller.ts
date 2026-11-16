import { BadRequestException, Controller, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
const diskStorage = require('multer').diskStorage as any;
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const uploadDir = join(__dirname, '..', '..', 'uploads');
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
const extensions: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
};

@Controller('uploads')
export class UploadsController {
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req: any, _file: any, cb: (error: Error | null, destination: string) => void) => cb(null, uploadDir),
      filename: (_req: any, file: any, cb: (error: Error | null, filename: string) => void) => cb(null, randomUUID() + extensions[file.mimetype]),
    }),
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (_req: any, file: any, cb: (error: Error | null, accept: boolean) => void) => {
      if (!extensions[file.mimetype]) return cb(new BadRequestException('Formato inválido. Envie JPG, PNG, WEBP ou GIF.'), false);
      cb(null, true);
    },
  }))
  enviar(@UploadedFile() file: any, @Req() req: any) {
    if (!file) throw new BadRequestException('Selecione uma imagem válida.');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    return { url: protocol + '://' + req.get('host') + '/uploads/' + file.filename, filename: file.filename, size: file.size };
  }
}
