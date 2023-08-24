import { RedisQueue } from "./redis.queue";
import { SQSQueue } from "./sqs.queue";

export type BlockJobData = {
  jobId: string;
  success: boolean;
  timestamp: number;
  name: string;
  data: any;
  failover: boolean;
};

export type QueueMessage = {
  id: string;
  data: any;
};

export abstract class Queue {
  abstract sendMessage(message: QueueMessage): Promise<void>;
  abstract sendMessages(messages: QueueMessage[]): Promise<void>;
  abstract startWorker(processorFn: (msg: QueueMessage) => void): void;
}

export type QueueArgs = {
  type: "sqs" | "redis";
  name: string;
  url?: string;
  password?: string;
  host?: string;
  port?: number;
};

export function getInstance(args: QueueArgs): Queue {
  if (args.type === "redis") {
    return new RedisQueue(args);
  }

  if (args.type === "sqs") {
    return new SQSQueue(args);
  }

  throw new Error("Invalid queue type");
}