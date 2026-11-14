import type { GeoPoint } from './types';

interface SpeechRecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function speechConstructor(): SpeechRecognitionConstructor | undefined {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function isSpeechSupported(): boolean {
  return speechConstructor() !== undefined;
}

export function listenOnce(lang: string): Promise<string> {
  const Recognition = speechConstructor();
  if (!Recognition) return Promise.reject(new Error('unsupported'));
  return new Promise((resolve, reject) => {
    const recognition = new Recognition();
    let heard = '';
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      heard = Array.from(event.results, (result) => result[0].transcript).join(' ');
    };
    recognition.onerror = (event) => reject(new Error(event.error));
    recognition.onend = () => resolve(heard);
    recognition.start();
  });
}

export function currentPosition(): Promise<GeoPoint | undefined> {
  if (!('geolocation' in navigator)) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: Math.round(pos.coords.latitude * 1e5) / 1e5,
          lng: Math.round(pos.coords.longitude * 1e5) / 1e5,
        }),
      () => resolve(undefined),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

export async function compressPhoto(file: File, maxSide = 1024): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', 0.7));
}

export function waNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^00/, '').replace(/^0(?=\d{10}$)/, '');
  return digits.length === 10 ? `91${digits}` : digits;
}

export function whatsappLink(phone: string, text: string): string {
  const number = waNumber(phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function appUrl(path = ''): string {
  return new URL(`${import.meta.env.BASE_URL}${path}`, window.location.origin).href;
}
