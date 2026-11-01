import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsuariosService } from './usuarios.service.js';
import { AuthGuard } from '../auth/guards/auth.guard.js';
import { AdministradorGuard } from './guards/administrador.guard.js';
import { CrearUsuarioAdministrativoDto } from './dto/crear-usuario-administrativo.dto.js';

// Todo el controller es administrativo. Registro/login públicos permanecen en AuthController.
@Controller('usuarios')
@UseGuards(AuthGuard, AdministradorGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}
  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }
  @Post()
  crear(@Body() datos: CrearUsuarioAdministrativoDto) {
    return this.usuariosService.crearAdministrativo(datos);
  }
  @Delete(':id')
  deshabilitar(
    @Param('id') id: string,
    @Req() request: Request & { user?: { sub: string } },
  ) {
    return this.usuariosService.deshabilitar(id, request.user!.sub);
  }
  @Post(':id/habilitar')
  @HttpCode(200)
  habilitar(@Param('id') id: string) {
    return this.usuariosService.habilitar(id);
  }
}
