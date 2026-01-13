// config.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsBoolean,
  IsArray,
  IsIn,
  IsInt,
  IsPositive,
  IsIP,
  IsPort,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export class WSO2Config {
  @IsUrl()
  @IsOptional()
  HOST: string = 'https://10.12.24.205';

  @IsNumber()
  @IsOptional()
  PORT: number = 9443;

  @IsString()
  @IsOptional()
  API_VERSION: string = 'v2';

  @IsUrl()
  @IsOptional()
  URL: string = `https://${this.HOST}:${this.PORT}`;

  @IsUrl()
  @IsOptional()
  URL_TOKEN: string = `${this.URL}/oauth2/token`;

  @IsUrl()
  @IsOptional()
  REVOKE_URL: string = `${this.URL}/oauth2/revoke`;

  @IsString()
  @IsOptional()
  ROLE_SEARCH: string = `${this.URL}/scim2/v2/Roles/.search`;

  @IsString()
  @IsOptional()
  CLIENT_ID: string = 'cIGhYzy75LwxzSVFb9k4BsSavT0a';

  @IsString()
  @IsOptional()
  CLIENT_SECRET: string = 'T9PjTVNCvvONGAof4Rec_70BZVvuYAts8PmDt5aikPga';

  @IsString()
  @IsOptional()
  @IsIn(['password'])
  GRANT_TYPE: string = 'password';

  @IsString()
  @IsOptional()
  SCOPE: string = 'openid groups id_structure profile roles internal_role_mgt_view internal_user_mgt_list internal_user_mgt_create internal_user_mgt_view internal_user_mgt_update';

}

export class CasdoorConfig {
  @IsUrl()
  ENDPOINT: string = "http://10.12.24.33:8000/";

  @IsString()
  CLIENT_ID: string = '87b914c070d6b58efbb3';

  @IsString()
  CLIENT_SECRET: string = 'ad665faae66222d04c3470741ff5d1792a77cfd2';

  @IsString()
  CERTIFICATE: string;

  @IsString()
  ORG_NAME: string = "organization_winteli";

  @IsString()
  @IsOptional()
  APP_NAME?: string = "application_apigateway";
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
  URL: string = 'redis://localhost:7000';

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
  PORT: number = 7000;

  @IsBoolean()
  @IsOptional()
  TLS: boolean = false;

  @IsIn(['redis', 'sqlite'])
  @IsOptional()
  STRATEGY: 'redis' | 'sqlite' = 'redis';
}
export class UsersConfig {
  @IsInt()
  @IsPositive()
  USERNAME_MIN_SIZE: number = 4;

  @IsInt()
  @IsPositive()
  PASSWORD_MIN_SIZE: number = 8;
}
export class RoutesConfig {
  @IsArray()
  ROUTE: string[];
}
export class RedisConfig {
  @IsIP()
  HOST: string = '127.0.0.1';
  @IsPort()
  PORT: number = 6380;
}
export class Config {
  @IsIn(['dev', 'production'])
  @IsString()
  NODE_ENV: string;

  @ValidateNested()
  @Type(() => WSO2Config)
  WSO2: WSO2Config;

  @ValidateNested()
  @Type(() => CasdoorConfig)
  CASDOOR: CasdoorConfig;

  @ValidateNested()
  DATABASE: DatabaseConfig;

  @ValidateNested()
  @Type(() => ApiGatewayConfig)
  API_GATEWAY: ApiGatewayConfig;

  @ValidateNested()
  @Type(() => SessionConfig)
  SESSION: SessionConfig;

  /**
   * Configuración para validar tanto los datos de los usuarios
   */
  @ValidateNested()
  @Type(() => UsersConfig)
  USERS: UsersConfig;

  /**
   * Configuración necesaria para Bull
   */
  @ValidateNested()
  @Type(() => RedisConfig)
  REDIS: RedisConfig;
}
