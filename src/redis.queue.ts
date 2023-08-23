import { Queue as BullQueue, Job, Worker } from "bullmq";
import { Queue, QueueArgs, QueueMessage } from "./queue";

type RedisConnectionArgs = {
  name: string;
  password?: string;
  host: string;
  port: number;
};

export class RedisQueue extends Queue {
  private client?: BullQueue;
  private args: RedisConnectionArgs;

  constructor(args: QueueArgs) {
    super();

    if (!args.host || !args.port) {
      throw new Error("host and port are required");
    }

    this.args = {
      name: args.name,
      password: args.password,
      host: args.host,
      port: args.port,
    };
  }

  private setClient() {
    this.client = new BullQueue(this.args.name, {
      connection: {
        host: this.args.host,
        port: this.args.port,
        password: this.args.password,
      },
    });
  }

  public startWorker(processorFn: (msg: QueueMessage) => void): void {
    const worker = new Worker(
      this.args.name,
      async (job: Job) => {
        await processorFn(job.data);
      },
      {
        connection: {
          host: this.args.host,
          port: this.args.port,
          password: this.args.password,
        },
      }
    );

    worker.on("completed", (job, err) => console.log(`Success job ${job?.id}`));

    worker.on("failed", (job, err) =>
      console.log(`Failed job ${job?.id} with ${err}`)
    );
  }

  async sendMessage(message: QueueMessage): Promise<void> {
    if (!this.client) {
      this.setClient();
    }

    await this.client?.add(this.args.name, message);
  }

  async sendMessages(messages: QueueMessage[]): Promise<void> {
    if (!this.client) {
      this.setClient();
    }

    await this.client?.addBulk(
      messages.map((msg) => ({ name: this.args.name, ...msg }))
    );
  }
}
