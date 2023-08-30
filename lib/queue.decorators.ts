import { SetMetadata } from '@nestjs/common';
import { QUEUE_CONSUMER_EVENT_HANDLER, QUEUE_CONSUMER_METHOD } from './queue.constants';

export const QueueMessageHandler = (name: string) => SetMetadata(QUEUE_CONSUMER_METHOD, { name });
export const QueueConsumerEventHandler = (name: string, eventName: string) =>
  SetMetadata(QUEUE_CONSUMER_EVENT_HANDLER, { name, eventName });
