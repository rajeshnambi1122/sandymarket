declare module 'expo-server-sdk' {
  export class Expo {
    constructor();
    chunkPushNotifications(messages: any[]): any[];
    sendPushNotificationsAsync(messages: any[]): Promise<any[]>;
  }
} 