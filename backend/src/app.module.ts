import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsuariosModule } from './usuarios/usuarios.module.js';


@Module({
  imports: [MongooseModule.forRoot('mongodb+srv://cespedesandresr_db_user:xtBjiDIsLXqAXWvn@pruebamongo.cv3zg7e.mongodb.net/'), UsuariosModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
