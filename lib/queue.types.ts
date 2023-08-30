import type { LoggerService, ModuleMetadata, Type } from '@nestjs/common';

export type QueueName = string;

export enum QueueType {
  SQS = 'sqs',
  REDIS = 'redis',
}

export type ConnectionArgs = {
  readonly name: string;
  readonly queueUrl?: string;
  readonly password?: string;
  readonly host?: string;
  readonly port?: number;
};

export interface QueueOptions {
  consumers?: ConnectionArgs[];
  producers?: ConnectionArgs[];
  logger?: LoggerService;
}

export interface QueueModuleOptionsFactory {
  createOptions(): Promise<QueueOptions> | QueueOptions;
}

export interface QueueModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<QueueModuleOptionsFactory>;
  useClass?: Type<QueueModuleOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<QueueOptions> | QueueOptions;
  inject?: any[];
}

export interface QueueMessageHandlerMeta {
  name: string;
}

export interface QueueConsumerEventHandlerMeta {
  name: string;
  eventName: string;
}

export interface QueueMessage<T=any> {
  id: string;
  body: T;
}
