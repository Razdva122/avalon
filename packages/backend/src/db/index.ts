import mongoose from 'mongoose';
import { getModelForClass } from '@typegoose/typegoose';
import { StartedRoomState } from '@avalon/types';

export const connectDB = async () => {
  try {
    const mongooseInsatnce = await mongoose.connect('mongodb://admin:secret@localhost:27017/avalon?authSource=admin');
    console.log('✅ MongoDB Connected');
    return mongooseInsatnce;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
  }
};

export class DBManager {
  roomModel = getModelForClass(StartedRoomState);
  dbInstance: mongoose.Mongoose | undefined;

  constructor(dbInstance: mongoose.Mongoose | undefined) {
    this.dbInstance = dbInstance;
  }

  async saveRoomToDB(roomState: StartedRoomState): Promise<void> {
    const room = new this.roomModel(roomState);
    room.save();
  }

  async getRoomFromDB(roomID: string): Promise<StartedRoomState | null> {
    const room = await this.roomModel.findOne({ roomID });
    return room;
  }

  async getLastRooms(amount: number): Promise<StartedRoomState[]> {
    const rooms = await this.roomModel.find().sort({ _id: -1 }).limit(amount);

    return rooms;
  }
}
