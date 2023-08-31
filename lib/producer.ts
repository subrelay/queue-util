import { SQSConnectionOptions, SQSProduceMessage, SQSProducerClient } from './type/sqs.types';
import { RedisConnectionOptions, RedisProducerClient } from './type/redis.types';
import { QueueMessage, QueueType } from './queue.types';

export abstract class QueueProducer {
  abstract send(messages: QueueMessage<any>[]): void;
  abstract getQueueType(): QueueType;
}

export class SQSProducer extends QueueProducer {
  private producer: SQSProducerClient;

  getQueueType(): QueueType {
    return QueueType.SQS;
  }

  private toSQSProduceMessages(messages: QueueMessage[]): SQSProduceMessage[] {
    return messages.map((message) => {
      let body = message.body;
      if (typeof body !== 'string') {
        body = JSON.stringify(body) as any;
      }

      return {
        ...message,
        id: message.id,
        body,
        groupId: message.id,
        deduplicationId: message.id,
      };
    });
  }

  send(messages: QueueMessage<any>[]): void {
    this.producer.send(this.toSQSProduceMessages(messages));
  }

  constructor(options: SQSConnectionOptions) {
    super();
    this.producer = SQSProducerClient.create(options);
  }
}

export class RedisProducer extends QueueProducer {
  private producer: RedisProducerClient;

  getQueueType(): QueueType {
    return QueueType.REDIS;
  }

  send(messages: QueueMessage[]): void {
    this.producer.addBulk(messages.map((msg) => ({ name: msg.id, data: msg.body })));
  }

  constructor(options: RedisConnectionOptions) {
    super();
    this.producer = new RedisProducerClient(options.name, { connection: options });
  }
}
