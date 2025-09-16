export interface IProxyResponse {
  status: number;
  headers: Record<string, any>;
  body: any;
}
export enum Channel {
  HTTP = 'http',
  HTTPS = 'https',
  NATS = 'nats',
  // Agrega más canales según sea necesario
  // Ejemplo: MQTT = 'mqtt',
  // Ejemplo: GRPC = 'grpc',
  // Ejemplo: WEBSOCKET = 'websocket',
  // Ejemplo: KAFKA = 'kafka',
  // Ejemplo: RABBITMQ = 'rabbitmq',
  // Ejemplo: REDIS = 'redis',
  // Ejemplo: AMQP = 'amqp',
}
