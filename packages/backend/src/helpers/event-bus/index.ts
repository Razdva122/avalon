import EventEmitter3 from 'eventemitter3';

import type { IBusEvents } from '@/helpers/event-bus/interface';

export const eventBus = new EventEmitter3<IBusEvents>();
