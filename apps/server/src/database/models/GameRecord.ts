import mongoose, { Schema, Document } from 'mongoose';
import { isMongoConnected } from '../mongoClient.js';

export interface IGameRecord {
  gameId: string;
  winnerId: string;
  playerResults: {
    playerId: string;
    username: string;
    victoryPoints: number;
    color: string;
  }[];
  turnsCount: number;
  durationSeconds: number;
  createdAt: Date;
}

export interface IGameRecordDoc extends IGameRecord, Document {}

const gameRecordSchema = new Schema<IGameRecordDoc>(
  {
    gameId: { type: String, required: true, unique: true, index: true },
    winnerId: { type: String, required: true },
    playerResults: [
      {
        playerId: { type: String, required: true },
        username: { type: String, required: true },
        victoryPoints: { type: Number, required: true },
        color: { type: String, required: true },
      },
    ],
    turnsCount: { type: Number, default: 1 },
    durationSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const GameRecordModel =
  mongoose.models.GameRecord ||
  mongoose.model<IGameRecordDoc>('GameRecord', gameRecordSchema);

const memoryGameRecords = new Map<string, IGameRecord & { _id: string }>();

export const GameRecordRepository = {
  async save(record: IGameRecord): Promise<void> {
    if (isMongoConnected()) {
      await GameRecordModel.create(record);
    } else {
      memoryGameRecords.set(record.gameId, {
        _id: `rec_${Date.now()}`,
        ...record,
      });
    }
  },

  async listRecent(limit = 10): Promise<IGameRecord[]> {
    if (isMongoConnected()) {
      return (await GameRecordModel.find().sort({ createdAt: -1 }).limit(limit).lean()) as unknown as IGameRecord[];
    }
    return Array.from(memoryGameRecords.values()).slice(-limit);
  },
};
