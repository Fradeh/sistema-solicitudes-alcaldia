"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const app_config_1 = require("./config/app.config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix(app_config_1.appConfig.apiPrefix);
    app.enableCors();
    await app.listen(app_config_1.appConfig.port);
}
bootstrap();
//# sourceMappingURL=main.js.map