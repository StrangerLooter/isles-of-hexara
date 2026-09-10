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
      await GameRecordModel.findOneAndUpdate(
        { gameId: record.gameId },
        record,
        { upsert: true, new: true }
      );
    } else {
      memoryGameRecords.set(record.gameId, {
        _id: `rec_${Date.now()}`,
        ...record,
      });
    }
  },

  async findByGameId(gameId: string): Promise<(IGameRecord & { _id: string }) | null> {
    if (isMongoConnected()) {
      const doc = (await GameRecordModel.findOne({ gameId }).lean()) as (IGameRecord & { _id: any }) | null;
      return doc ? { ...doc, _id: String(doc._id) } : null;
    }
    return memoryGameRecords.get(gameId) ?? null;
  },

  async listRecent(limit = 10, userId?: string): Promise<IGameRecord[]> {
    if (isMongoConnected()) {
      const query = userId ? { 'playerResults.playerId': userId } : {};
      return (await GameRecordModel.find(query).sort({ createdAt: -1 }).limit(limit).lean()) as unknown as IGameRecord[];
    }
    let records = Array.from(memoryGameRecords.values());
    if (userId) {
      records = records.filter((r) => r.playerResults.some((p) => p.playerId === userId));
    }
    return records.slice(-limit).reverse();
  },
};
