interface HapticEventSchema {
  eventName: string;
}

interface ClickstreamSchema {
  eventName: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  };
  data: any;
}

interface EndGameSchema {
  score: number;
  multiplier: number;
  difficulty_setting: number;
  slice_percentage: number;
  game_id: string;
  user_id: string;
}

interface GameSchema {
  gameId: string;
  userId: string;
  gameStatus: string;
  timestamp: string;
  playerData: {
    score: number;
    livesLeft: number;
    level: number;
  };
}

interface NewGameEventSchema {
  gameId: string;
  userId: string;
  maxScore: number;
  gameplayVariant: number; // 0 - P2P, 1 - P2M
  difficultySetting: number;
  userHasMoreGames: boolean;
}

export const schemas = {
  clickstreamEventSchema: {} as ClickstreamSchema,
  hapticEventsSchema: {} as HapticEvent,
  endGameSchema: {} as EndGameSchema,
  gameSchema: {} as GameSchema,
  newGameEventSchema: {} as NewGameEventSchema,
};
