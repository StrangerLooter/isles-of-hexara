import mongoose, { Schema, Document } from 'mongoose';
import { isMongoConnected } from '../mongoClient.js';

export interface IUser {
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface IUserDoc extends IUser, Document {}

const userSchema = new Schema<IUserDoc>(
  {
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUserDoc>('User', userSchema);

// In-Memory Fallback Store
const memoryUsers = new Map<string, IUser & { _id: string }>();

export const UserRepository = {
  async findByUsername(username: string): Promise<(IUser & { _id: string }) | null> {
    if (isMongoConnected()) {
      const doc = (await UserModel.findOne({ username }).lean()) as (IUser & { _id: any }) | null;
      return doc ? { ...doc, _id: String(doc._id) } : null;
    }
    return memoryUsers.get(username.toLowerCase()) ?? null;
  },

  async create(user: { username: string; email: string; passwordHash: string }): Promise<IUser & { _id: string }> {
    if (isMongoConnected()) {
      const doc = await UserModel.create(user);
      const obj = doc.toObject() as unknown as IUser & { _id: any };
      return { ...obj, _id: String(obj._id) };
    }
    const record = {
      _id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username: user.username,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: new Date(),
    };
    memoryUsers.set(user.username.toLowerCase(), record);
    return record;
  },
};
