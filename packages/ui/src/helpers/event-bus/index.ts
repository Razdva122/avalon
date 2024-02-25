import EventEmitter2 from 'eventemitter2';

import type { IEventBus } from '@/helpers/event-bus/interface';

const eventBus: IEventBus = new EventEmitter2();

export default eventBus;
