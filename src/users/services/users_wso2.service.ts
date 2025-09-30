// src/users/services/users.wso2.service.ts
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as https from 'https';
import { ConfigService } from '../../config/config.service';
import { User } from '../entities/user.entity';
import { CreateUsersDto } from '../dto/create-users.dto';
import { UpdateUsersDto } from '../dto/update-users.dto';
import { UserMapper } from '../user_mapper';



@Injectable()
export class UsersWSO2Service {
  private readonly _logger = new Logger(UsersWSO2Service.name);
  private readonly _baseUrl: string;

  constructor(private readonly _configService: ConfigService) {
    const wso2Config = this._configService.getConfig().WSO2;
    this._baseUrl = `${wso2Config.HOST}:${wso2Config.PORT}/scim2/Users`;
  }

  private _getRequestOptions(token: string): AxiosRequestConfig {
    return {
      proxy: false,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized:
          this._configService.getConfig().NODE_ENV === 'production',
      }),
    };
  }

  async create(dto: CreateUsersDto, token: string): Promise<User> {
    try {

      const payload = UserMapper.toWSO2PayloadForCreate(dto);
      const res: AxiosResponse<any> = await axios.post(
        this._baseUrl,
        payload,
        this._getRequestOptions(token),
      );
      return UserMapper.fromWSO2Response(res.data);
    } catch (err: any) {
      this._logger.error('Error creando usuario en WSO2', err);
      if (err.response?.status === 409) {
        throw new ConflictException('Usuario ya existe');
      }
      throw new InternalServerErrorException('No se pudo crear el usuario');
    }
  }

  async findAll(token: string): Promise<User[]> {
    try {
      const res: AxiosResponse<any> = await axios.get(
        this._baseUrl,
        this._getRequestOptions(token),
      );
      console.log("Res data:", res.data)
      return res.data.Resources.map((u: any) =>
        UserMapper.fromWSO2Response(u),
      );
    } catch (err) {
      this._logger.error('Error obteniendo usuarios en WSO2', err);
      throw new InternalServerErrorException('No se pudieron obtener usuarios');
    }
  }

  async findById(id: string, token: string): Promise<User> {
    try {
      const res: AxiosResponse<any> = await axios.get(
        `${this._baseUrl}/${id}`,
        this._getRequestOptions(token),
      );
      return UserMapper.fromWSO2Response(res.data);
    } catch (err) {
      if (err.response?.status === 404) {
        throw new NotFoundException(`Usuario ${id} no encontrado`);
      }
      throw new InternalServerErrorException('No se pudo obtener el usuario');
    }
  }

  async findByUsername(username: string, token: string): Promise<User> {
    try {
      const res: AxiosResponse<any> = await axios.get(
        `${this._baseUrl}?filter=userName eq "${username}"`,
        this._getRequestOptions(token),
      );
      const userData = res.data.Resources?.[0];
      if (!userData) {
        throw new NotFoundException(`Usuario ${username} no encontrado`);
      }
      return UserMapper.fromWSO2Response(userData);
    } catch (err) {
      throw new InternalServerErrorException('No se pudo obtener el usuario');
    }
  }

  async update(id: string, dto: UpdateUsersDto, token: string): Promise<User> {
    try {
      const payload = UserMapper.toWSO2PayloadForUpdate(dto);
      const res: AxiosResponse<any> = await axios.put(
        `${this._baseUrl}/${id}`,
        payload,
        this._getRequestOptions(token),
      );
      return UserMapper.fromWSO2Response(res.data);
    } catch (err) {
      this._logger.error(`Error actualizando usuario ${id}`, err);
      throw new InternalServerErrorException('No se pudo actualizar el usuario');
    }
  }

  async remove(id: string, token: string): Promise<void> {
    try {
      await axios.delete(
        `${this._baseUrl}/${id}`,
        this._getRequestOptions(token),
      );
    } catch (err) {
      if (err.response?.status === 404) {
        throw new NotFoundException(`Usuario ${id} no encontrado`);
      }
      throw new InternalServerErrorException('No se pudo eliminar el usuario');
    }
  }
  async updateByUsername(username: string, dto: UpdateUsersDto, token: string): Promise<User> {
    try {
      // 1. buscar el usuario por username
      const searchRes: AxiosResponse<any> = await axios.get(
        `${this._baseUrl}?filter=userName eq "${username}"`,
        this._getRequestOptions(token),
      );

      const userData = searchRes.data.Resources?.[0];
      if (!userData) {
        throw new NotFoundException(`Usuario ${username} no encontrado`);
      }

      const userId = userData.id;

      // 2. actualizar usando el id
      const payload = UserMapper.toWSO2PayloadForUpdate(dto);
      const res: AxiosResponse<any> = await axios.put(
        `${this._baseUrl}/${userId}`,
        payload,
        this._getRequestOptions(token),
      );

      return UserMapper.fromWSO2Response(res.data);
    } catch (err) {
      this._logger.error(`Error actualizando usuario por username ${username}`, err);
      throw new InternalServerErrorException('No se pudo actualizar el usuario');
    }
  }

  async removeByUsername(username: string, token: string): Promise<void> {
    try {
      // 1. buscar el usuario por username
      const searchRes: AxiosResponse<any> = await axios.get(
        `${this._baseUrl}?filter=userName eq "${username}"`,
        this._getRequestOptions(token),
      );

      const userData = searchRes.data.Resources?.[0];
      if (!userData) {
        throw new NotFoundException(`Usuario ${username} no encontrado`);
      }

      const userId = userData.id;

      // 2. eliminar usando el id
      await axios.delete(
        `${this._baseUrl}/${userId}`,
        this._getRequestOptions(token),
      );
    } catch (err) {
      this._logger.error(`Error eliminando usuario por username ${username}`, err);
      throw new InternalServerErrorException('No se pudo eliminar el usuario');
    }
  }

}
