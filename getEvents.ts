//code to send events and receive events from/to a game to/from a native app (this implementation is for Android

import Ajv from 'ajv';
import {
  NewGameEventSchema,
  EndGameSchema,
  HapticEvent,
  Schemas,
  //add in any other scema's missing if needed
} from './schema';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const ajv = new Ajv();
let currentCallbackId: number = 0;
function generateCallbackId(): number {
  return ++currentCallbackId;
}
type Handler = (data?: any) => void;
const handlers: Record<string, Handler> = {};

interface JSBridgeInterface {
  registerHandler: (name: string, handler: Handler) => void;
  callHandler: (name: string, data: any, callback: Handler) => void;
  _handleMessageFromNative: (message: string) => void;
  responseCallbacks: Record<number, Handler>;
  validateSchema: (data: any, schema: any) => boolean;
  sendDataToPlatform: (data: any) => void;
  callNative: (message: any) => void;
}

declare global {
  interface Window {
    JSBridge: JSBridgeInterface & { callNative: (message: any) => void };
    android?: { receiveMessageFromJS: (message: string) => void }; 
  }
}

const JSBridge: JSBridgeInterface & { callNative: (message: any) => void } = {
  registerHandler: function (name, handler) {
    if (typeof name === 'string' && typeof handler === 'function') {
      handlers[name] = handler;
      console.log(`Registered handler "${name}"`);
    } else {
      console.error('Invalid arguments for registerHandler');
    }
  },
  callHandler: function (name, data, callback) {
    if (typeof name === 'string' && handlers[name]) {
      const callbackId = generateCallbackId();
      const message = {
        handlerName: name,
        data: data,
        callbackId: callbackId,
      };

      if (typeof callback === 'function') {
        JSBridge.responseCallbacks[callbackId] = callback;
      }

      if (window.JSBridge && typeof window.JSBridge.callNative === 'function') {
        window.JSBridge.callNative(message); //for this to work In Android application, need to link a similar interface to the WebView....so you guys need to create the interface on your end for me to call, so callNative is a placeholder
      } else {
        console.error(
          'JSBridge is not available or callNative function is not defined.'
        );
      }
    } else {
      console.error('Invalid arguments for callHandler');
    }
  },
  _handleMessageFromNative: function (message) {
    const messageObj = JSON.parse(message);

    if (messageObj && messageObj.eventType === 'new_game_payload') {
      if (
        JSBridge.validateSchema(messageObj.data, Schemas.newGameEventSchema)
      ) {
        // Call a function to handle new game payload @anhkhoacsagio need to add import for starting a new game
        handleNewGamePayload(messageObj.data);
      }
    } else if (messageObj && messageObj.callbackId) {
      const callbackId = messageObj.callbackId;
      const responseData = messageObj.responseData;

      if (JSBridge.responseCallbacks.hasOwnProperty(callbackId)) {
        const callback = JSBridge.responseCallbacks[callbackId];
        if (typeof callback === 'function') {
          callback(responseData);
        }
        delete JSBridge.responseCallbacks[callbackId];
      }
    }
  },
  responseCallbacks: {},
  validateSchema: function (data, schema) {
    const validate = ajv.compile(schema);
    const valid = validate(data);
    if (!valid) {
      console.error('Validation failed:', validate.errors);
    }
    return valid as boolean;
  },
  sendDataToPlatform: function (data) {
    if (typeof window !== 'undefined') {
      window.parent.postMessage(data, '*'); //Be careful, can potentially be a security vulnerability Make sure you are in control of all possible parent frames. Make sure to specify the target origin correctly instead of using "*" if worried about vulnerabillity
    }
  },
  callNative: function (message) {
    if (
      typeof window !== 'undefined' &&
      window?.android?.receiveMessageFromJS
    ) {
      try {
        window.android.receiveMessageFromJS(JSON.stringify(message));
      } catch (err) {
        console.error('Error sending message to native Android app:', err);
      }
    } else {
      console.error('Not running in an Android WebView');
    }
  },
};

//to request the next game
function requestNextGame() {
  const message = {
    action: 'request_next_game',
  };
  JSBridge.callNative(message);
}

function handleNewGamePayload(data: NewGameEventSchema) {
  // Placeholder: Replace this with the actual function or module that starts a new game. @anhkhoa738
  const startNewGame = (gameData: NewGameEventSchema) => {
    console.log(
      'Starting a new game with the following parameters: ',
      gameData
    );
    // game initialization code here.
  };
  // Check  required properties
  if (
    'game_id' in data &&
    'user_id' in data &&
    'max_score' in data &&
    'gameplay_variant' in data &&
    'difficulty_setting' in data &&
    'user_has_more_games' in data
  ) {
    startNewGame(data);
  } else {
    console.error('Missing data for new game payload:', data);
  }
}

JSBridge.registerHandler('new_game_payload', handleNewGamePayload);

function handleGameEndedPayload(data: EndGameSchema) {
  if (
    'game_id' in data &&
    'user_id' in data &&
    'score' in data &&
    'multiplier' in data &&
    'difficulty_setting' in data &&
    'slice_percentage' in data
  ) {
    // Here add any game-end handling code.

    // example:
    console.log('Game ended with the following parameters: ', data);

    // Then, send data to the native platform:
    JSBridge.sendDataToPlatform(data);
  } else {
    console.error('Missing data for game ended payload:', data);
  }
  // Add a call to request next game after handling the game end event
  requestNextGame();
}

JSBridge.registerHandler('game_ended', handleGameEndedPayload);

// ...existing haptic events handling...

// Notify Android that you're ready to receive and send data
JSBridge.callNative({ action: 'ready' });

async function getHapticEventsData(): Promise<HapticEvent[]> {
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
    const impactEvent: HapticEvent = {
      eventName: 'impactEvent',
    };

    await Haptics.notification();
    const notificationEvent: HapticEvent = {
      eventName: 'notificationEvent',
    };

    await Haptics.vibrate();
    const vibrateEvent: HapticEvent = {
      eventName: 'vibrateEvent',
    };

    await Haptics.selectionStart();
    const selectionEventStart: HapticEvent = {
      eventName: 'selectionEventStart',
    };

    await Haptics.selectionChanged();
    const selectionEventChange: HapticEvent = {
      eventName: 'selectionEventChange',
    };

    await Haptics.selectionEnd();
    const selectionEventEnd: HapticEvent = {
      eventName: 'selectionEventEnd',
    };

    return [
      impactEvent,
      notificationEvent,
      vibrateEvent,
      selectionEventStart,
      selectionEventChange,
      selectionEventEnd,
    ];
  } catch (error) {
    console.warn('Failed to get haptic events data,:', error);
    return [];
  }
}

async function sendHapticEventsToPlatform(data: HapticEvent[]): Promise<void> {
  if (JSBridge) {
    const isValidSchema = JSBridge.validateSchema(
      data,
      Schemas.hapticEventsSchema
    );
    if (isValidSchema) {
      JSBridge.sendDataToPlatform(data);
    } else {
      console.error('JSON data does not match the schema.');
    }
  } else {
    console.error('JSBridge is not available.');
  }
}

getHapticEventsData().then((hapticEvents: HapticEvent[]) => {
  if (hapticEvents.length > 0) {
    console.log('Haptic events data:', hapticEvents);
    sendHapticEventsToPlatform(hapticEvents);
  }
});

// Notify Android that you're ready to receive and send data
JSBridge.callNative({ action: 'ready' }); //can change so it fits the communication protocol Android app expects
