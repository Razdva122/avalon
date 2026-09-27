// Disjoint namespaces prevent a room ID or user-supplied identifier from granting private subscriptions.
export const userChannel = (id: string) => `user:${id}`;
export const roomChannel = (id: string) => `room:${id}`;
