import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { HuffmanNode } from '../types';

interface TreeVisualizerProps {
  root: HuffmanNode | null;
}

const TreeVisualizer: React.FC<TreeVisualizerProps> = ({ root }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root || !svgRef.current || !wrapperRef.current) return;

    // Clear previous render
    d3.select(svgRef.current).selectAll("*").remove();

    const width = wrapperRef.current.clientWidth;
    const height = 500;
    const margin = { top: 40, right: 20, bottom: 40, left: 20 };

    // Convert our HuffmanNode to D3 hierarchy
    const hierarchyData = d3.hierarchy(root, (d) => {
        const children = [];
        if (d.left) children.push(d.left);
        if (d.right) children.push(d.right);
        return children.length > 0 ? children : null;
    });

    // Create tree layout
    const treeLayout = d3.tree<HuffmanNode>()
      .size([width - margin.left - margin.right, height - margin.top - margin.bottom]);

    const rootNode = treeLayout(hierarchyData);

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Links
    svg.selectAll(".link")
      .data(rootNode.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#475569")
      .attr("stroke-width", 1.5)
      .attr("d", d3.linkVertical<any, any>()
        .x(d => d.x)
        .y(d => d.y)
      );

    // Nodes
    const nodes = svg.selectAll(".node")
      .data(rootNode.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x},${d.y})`);

    // Circle for nodes
    nodes.append("circle")
      .attr("r", 15)
      .attr("fill", d => d.data.char ? "#3b82f6" : "#1e293b") // Blue for leaf, Dark for internal
      .attr("stroke", d => d.data.char ? "#60a5fa" : "#64748b")
      .attr("stroke-width", 2);

    // Text for Character (Leaves)
    nodes.append("text")
      .attr("dy", 5)
      .attr("text-anchor", "middle")
      .text(d => {
          if (!d.data.char) return "";
          if (d.data.char === " ") return "SPC";
          if (d.data.char === "\n") return "\\n";
          return d.data.char;
      })
      .attr("font-size", "10px")
      .attr("fill", "white")
      .style("font-weight", "bold");

    // Text for Frequency (Above node)
    nodes.append("text")
      .attr("dy", -20)
      .attr("text-anchor", "middle")
      .text(d => d.data.freq)
      .attr("font-size", "10px")
      .attr("fill", "#94a3b8");
      
    // Text for 0/1 on edges
    // We iterate links to add labels
    svg.selectAll(".link-text")
      .data(rootNode.links())
      .enter()
      .append("text")
      .attr("x", d => (d.source.x + d.target.x) / 2)
      .attr("y", d => (d.source.y + d.target.y) / 2)
      .attr("dy", d => d.target.y > d.source.y ? -5 : 5) // Slight offset
      .attr("text-anchor", "middle")
      .text(d => d.target === d.source.children?.[0] ? "0" : "1") // Left is 0, Right is 1
      .attr("fill", "#fbbf24") // Amber for bits
      .attr("font-size", "10px")
      .style("background", "black");

  }, [root]);

  return (
    <div ref={wrapperRef} className="w-full bg-slate-950 rounded-lg border border-slate-800 overflow-hidden shadow-inner">
      <div className="p-2 text-xs text-slate-400 border-b border-slate-800 flex justify-between">
        <span>Huffman Tree Visualization</span>
        <span className="flex items-center gap-2">
           <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>Leaf</span>
           <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-slate-800 border border-slate-600 mr-1"></span>Internal</span>
        </span>
      </div>
      <div className="overflow-auto">
        <svg ref={svgRef} className="min-w-[600px]"></svg>
      </div>
    </div>
  );
};

export default TreeVisualizer;
