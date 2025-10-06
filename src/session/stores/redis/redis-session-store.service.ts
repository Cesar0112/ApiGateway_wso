// ../redis/redis-session.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';
import { ISessionStore } from '../../interfaces/session.interface';

@Injectable()
export class RedisSessionService implements ISessionStore {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async get(sid: string): Promise<string> {
    return (await this.redis.get(sid)) ?? '';
  }

  async set(sid: string, data: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds) {
      await this.redis.set(sid, data, 'EX', ttlSeconds);
    } else {
      await this.redis.set(sid, data);
    }
  }

  async destroy(sid: string): Promise<void> {
    await this.redis.del(sid);
  }
  async exist(sid: string): Promise<boolean> {
    const result = await this.redis.exists(sid);
    return result > 0;
  }
}
