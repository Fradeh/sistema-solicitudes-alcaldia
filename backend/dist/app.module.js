"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const auth_module_1 = require("./modules/auth/auth.module");
const categorias_module_1 = require("./modules/categorias/categorias.module");
const departamentos_module_1 = require("./modules/departamentos/departamentos.module");
const estados_module_1 = require("./modules/estados/estados.module");
const solicitudes_module_1 = require("./modules/solicitudes/solicitudes.module");
const users_module_1 = require("./modules/users/users.module");
const module_1 = require("./modules/documents/module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forRoot('mongodb://localhost:27017/sistema-solicitudes'),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            solicitudes_module_1.SolicitudesModule,
            departamentos_module_1.DepartamentosModule,
            categorias_module_1.CategoriasModule,
            estados_module_1.EstadosModule,
            module_1.DocumentsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map