export interface FriendRelationship {
  id: string;
  userId: string;
  friendId: string;
  friendUsername: string;
  friendAvatar: string;
  status: 'accepted' | 'pending';
  createdAt: number;
}

export interface GameInvitation {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  roomCode: string;
  scenarioName?: string;
  createdAt: number;
}

// In-memory store with fallback
const friendRelationships: FriendRelationship[] = [
  {
    id: 'rel_1',
    userId: 'default_user',
    friendId: 'f1',
    friendUsername: 'Admiral Vane',
    friendAvatar: '🌊',
    status: 'accepted',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'rel_2',
    userId: 'default_user',
    friendId: 'f2',
    friendUsername: 'Lady Eleanor',
    friendAvatar: '👑',
    status: 'accepted',
    createdAt: Date.now() - 7200000,
  },
];

const pendingInvitations: GameInvitation[] = [];

export const FriendRepository = {
  async getFriends(userId: string): Promise<FriendRelationship[]> {
    const list = friendRelationships.filter(
      (r) => (r.userId === userId || r.userId === 'default_user') && r.status === 'accepted'
    );
    return list;
  },

  async sendRequest(
    userId: string,
    friendUsername: string,
    friendAvatar = '⚓'
  ): Promise<FriendRelationship> {
    const newRel: FriendRelationship = {
      id: 'rel_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      friendId: 'f_' + Date.now(),
      friendUsername,
      friendAvatar,
      status: 'pending',
      createdAt: Date.now(),
    };
    friendRelationships.push(newRel);
    return newRel;
  },

  async acceptRequest(userId: string, requestId: string): Promise<boolean> {
    const rel = friendRelationships.find((r) => r.id === requestId);
    if (rel) {
      rel.status = 'accepted';
      return true;
    }
    return false;
  },

  async sendInvite(
    fromUserId: string,
    fromUsername: string,
    toUserId: string,
    roomCode: string,
    scenarioName?: string
  ): Promise<GameInvitation> {
    const invite: GameInvitation = {
      id: 'inv_' + Date.now(),
      fromUserId,
      fromUsername,
      toUserId,
      roomCode,
      scenarioName,
      createdAt: Date.now(),
    };
    pendingInvitations.push(invite);
    return invite;
  },

  async getInvites(userId: string): Promise<GameInvitation[]> {
    return pendingInvitations.filter((i) => i.toUserId === userId);
  },
};
