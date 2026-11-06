import { createCommand } from 'lexical'

export type UploadImage = (file: File, options: { signal: AbortSignal }) => Promise<string>

export const UPLOAD_IMAGES = createCommand<{ files: File[]; alt: string }>('rte-upload-images')
