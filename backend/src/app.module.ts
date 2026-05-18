import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; 
import { AuthModule } from './modules/auth/auth.module';
import { CategoriasModule } from './modules/categorias/categorias.module';
import { DepartamentosModule } from './modules/departamentos/departamentos.module';
import { EstadosModule } from './modules/estados/estados.module';
import { SolicitudesModule } from './modules/solicitudes/solicitudes.module';
import { UsersModule } from './modules/users/users.module';
import { DocumentsModule } from './modules/documents/module';

@Module({
  imports: [
    //despues serà remplazado por la conexion a bd en un puero cerrado
    MongooseModule.forRoot('mongodb://localhost:27017/sistema-solicitudes'), 
    AuthModule,
    UsersModule,
    SolicitudesModule,
    DepartamentosModule,
    CategoriasModule,
    EstadosModule,
    DocumentsModule,
  ],
})
export class AppModule {}