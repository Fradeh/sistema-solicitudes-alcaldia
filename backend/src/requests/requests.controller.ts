import { Controller } from '@nestjs/common';
import { RequestsService } from './requests.service';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}
  
  // endpoints del Issue #se programarán aquí abajo después
}