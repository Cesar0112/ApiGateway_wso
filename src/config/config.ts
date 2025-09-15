// config.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsBoolean,
  IsArray,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WSO2Config {
  @IsString()
  @IsOptional()
  HOST: string = '10.12.24.205';

  @IsNumber()
  @IsOptional()
  PORT: number = 9443;

  @IsString()
  @IsOptional()
  API_VERSION: string = 'v2';

  @IsString()
  @IsOptional()
  URL: string = `https://${this.HOST}:${this.PORT}`;

  @IsString()
  @IsOptional()
  URL_TOKEN: string = `${this.URL}/oauth2/token`;

  @IsString()
  @IsOptional()
  REVOKE_URL: string = `${this.URL}/oauth2/revoke`;

  @IsString()
  @IsOptional()
  CLIENT_ID: string = 'cIGhYzy75LwxzSVFb9k4BsSavT0a';

  @IsString()
  @IsOptional()
  CLIENT_SECRET: string = 'T9PjTVNCvvONGAof4Rec_70BZVvuYAts8PmDt5aikPga';
}

export class DatabaseConfig {
  @IsIn(['sqlite', 'mysql'])
  @IsString()
  TYPE: string = 'sqlite';

  @IsString()
  HOST: string = 'locahost';

  @IsNumber()
  @IsOptional()
  PORT?: number = 3130;

  @IsString()
  @IsOptional()
  USERNAME?: string = '';

  @IsString()
  @IsOptional()
  PASSWORD?: string = '';
  @IsString()
  @IsOptional()
  DATABASE_NAME?: 'database';

  @IsNumber()
  @IsOptional()
  RETRY_DELAY: 3000;

  @IsBoolean()
  @IsOptional()
  AUTO_LOAD_ENTITIES: true;

  @IsBoolean()
  @IsOptional()
  SYNCHRONIZE: true;

  @IsIn([true, 'all', false])
  @IsOptional()
  LOGGING: 'all';
}

export class ApiGatewayConfig {
  @IsString()
  @IsOptional()
  HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  PORT: number = 10411;

  @IsString()
  @IsOptional()
  SESSION_SECRET: string = 's3cr3t';

  @IsBoolean()
  @IsOptional()
  PROXY: boolean = false;

  @IsString()
  @IsOptional()
  API_URL: string = `http://${this.HOST}:10410`;

  @IsString()
  @IsOptional()
  ENCRYPTION_PASSWORD: string = 'IkIopwlWorpqUj';

  @IsString()
  @IsOptional()
  PROXY_STATIC_MAP_PATH: string = './routes.json';

  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = 'http://localhost:8080';

  @IsString()
  @IsOptional()
  HTTP_METHODS_ALLOWED: string = 'GET,HEAD,PUT,PATCH,POST,DELETE';

  @IsIn(['wso2', 'sqlite'])
  @IsOptional()
  AUTH_TYPE: string = 'wso2';

  @IsNumber()
  @IsOptional()
  THROTTLE_TTL_MS: number = 900000;

  @IsNumber()
  @IsOptional()
  THROTTLE_LIMIT: number = 5;
}

export class SessionConfig {
  @IsString()
  @IsOptional()
  FOLDER: string = 'sessions_dev';

  @IsString()
  @IsOptional()
  SECRET: string = 'T9PjTVNCvvONGAof4RecIkIopwlWorpqUj';

  @IsNumber()
  @IsOptional()
  TTL_SECONDS: number = 86400;

  @IsString()
  @IsOptional()
  URL: string = 'redis://localhost:6379';

  @IsString()
  @IsOptional()
  COOKIE_NAME: string = 'apigateway_sid';

  @IsBoolean()
  @IsOptional()
  SECURE: boolean = false;

  @IsString()
  @IsOptional()
  HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  PORT: number = 6379;

  @IsBoolean()
  @IsOptional()
  TLS: boolean = false;

  @IsIn(['redis', 'sqlite'])
  @IsOptional()
  STRATEGY: 'redis' | 'sqlite' = 'redis';
}

export class Config {
  @IsIn(['dev', 'production'])
  @IsString()
  NODE_ENV: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WSO2Config)
  WSO2?: WSO2Config;

  @IsOptional()
  @ValidateNested()
  DATABASE?: DatabaseConfig;

  @IsOptional()
  @ValidateNested()
  @Type(() => ApiGatewayConfig)
  API_GATEWAY?: ApiGatewayConfig;

  @IsOptional()
  @ValidateNested()
  @Type(() => SessionConfig)
  SESSION?: SessionConfig;
}

export class RoutesConfig {
  @IsArray()
  ROUTE: string[];
}
