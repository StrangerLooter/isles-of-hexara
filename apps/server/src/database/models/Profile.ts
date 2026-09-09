import mongoose, { Schema, Document } from 'mongoose';
import { isMongoConnected } from '../mongoClient.js';

export interface IProfile {
  userId: string;
  displayName: string;
  avatarId: string;
  level: number;
  experience: number;
  gamesPlayed: number;
  wins: number;
  totalVictoryPoints: number;
}

export interface IProfileDoc extends IProfile, Document {}

const profileSchema = new Schema<IProfileDoc>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, required: true },
    avatarId: { type: String, default: 'avatar_captain' },
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    totalVictoryPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ProfileModel =
  mongoose.models.Profile || mongoose.model<IProfileDoc>('Profile', profileSchema);

const memoryProfiles = new Map<string, IProfile & { _id: string }>();

export const ProfileRepository = {
  async findByUserId(userId: string): Promise<(IProfile & { _id: string }) | null> {
    if (isMongoConnected()) {
      const doc = (await ProfileModel.findOne({ userId }).lean()) as (IProfile & { _id: any }) | null;
      return doc ? { ...doc, _id: String(doc._id) } : null;
    }
    return memoryProfiles.get(userId) ?? null;
  },

  async createOrUpdate(profile: IProfile): Promise<IProfile & { _id: string }> {
    if (isMongoConnected()) {
      const doc = (await ProfileModel.findOneAndUpdate(
        { userId: profile.userId },
        profile,
        { upsert: true, new: true }
      ).lean()) as (IProfile & { _id: any }) | null;
      if (doc) {
        return { ...doc, _id: String(doc._id) };
      }
    }
    const record = {
      _id: `prof_${Date.now()}`,
      ...profile,
    };
    memoryProfiles.set(profile.userId, record);
    return record;
  },
};
