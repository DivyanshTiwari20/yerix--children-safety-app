import { watchPositionAsync, getCurrentPositionAsync, Accuracy } from "expo-location";

export async function getCurrentLocation() {
  const { coords } = await getCurrentPositionAsync({ accuracy: Accuracy.Highest });
  return { lat: coords.latitude, lng: coords.longitude };
}

export function watchLocation(onLocation: (lat: number, lng: number) => void) {
  const subscription = watchPositionAsync({ accuracy: Accuracy.Highest, distanceInterval: 0 }, (ev) => {
    onLocation(ev.coords.latitude, ev.coords.longitude);
  });
  return subscription;
}
