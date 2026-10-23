import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsuariosModule } from './usuarios/usuarios.module.js';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [ConfigModule.forRoot(),MongooseModule.forRoot(process.env.CONNECTION_STRING!), UsuariosModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
