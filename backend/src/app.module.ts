import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';


@Module({
  imports: [ConfigModule.forRoot(),MongooseModule.forRoot(process.env.CONNECTION_STRING!), UsuariosModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
