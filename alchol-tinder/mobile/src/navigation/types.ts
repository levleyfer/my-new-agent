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
  Chat: { match: Match };
  VirtualCheers: { matchId: string; roomName: string };
};
