import { DynamicModule, Global, Module, Provider, Type } from '@nestjs/common';
import { DiscoveryModule, DiscoveryService } from '@golevelup/nestjs-discovery';
import { QueueService } from './queue.service';
import { QueueModuleAsyncOptions, QueueModuleOptionsFactory, QueueOptions } from './queue.types';
import { QUEUE_OPTIONS } from './queue.constants';

@Global()
@Module({
  imports: [DiscoveryModule],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {
  public static register(options: QueueOptions): DynamicModule {
    const queueOptions: Provider = {
      provide: QUEUE_OPTIONS,
      useValue: options,
    };
    const queueProvider: Provider = {
      provide: QueueService,
      useFactory: (queueOptions: QueueOptions, discover: DiscoveryService) => new QueueService(queueOptions, discover),
      inject: [QUEUE_OPTIONS, DiscoveryService],
    };

    return {
      global: true,
      module: QueueModule,
      imports: [DiscoveryModule],
      providers: [queueOptions, queueProvider],
      exports: [queueProvider],
    };
  }

  public static registerAsync(options: QueueModuleAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);
    const queueProvider: Provider = {
      provide: QueueService,
      useFactory: (options: QueueOptions, discover: DiscoveryService) => new QueueService(options, discover),
      inject: [QUEUE_OPTIONS, DiscoveryService],
    };

    return {
      global: true,
      module: QueueModule,
      imports: [DiscoveryModule, ...(options.imports ?? [])],
      providers: [...asyncProviders, queueProvider],
      exports: [queueProvider],
    };
  }

  private static createAsyncProviders(options: QueueModuleAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    const useClass = options.useClass as Type<QueueModuleOptionsFactory>;
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(options: QueueModuleAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: QUEUE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    const inject = [(options.useClass || options.useExisting) as Type<QueueModuleOptionsFactory>];
    return {
      provide: QUEUE_OPTIONS,
      useFactory: async (optionsFactory: QueueModuleOptionsFactory) => await optionsFactory.createOptions(),
      inject,
    };
  }
}
