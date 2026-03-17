import { useState } from 'react';
import type { CarMetadata, PinataResponse } from '@/types';

const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || '';

interface UploadProgress {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export function useIPFS() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    status: 'idle',
    progress: 0,
  });

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!PINATA_JWT) {
      console.error('Pinata JWT not configured');
      setUploadProgress({ status: 'error', progress: 0, error: 'IPFS not configured' });
      return null;
    }

    setUploadProgress({ status: 'uploading', progress: 0 });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data: PinataResponse = await response.json();
      setUploadProgress({ status: 'success', progress: 100 });
      return data.IpfsHash;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      setUploadProgress({ status: 'error', progress: 0, error: message });
      return null;
    }
  };

  const uploadMetadata = async (metadata: CarMetadata): Promise<string | null> => {
    if (!PINATA_JWT) {
      console.error('Pinata JWT not configured');
      setUploadProgress({ status: 'error', progress: 0, error: 'IPFS not configured' });
      return null;
    }

    setUploadProgress({ status: 'uploading', progress: 50 });

    try {
      const response = await fetch(`${PINATA_API_URL}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `${metadata.name}-metadata.json`,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload metadata');
      }

      const data: PinataResponse = await response.json();
      setUploadProgress({ status: 'success', progress: 100 });
      return data.IpfsHash;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      setUploadProgress({ status: 'error', progress: 0, error: message });
      return null;
    }
  };

  const resetProgress = () => {
    setUploadProgress({ status: 'idle', progress: 0 });
  };

  return {
    uploadImage,
    uploadMetadata,
    uploadProgress,
    resetProgress,
  };
}
