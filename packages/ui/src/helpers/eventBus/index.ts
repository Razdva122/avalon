import EventEmitter2 from 'eventemitter2';

import type { IEventBus } from '@/helpers/eventBus/interface';

const eventBus: IEventBus = new EventEmitter2();

export default eventBus;
