export function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }

  return window.btoa(binary);
}
