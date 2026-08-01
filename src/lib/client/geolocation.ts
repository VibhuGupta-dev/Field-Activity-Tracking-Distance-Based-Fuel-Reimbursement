export interface CapturedLocation {
  lat: number;
  lng: number;
  accuracyMeters?: number;
}

/**
 * Edge case: "user denies location permission, or device cannot get a fix"
 * — dono cases yahan reject() ke through bubble up hote hain, caller
 * (page component) usse catch karke user-friendly error dikhata hai.
 */
export function getCurrentLocation(): Promise<CapturedLocation> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("Location permission denied. Please allow location access and try again."));
        } else {
          reject(new Error("Could not get your current location. Please try again."));
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
