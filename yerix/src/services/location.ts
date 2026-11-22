import {
  Accuracy,
  getCurrentPositionAsync,
  getForegroundPermissionsAsync,
  requestForegroundPermissionsAsync,
  watchPositionAsync,
} from "expo-location";
import { Alert } from "react-native";

export type Coordinates = { lat: number; lng: number };

export async function getCurrentLocation(): Promise<Coordinates | null> {
  try {
    let permission = await getForegroundPermissionsAsync();
    if (!permission.granted) permission = await requestForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Location permission needed");
      return null;
    }

    const { coords } = await getCurrentPositionAsync({ accuracy: Accuracy.Highest });
    return { lat: coords.latitude, lng: coords.longitude };
  } catch (error) {
    console.error("Failed to get current location", error);
    Alert.alert("Unable to get location");
    return null;
  }
}

export async function watchLocation(
  onLocation: (lat: number, lng: number) => void
): Promise<{ remove: () => void } | null> {
  try {
    const permission = await getForegroundPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Location permission needed");
      return null;
    }

    return await watchPositionAsync({ accuracy: Accuracy.Highest, distanceInterval: 0 }, (event) => {
      onLocation(event.coords.latitude, event.coords.longitude);
    });
  } catch (error) {
    console.error("Failed to watch location", error);
    Alert.alert("Unable to share location");
    return null;
  }
}
