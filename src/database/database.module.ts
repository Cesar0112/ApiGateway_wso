import { DynamicModule, Module } from '@nestjs/common'; @Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule, // para que otros módulos puedan usar getRepository
    };
  }
}
