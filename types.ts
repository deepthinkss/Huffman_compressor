export interface FrequencyMap {
  [byte: number]: number;
}

export interface HuffmanNode {
  byte: number | null; // 0-255 for leaf, null for internal
  freq: number;
  left: HuffmanNode | null;
  right: HuffmanNode | null;
  id?: string;
}

export interface EncodingMap {
  [byte: number]: string;
}

export interface CompressionResult {
  originalName: string;
  encodedBinaryString: string; // The sequence of '0's and '1's
  frequencyMap: FrequencyMap;
  encodingMap: EncodingMap;
  originalSize: number;
  compressedSize: number; // In bytes
  compressionRatio: number;
  timing: number;
}

// The structure of the saved .huff file
export interface CompressedFileFormat {
  originalName: string; // To restore .pdf, .docx etc.
  freq: FrequencyMap;
  data: string; // Base64 encoded byte array
  padding: number;
}