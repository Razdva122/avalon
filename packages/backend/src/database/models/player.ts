import mongoose, { Document } from 'mongoose';

import type { IPlayer } from '@avalon/types';

type TPlayerModel = Document & IPlayer;

export const featuresScheme = new mongoose.Schema<IPlayer['features']>({
  isLeader: Boolean,
  isSelected: Boolean,
  isSent: Boolean,
  waitForAction: Boolean,
  ladyOfLake: String,
  excalibur: Boolean,
  isAssassin: Boolean,
});

export const playerSchema = new mongoose.Schema<TPlayerModel>({
  index: { type: Number, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  features: featuresScheme,
  validMissionsResult: [String],
});

export const PlayerModel = mongoose.model('Player', playerSchema);
