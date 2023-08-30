import { Inject, Injectable, Logger, LoggerService, OnModuleInit } from '@nestjs/common';
import {
  ConnectionArgs,
  QueueConsumerEventHandlerMeta,
  QueueMessage,
  QueueMessageHandlerMeta,
  QueueName,
  QueueOptions,
} from './queue.types';
import { DiscoveredMethodWithMeta, DiscoveryService } from '@golevelup/nestjs-discovery';
import { QUEUE_CONSUMER_EVENT_HANDLER, QUEUE_CONSUMER_METHOD, QUEUE_OPTIONS } from './queue.constants';
import { QueueConsumer, RedisConsumer, SQSConsumer } from './consumer';
import { QueueProducer, RedisProducer, SQSProducer } from './producer';

@Injectable()
export class QueueService implements OnModuleInit {
  public readonly consumers = new Map<QueueName, QueueConsumer>();
  public readonly producers = new Map<QueueName, QueueProducer>();

  private logger: LoggerService;

  public constructor(
    @Inject(QUEUE_OPTIONS) public readonly options: QueueOptions,
    private readonly discover: DiscoveryService,
  ) {}

  public async onModuleInit(): Promise<void> {
    this.logger = this.options.logger ?? new Logger('QueueService', { timestamp: false });

    const messageHandlers = await this.discover.providerMethodsWithMetaAtKey<QueueMessageHandlerMeta>(
      QUEUE_CONSUMER_METHOD,
    );

    const eventHandlers = await this.discover.providerMethodsWithMetaAtKey<QueueConsumerEventHandlerMeta>(
      QUEUE_CONSUMER_EVENT_HANDLER,
    );

    this.options.producers?.forEach((options: ConnectionArgs) => this.setProducer(options));
    this.options.consumers?.forEach((options: ConnectionArgs) =>
      this.setConsumer(options, messageHandlers, eventHandlers),
    );

    for (const consumer of this.consumers.values()) {
      consumer.start();
    }
  }

  public send<T = any>(name: QueueName, payload: QueueMessage<T> | QueueMessage<T>[]): void {
    if (!this.producers.has(name)) {
      throw new Error(`Producer does not exist: ${name}`);
    }

    const messages = Array.isArray(payload) ? payload : [payload];

    const producer = this.producers.get(name);
    return producer.send(messages);
  }

  private setProducer(options: ConnectionArgs) {
    const { name } = options;
    if (this.producers.has(name)) {
      throw new Error(`Producer already exists: ${name}`);
    }

    if (options.queueUrl) {
      this.producers.set(name, new SQSProducer({ queueUrl: options.queueUrl }));
    } else if (options.host) {
      this.producers.set(
        name,
        new RedisProducer({ name, host: options.host, port: options.port || 6379, password: options.password }),
      );
    } else {
      throw new Error(`Missing configuration for producer: ${name}. "host" or "queueUrl" required`);
    }

    if (!this.producers.has(name)) {
      throw new Error(`Missing configuration for producer: ${name}`);
    }
  }

  private async setConsumer(
    options: ConnectionArgs,
    messageHandlers: DiscoveredMethodWithMeta<QueueMessageHandlerMeta>[],
    eventHandlers: DiscoveredMethodWithMeta<QueueConsumerEventHandlerMeta>[],
  ) {
    const { name } = options;
    if (this.consumers.has(name)) {
      throw new Error(`Consumer already exists: ${name}`);
    }

    const metadata = messageHandlers.find(({ meta }) => meta.name === name);
    if (!metadata) {
      this.logger.warn(`No metadata found for: ${name}`);
      return;
    }

    const handleMessage = metadata.discoveredMethod.handler.bind(metadata.discoveredMethod.parentClass.instance);
    let consumer: QueueConsumer;

    if (options.queueUrl) {
      consumer = new SQSConsumer({ queueUrl: options.queueUrl }, handleMessage);
    } else if (options.host) {
      consumer = new RedisConsumer(
        { name, host: options.host, port: options.port || 6379, password: options.password },
        handleMessage,
      );
    } else {
      throw new Error(`Missing configuration for consumer: ${name}. "host" or "queueUrl" required`);
    }

    const eventsMetadata = eventHandlers.filter(({ meta }) => meta.name === name);
    for (const eventMetadata of eventsMetadata) {
      if (eventMetadata) {
        consumer.addListener(
          eventMetadata.meta.eventName,
          eventMetadata.discoveredMethod.handler.bind(metadata.discoveredMethod.parentClass.instance),
        );
      }
    }
    this.consumers.set(name, consumer);
  }
}
