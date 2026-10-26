import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  hola(): string {
    return 'Hola desde FutbolCrack ⚽';
  }
}