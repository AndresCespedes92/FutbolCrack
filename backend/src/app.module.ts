import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';


@Module({
  imports: [ConfigModule.forRoot(),MongooseModule.forRoot(process.env.CONNECTION_STRING!), UsuariosModule, AuthModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
