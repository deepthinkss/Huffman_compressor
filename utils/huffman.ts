import { FrequencyMap, HuffmanNode, EncodingMap, CompressionResult, CompressedFileFormat } from '../types';

// 1. Build Frequency Table (Bytes)
export const buildFrequencyMap = (data: Uint8Array): FrequencyMap => {
  const map: FrequencyMap = {};
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    map[byte] = (map[byte] || 0) + 1;
  }
  return map;
};

// 2. Build Huffman Tree
export const buildHuffmanTree = (freqMap: FrequencyMap): HuffmanNode | null => {
  // Convert map keys from string (JSON object keys) back to numbers if needed
  const queue: HuffmanNode[] = Object.entries(freqMap).map(([byteStr, freq], index) => ({
    byte: parseInt(byteStr, 10),
    freq,
    left: null,
    right: null,
    id: `leaf-${index}`
  }));

  if (queue.length === 0) return null;

  // Sort ascending by frequency
  queue.sort((a, b) => a.freq - b.freq);

  let internalNodeCount = 0;

  while (queue.length > 1) {
    const node1 = queue.shift()!;
    const node2 = queue.shift()!;

    const merged: HuffmanNode = {
      byte: null,
      freq: node1.freq + node2.freq,
      left: node1,
      right: node2,
      id: `internal-${internalNodeCount++}`
    };

    // Maintain sorted order (Binary insert optimization)
    // Finding index to insert
    let low = 0, high = queue.length;
    while (low < high) {
        const mid = (low + high) >>> 1;
        if (queue[mid].freq < merged.freq) low = mid + 1;
        else high = mid;
    }
    queue.splice(low, 0, merged);
  }

  return queue[0];
};

// 3. Generate Encoding Map
export const generateEncodingMap = (node: HuffmanNode | null, code = "", map: EncodingMap = {}): EncodingMap => {
  if (!node) return map;

  if (node.byte !== null) {
    map[node.byte] = code;
  }

  generateEncodingMap(node.left, code + "0", map);
  generateEncodingMap(node.right, code + "1", map);

  return map;
};

// Helper: Pack binary string into Base64 (Binary Safe)
// We convert bit string "010101" -> Uint8Array -> BinaryString -> Base64
const packBits = (binaryString: string): { base64: string, padding: number } => {
  const padding = (8 - (binaryString.length % 8)) % 8;
  const paddedBinary = binaryString + "0".repeat(padding);
  
  const byteCount = paddedBinary.length / 8;
  const bytes = new Uint8Array(byteCount);
  
  for (let i = 0; i < byteCount; i++) {
    // Parsing 8 characters at a time is efficient enough for JS text processing
    bytes[i] = parseInt(paddedBinary.slice(i * 8, (i + 1) * 8), 2);
  }

  // Uint8Array to Base64 (Standard browser approach for binary)
  // Using FileReader is often safer for large buffers than String.fromCharCode with apply
  let binary = '';
  const len = bytes.byteLength;
  // Chunking to avoid stack overflow in String.fromCharCode for very large files
  const CHUNK_SIZE = 0x8000; 
  for (let i = 0; i < len; i += CHUNK_SIZE) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK_SIZE)));
  }
  
  return { base64: btoa(binary), padding };
};

// Helper: Unpack Base64 to bit string
const unpackBits = (base64: string, padding: number): string => {
  const binaryStr = atob(base64);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  // Pre-allocate array for speed then join? Or simple string concat.
  // Simple concat is surprisingly optimized in V8, but array join is safer for massive strings.
  const bitParts: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    bitParts.push(bytes[i].toString(2).padStart(8, "0"));
  }

  const fullBits = bitParts.join("");
  return fullBits.slice(0, fullBits.length - padding);
};

// Main Compress Function
export const compressData = async (fileData: Uint8Array, fileName: string): Promise<CompressionResult> => {
  const startTime = performance.now();

  const frequencyMap = buildFrequencyMap(fileData);
  const treeRoot = buildHuffmanTree(frequencyMap);
  
  if (!treeRoot) throw new Error("Cannot compress empty file");

  // Edge case: Single byte repeated or just one byte
  let encodingMap: EncodingMap = {};
  if (!treeRoot.left && !treeRoot.right) {
      if(treeRoot.byte !== null) encodingMap[treeRoot.byte] = "0";
  } else {
      encodingMap = generateEncodingMap(treeRoot);
  }

  // Generate bit string
  // Optimization: Pre-allocate array? String concatenation is simplest for logic clarity
  // For production with 100MB+ files, we would stream bits directly to Uint8Array.
  // For this React demo, string accumulation is acceptable up to ~10-20MB.
  const bitsArray: string[] = [];
  for (let i = 0; i < fileData.length; i++) {
    bitsArray.push(encodingMap[fileData[i]]);
  }
  const encodedBinaryString = bitsArray.join("");

  const metaDataSizeEstimate = JSON.stringify(frequencyMap).length + fileName.length;
  const dataSize = Math.ceil(encodedBinaryString.length / 8);
  
  const endTime = performance.now();

  return {
    originalName: fileName,
    encodedBinaryString, // Kept for debug stats, though in real app we wouldn't keep this in RAM
    frequencyMap,
    encodingMap,
    originalSize: fileData.length,
    compressedSize: dataSize + metaDataSizeEstimate, 
    compressionRatio: (1 - ((dataSize + metaDataSizeEstimate) / fileData.length)) * 100,
    timing: endTime - startTime
  };
};

export const createCompressedFileContent = (result: CompressionResult): string => {
  const { base64, padding } = packBits(result.encodedBinaryString);
  const fileContent: CompressedFileFormat = {
    originalName: result.originalName,
    freq: result.frequencyMap,
    data: base64,
    padding
  };
  return JSON.stringify(fileContent);
};

// Main Decompress Function
export const decompressFile = async (fileContent: string, inputFileName?: string): Promise<{ data: Uint8Array, originalName: string }> => {
  let parsed: CompressedFileFormat;
  try {
    parsed = JSON.parse(fileContent);
  } catch (e) {
    throw new Error("Invalid .huff file format");
  }

  if (!parsed.freq || parsed.data === undefined || parsed.padding === undefined) {
    throw new Error("Corrupt .huff file: missing metadata");
  }

  const treeRoot = buildHuffmanTree(parsed.freq);
  if (!treeRoot) throw new Error("Could not reconstruct Huffman Tree");

  const bitString = unpackBits(parsed.data, parsed.padding);
  
  // Estimate size: bitString length is rough upper bound (if all codes were 1 bit)
  // Actual size is unknown without tracking, but dynamic array (push) is fine.
  // Using regular array for speed then converting to Uint8Array
  const decodedBytes: number[] = [];
  
  let currentNode = treeRoot;

  // Single byte edge case
  if (!treeRoot.left && !treeRoot.right && treeRoot.byte !== null) {
     const count = bitString.length; // Assuming "0" mapping
     for(let k=0; k<count; k++) decodedBytes.push(treeRoot.byte);
  } else {
    for (let i = 0; i < bitString.length; i++) {
      const bit = bitString[i];
      if (bit === '0') {
        if (currentNode.left) currentNode = currentNode.left;
      } else {
        if (currentNode.right) currentNode = currentNode.right;
      }

      if (!currentNode.left && !currentNode.right) {
        if (currentNode.byte !== null) {
          decodedBytes.push(currentNode.byte);
        }
        currentNode = treeRoot;
      }
    }
  }

  // Determine original name with fallback logic
  let originalName = parsed.originalName;
  if (!originalName && inputFileName) {
    // Attempt to strip .huff extension if metadata is missing
    originalName = inputFileName.replace(/\.huff$/i, '');
  }

  return { 
    data: new Uint8Array(decodedBytes), 
    originalName: originalName || "restored_file.bin" 
  };
};