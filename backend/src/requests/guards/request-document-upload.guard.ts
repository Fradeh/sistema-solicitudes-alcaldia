import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { RequestsService } from '../requests.service';

@Injectable()
export class RequestDocumentUploadGuard implements CanActivate {
  constructor(private readonly requestsService: RequestsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      params: { requestId?: string };
      user: { userId: string; role?: string; departmentId?: string | null };
    }>();
    const requestId = request.params.requestId;
    if (!requestId || !isUUID(requestId)) {
      throw new BadRequestException('El identificador de solicitud no es válido');
    }

    await this.requestsService.assertCanUploadDocumentById(requestId, request.user);
    return true;
  }
}
