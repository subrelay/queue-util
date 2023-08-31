import { Worker, Queue, BulkJobOptions } from 'bullmq';

export const RedisConsumerClient = Worker;
export type RedisConsumerClient = Worker;
export const RedisProducerClient = Queue;
export type RedisProducerClient = Queue;
export type RedisConnectionOptions = { name: string; host: string; port: number; password?: string };
export interface RedisMessage {
  name: string;
  data: any;
  opts?: BulkJobOptions;
}
