import { useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { HousekeepingTask } from '../types';

const HUB_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5097/api')
  .replace('/api', '/hubs/housekeeping');

type HubCallback = (task: HousekeepingTask) => void;

export const useHousekeepingHub = (onTaskChange: HubCallback) => {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const callbackRef = useRef(onTaskChange);
  callbackRef.current = onTaskChange;

  const connect = useCallback(async () => {
    if (connectionRef.current) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { skipNegotiation: true, transport: signalR.HttpTransportType.WebSockets })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on('TaskCreated', (task: HousekeepingTask) => callbackRef.current(task));
    connection.on('TaskUpdated', (task: HousekeepingTask) => callbackRef.current(task));
    connection.on('TaskAssigned', (task: HousekeepingTask) => callbackRef.current(task));

    try {
      await connection.start();
      await connection.invoke('JoinHousekeepingGroup');
      connectionRef.current = connection;
    } catch {
      // Hub unavailable — graceful degradation, polling still works
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      connectionRef.current?.stop();
      connectionRef.current = null;
    };
  }, [connect]);
};
