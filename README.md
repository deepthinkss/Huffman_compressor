# Huffman Coding Visualizer (React)

An interactive React application that demonstrates Huffman coding, including:

- Building the Huffman tree  
- Tree visualization  
- Character frequency table  
- Compression and decompression  
- Binary code generation  

---

## Features

- Real-time Huffman Tree creation  
- Graph-based visualization (D3.js)  
- Text compression to Huffman bitstring  
- Decompression from encoded data  
- Modular algorithms for reuse  

---

## Tech Stack

- React (Vite or Create-React-App)  
- D3.js (tree visualization)  
- JavaScript / TypeScript  
- TailwindCSS or CSS Modules  

---

## Project Structure

## Project Structure


huffman-coding-visualizer/
│
├── public/
│   └── index.html
│
├── src/
│   ├── components/
│   │   ├── FrequencyTable.jsx
│   │   ├── HuffmanTree.jsx
│   │   ├── Encoder.jsx
│   │   ├── Decoder.jsx
│   │   └── Controls.jsx
│   │
│   ├── algorithms/
│   │   ├── huffman.js
│   │   ├── priorityQueue.js
│   │   └── treeUtils.js
│   │
│   ├── utils/
│   │   ├── binaryUtils.js
│   │   └── textHelpers.js
│   │
│   ├── styles/
│   │   └── globals.css
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── package.json
├── vite.config.js
└── README.md
