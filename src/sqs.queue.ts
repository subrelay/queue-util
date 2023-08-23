import {
  Message,
  SQSClient,
  SendMessageBatchCommand,
  SendMessageBatchCommandInput,
  SendMessageBatchRequestEntry,
  SendMessageCommand,
  SendMessageCommandInput,
} from "@aws-sdk/client-sqs";
import { Consumer } from "sqs-consumer";

import { Queue, QueueArgs, QueueMessage } from "./queue";

type SQSConnectionArgs = {
  queueUrl: string;
};

export class SQSQueue extends Queue {
  private client?: SQSClient;
  private args: SQSConnectionArgs;

  constructor(args: QueueArgs) {
    super();
    process.env.AWS_ACCESS_KEY_ID = "AKIAUZJKY6KTGE2PGFI2";
    process.env.AWS_SECRET_ACCESS_KEY =
      "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";

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("Missing AWS credentials");
    }

    if (!args.url) {
      throw new Error("Missing SQS Queue URL");
    }

    this.args = {
      queueUrl: args.url,
    };

    this.client = new SQSClient({
      region: "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        // sessionToken: "",
      },
    });
  }

  toSQSMessage(message: QueueMessage): SendMessageBatchRequestEntry {
    return {
      Id: message.id,
      MessageBody: JSON.stringify(message.data),
      MessageDeduplicationId: message.id,
      MessageGroupId: message.id,
    };
  }

  fromSQSMessage(message: Message): QueueMessage {
    return message.Body && JSON.parse(message.Body);
  }

  async sendMessage(message: QueueMessage): Promise<void> {
    const input: SendMessageCommandInput = {
      QueueUrl: this.args.queueUrl,
      ...this.toSQSMessage(message),
    };
    const command = new SendMessageCommand(input);
    await this.client?.send(command);
  }

  public startWorker(processorFn: (msg: QueueMessage) => void): void {
    const worker = Consumer.create({
      queueUrl: this.args.queueUrl,
      handleMessage: async (msg: Message) =>
        processorFn(this.fromSQSMessage(msg)),
    });

    worker.on("error", (err) => {
      console.log(`Failed job with ${err}`);
    });

    worker.on("processing_error", (err) => {
      console.log(`Failed job with ${err}`);
    });

    worker.start();
  }

  async sendMessages(messages: QueueMessage[]): Promise<void> {
    const input: SendMessageBatchCommandInput = {
      QueueUrl: this.args.queueUrl,
      Entries: messages.map((msg) => this.toSQSMessage(msg)),
    };

    await this.client?.send(new SendMessageBatchCommand(input));
  }
}
