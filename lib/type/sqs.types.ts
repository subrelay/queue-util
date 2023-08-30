import { Producer, Message as ProduceMessage } from 'sqs-producer';
import { Consumer } from 'sqs-consumer';
import { Message as ConsumerMessage } from '@aws-sdk/client-sqs';

export const SQSConsumerClient = Consumer;
export type SQSConsumerClient = Consumer;
export const SQSProducerClient = Producer;
export type SQSProducerClient = Producer;
export type SQSConnectionOptions = { queueUrl: string };

export type SQSProduceMessage = ProduceMessage;
export type SQSConsumerMessage = ConsumerMessage;
