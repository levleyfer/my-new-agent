import { Match } from '../api/types';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  TagSelection: undefined;
  Discover: undefined;
  Profile: undefined;
  Matches: undefined;
  BlockedUsers: undefined;
  Match: { match: Match };
  Chat: { matchId: string };
  VirtualCheers: { matchId: string; roomName: string; token: string };
};
