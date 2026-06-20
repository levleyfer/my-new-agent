export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

import { Match } from '../api/types';

export type AppStackParamList = {
  TagSelection: undefined;
  Discover: undefined;
  Profile: undefined;
  Match: { match: Match };
  VirtualCheers: { matchId: string; roomName: string };
};
