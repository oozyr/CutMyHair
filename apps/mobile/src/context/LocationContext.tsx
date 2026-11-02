import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';

export const CHERAS_COORDINATES = {
  lat: 3.139,
  lng: 101.6869,
};

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationContextValue {
  location: Coordinates;
  isUsingDeviceLocation: boolean;
  permissionStatus: Location.PermissionStatus | null;
  loading: boolean;
  error: string | null;
  requestDeviceLocation: () => Promise<boolean>;
  setLocation: (loc: Coordinates) => void;
  resetToCheras: () => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<Coordinates>(CHERAS_COORDINATES);
  const [isUsingDeviceLocation, setIsUsingDeviceLocation] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check initial permission on startup without prompting
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        setPermissionStatus(status);
      } catch {
        // Fallback silently to defaults
      }
    })();
  }, []);

  const requestDeviceLocation = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== Location.PermissionStatus.GRANTED) {
        setIsUsingDeviceLocation(false);
        setLocationState(CHERAS_COORDINATES);
        return false;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newCoords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setLocationState(newCoords);
      setIsUsingDeviceLocation(true);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not retrieve device location';
      setError(msg);
      setLocationState(CHERAS_COORDINATES);
      setIsUsingDeviceLocation(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const setLocation = useCallback((coords: Coordinates) => {
    setLocationState(coords);
  }, []);

  const resetToCheras = useCallback(() => {
    setLocationState(CHERAS_COORDINATES);
    setIsUsingDeviceLocation(false);
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        isUsingDeviceLocation,
        permissionStatus,
        loading,
        error,
        requestDeviceLocation,
        setLocation,
        resetToCheras,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
