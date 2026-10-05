// Client-only face helpers. face-api is dynamically imported inside each
// function so the server bundle never touches it (tfjs needs the browser).

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedFace {
  photoId: string;
  box: FaceBox;
  descriptor: number[];
}

let modelsLoaded = false;

export function modelsReady(): boolean {
  return modelsLoaded;
}

export async function loadModels(onProgress?: (stage: string) => void): Promise<void> {
  if (modelsLoaded) return;
  const faceapi = await import('@vladmandic/face-api');
  onProgress?.('Loading face detector…');
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  onProgress?.('Loading landmark model…');
  await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
  onProgress?.('Loading recognition model…');
  await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
  modelsLoaded = true;
}

export async function detectFaces(
  img: HTMLImageElement,
  photoId: string,
): Promise<DetectedFace[]> {
  if (!modelsLoaded) {
    throw new Error('Face models are not loaded yet. Call loadModels() first.');
  }
  const faceapi = await import('@vladmandic/face-api');
  const detections = await faceapi
    .detectAllFaces(
      img,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }),
    )
    .withFaceLandmarks()
    .withFaceDescriptors();

  return detections.map((d) => ({
    photoId,
    box: {
      x: d.detection.box.x,
      y: d.detection.box.y,
      width: d.detection.box.width,
      height: d.detection.box.height,
    },
    descriptor: Array.from(d.descriptor),
  }));
}

export function euclidean(a: number[], b: number[]): number {
  let sum = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// Greedy centroid clustering: a face joins the nearest cluster whose
// centroid is within `threshold`, otherwise it starts a new cluster.
export function groupFaces(faces: DetectedFace[], threshold = 0.5): DetectedFace[][] {
  const clusters: DetectedFace[][] = [];
  const centroids: number[][] = [];

  for (const face of faces) {
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < centroids.length; i++) {
      const dist = euclidean(face.descriptor, centroids[i]);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    if (best >= 0 && bestDist < threshold) {
      const cluster = clusters[best];
      const c = centroids[best];
      const n = cluster.length;
      for (let j = 0; j < c.length; j++) {
        c[j] = (c[j] * n + face.descriptor[j]) / (n + 1);
      }
      cluster.push(face);
    } else {
      clusters.push([face]);
      centroids.push([...face.descriptor]);
    }
  }
  return clusters.sort((a, b) => b.length - a.length);
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = url;
  });
}
