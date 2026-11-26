import { BadRequestException, Controller, Get, Header, NotFoundException, Param, Post, Req, StreamableFile, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

const memoryStorage = require('multer').memoryStorage;
const extensions: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
};

function imageMime(bytes: Buffer): string | undefined {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6))) return 'image/gif';
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return undefined;
}

@Controller('uploads')
export class UploadsController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  }))
  async enviar(@UploadedFile() file: { buffer: Buffer; size: number } | undefined, @Req() req: any) {
    if (!file?.buffer?.length) throw new BadRequestException('Selecione uma imagem válida.');
    const mime = imageMime(file.buffer);
    if (!mime) throw new BadRequestException('Formato inválido. Envie JPG, PNG, WEBP ou GIF.');
    const filename = randomUUID() + extensions[mime];
    // Mantém o binário no MySQL, independentemente do ciclo de vida do Render.
    await this.prisma.$executeRaw`INSERT INTO \`upload_imagem\` (\`filename\`, \`mime\`, \`conteudo\`) VALUES (${filename}, ${mime}, ${file.buffer})`;
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    return { url: protocol + '://' + req.get('host') + '/uploads/' + filename, filename, size: file.size };
  }

  @Get(':filename')
  @Header('Cache-Control', 'public, max-age=604800, immutable')
  @Header('X-Content-Type-Options', 'nosniff')
  async obter(@Param('filename') filename: string) {
    if (!/^[a-f0-9-]{36}\.(?:jpg|png|webp|gif)$/i.test(filename)) throw new NotFoundException('Imagem não encontrada.');
    const [imagem] = await this.prisma.$queryRaw<{ mime: string; conteudo: Uint8Array }[]>`SELECT \`mime\`, \`conteudo\` FROM \`upload_imagem\` WHERE \`filename\` = ${filename} LIMIT 1`;
    if (!imagem || !extensions[imagem.mime]) throw new NotFoundException('Imagem não encontrada.');
    return new StreamableFile(Buffer.from(imagem.conteudo), { type: imagem.mime });
  }
}
