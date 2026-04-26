import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriasModule } from './modules/categorias/categorias.module';
import { DepartamentosModule } from './modules/departamentos/departamentos.module';
import { EstadosModule } from './modules/estados/estados.module';
import { SolicitudesModule } from './modules/solicitudes/solicitudes.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    SolicitudesModule,
    DepartamentosModule,
    CategoriasModule,
    EstadosModule,
  ],
})
export class AppModule {}
