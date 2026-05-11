import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Sistema de Solicitudes Alcaldia')
  .setDescription('API REST para la gestion de solicitudes ciudadanas.')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
