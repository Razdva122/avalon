import { roomModel } from '@/db/models';
import { Migration } from '@/db/migrations/interface';

export const updateChatMessages: Migration = {
  name: 'updateChatMessages',
  async up() {
    try {
      const rooms = await roomModel.find({ chat: { $exists: true } });

      let updatedCount = 0;

      for (const room of rooms) {
        let updated = false;

        if (Array.isArray(room.chat)) {
          const updatedChat = [];

          for (const chatItem of room.chat) {
            // @ts-expect-error migration
            const rawChatItem = chatItem.toObject ? chatItem.toObject() : chatItem;

            if (rawChatItem.user && rawChatItem.user.id) {
              const { user, ...rest } = rawChatItem;
              const newChatItem = {
                ...rest,
                userID: user.id,
              };

              updatedChat.push(newChatItem);
              updated = true;
            } else {
              updatedChat.push(rawChatItem);
            }
          }

          if (updated) {
            room.chat = updatedChat;
            await room.save();
            updatedCount++;
          }
        }
      }

      console.log(`Migration updateChatMessages completed successfully. Updated ${updatedCount} rooms.`);
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  },
};
