import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

import { api } from "./api";

type UsePhotoCaptureOptions<T> = {
  task: string;
  screen: string;
  quality: number;
  permissionDeniedMessage: string;
  failureMessage: string;
  capture: (uri: string) => Promise<T>;
  onCaptured: (result: T, uri: string) => void;
};

export function usePhotoCapture<T>({
  task,
  screen,
  quality,
  permissionDeniedMessage,
  failureMessage,
  capture,
  onCaptured,
}: UsePhotoCaptureOptions<T>) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pick(fromCamera: boolean) {
    setBusy(true);
    setError(null);
    api.logEvent({ event_type: "task_started", task, screen });
    try {
      const permission = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError(permissionDeniedMessage);
        return;
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality })
        : await ImagePicker.launchImageLibraryAsync({ quality });
      if (result.canceled || !result.assets[0]) return;
      const uri = result.assets[0].uri;
      const captured = await capture(uri);
      onCaptured(captured, uri);
    } catch (err) {
      setError(err instanceof Error ? err.message : failureMessage);
    } finally {
      setBusy(false);
    }
  }

  return { pick, busy, error };
}
