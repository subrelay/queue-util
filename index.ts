import { QueueArgs, Queue } from "./src/queue";
import { RedisQueue } from "./src/redis.queue";
import { SQSQueue } from "./src/sqs.queue";

export namespace QueueUtil {
  export function getInstance(args: QueueArgs): Queue {
    if (args.type === "redis") {
      return new RedisQueue(args);
    }

    if (args.type === "sqs") {
      return new SQSQueue(args);
    }

    throw new Error("Invalid queue type");
  }
}

export { QueueArgs, Queue, QueueMessage } from "./src/queue";
