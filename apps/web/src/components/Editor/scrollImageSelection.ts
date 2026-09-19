export interface ScrollImageSelection {
  file: File;
  url: string;
}

export const scrollImageFileKey = (file: File): string =>
  `${file.name}:${file.size}:${file.lastModified}`;
