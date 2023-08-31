import { SQSConnectionOptions, SQSConsumerClient, SQSConsumerMessage } from './type/sqs.types';
import { RedisConnectionOptions, RedisConsumerClient, RedisMessage } from './type/redis.types';
import { QueueMessage, QueueType } from './queue.types';

export abstract class QueueConsumer {
  abstract start(): void;
  abstract addListener(eventName: string, listener: (...args: any[]) => void): void;
  abstract getQueueType(): QueueType;
}

export class SQSConsumer<T> extends QueueConsumer {
  private consumer: SQSConsumerClient;
  start(): void {
    this.consumer.start();
  }

  addListener(eventName: string, listener: (...args: any[]) => void) {
    this.consumer.addListener(eventName, listener);
  }

  getQueueType(): QueueType {
    return QueueType.SQS;
  }

  fromSQSProduceMessages<T>(message: SQSConsumerMessage): QueueMessage<T> {
    let body: T;

    try {
      body = JSON.parse(message.Body) as T;
    } catch (error) {
      throw new Error('Failed to parse message body. Got: ' + message.Body);
    }

    return {
      id: message.MessageId,
      body,
    };
  }

  constructor(
    options: SQSConnectionOptions,
    processor: <T>(message: QueueMessage<T>) => Promise<void | QueueMessage<T>>,
  ) {
    super();
    this.consumer = SQSConsumerClient.create({
      ...options,
      handleMessage: async (message: SQSConsumerMessage) => {
        const msg = this.fromSQSProduceMessages(message);
        await processor(msg);
      },
    });
  }
}

export class RedisConsumer extends QueueConsumer {
  private consumer: RedisConsumerClient;
  start(): void {
    this.consumer.run();
  }

  getQueueType(): QueueType {
    return QueueType.REDIS;
  }

  addListener(eventName: string, listener: (...args: any[]) => void) {
    this.consumer.addListener(eventName, listener);
  }

  fromRedisProduceMessages<T>(message: RedisMessage): QueueMessage<T> {
    return {
      id: message.name,
      body: message.data,
    };
  }

  constructor(options: RedisConnectionOptions, processor: any) {
    super();
    this.consumer = new RedisConsumerClient(options.name, processor, {
      autorun: false,
      connection: options,
    });
  }
}
