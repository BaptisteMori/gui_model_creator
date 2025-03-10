import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Minimap = ({ svgRef, nodePositions, model }) => {
  const minimapRef = useRef(null);
  
  useEffect(() => {
    if (!minimapRef.current || !svgRef.current || Object.keys(nodePositions).length === 0) return;
    
    // Dimensions de la minimap
    const minimapWidth = 100;
    const minimapHeight = 100;
    
    // Sélectionner les éléments SVG
    const minimap = d3.select(minimapRef.current);
    minimap.selectAll('*').remove();
    
    // Dimensions du canvas principal
    const canvasSvg = d3.select(svgRef.current);
    const canvasWidth = canvasSvg.node().getBoundingClientRect().width;
    const canvasHeight = canvasSvg.node().getBoundingClientRect().height;
    
    // Calculer l'échelle
    const positions = Object.values(nodePositions);
    if (positions.length === 0) return;
    
    // Trouver les limites des positions des nœuds
    let minX = Math.min(...positions.map(p => p.x));
    let maxX = Math.max(...positions.map(p => p.x));
    let minY = Math.min(...positions.map(p => p.y));
    let maxY = Math.max(...positions.map(p => p.y));
    
    // Ajouter une marge
    const margin = 100;
    minX -= margin;
    maxX += margin;
    minY -= margin;
    maxY += margin;
    
    // Calculer l'échelle
    const scaleX = minimapWidth / (maxX - minX || 1);
    const scaleY = minimapHeight / (maxY - minY || 1);
    const scale = Math.min(scaleX, scaleY);
    
    // Fonction pour convertir les coordonnées
    const convertX = x => (x - minX) * scale;
    const convertY = y => (y - minY) * scale;
    
    // Dessiner le fond
    minimap.append('rect')
      .attr('width', minimapWidth)
      .attr('height', minimapHeight)
      .attr('fill', 'white')
      .attr('stroke', '#ddd');
    
    // Dessiner les liens
    model.relationships.forEach(rel => {
      const source = nodePositions[rel.start_node];
      const target = nodePositions[rel.end_node];
      
      if (source && target) {
        minimap.append('line')
          .attr('x1', convertX(source.x))
          .attr('y1', convertY(source.y))
          .attr('x2', convertX(target.x))
          .attr('y2', convertY(target.y))
          .attr('stroke', '#2196F3')
          .attr('stroke-width', 1)
          .attr('opacity', 0.7);
      }
    });
    
    // Dessiner les nœuds
    model.nodes.forEach(node => {
      const position = nodePositions[node.name];
      if (position) {
        minimap.append('rect')
          .attr('x', convertX(position.x) - 5)
          .attr('y', convertY(position.y) - 5)
          .attr('width', 10)
          .attr('height', 10)
          .attr('fill', node.name === 'Person' ? '#ff7043' : '#4CAF50')
          .attr('opacity', 0.7);
      }
    });
    
    // Dessiner le cadre de visualisation
    // Cela représente la partie visible du canvas
    minimap.append('rect')
      .attr('width', minimapWidth)
      .attr('height', minimapHeight)
      .attr('fill', 'none')
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2');
    
  }, [svgRef, nodePositions, model]);

  return (
    <div className="absolute left-5 bottom-5">
      <svg 
        ref={minimapRef} 
        width="100" 
        height="100" 
        className="shadow-md rounded"
      />
    </div>
  );
};

export default Minimap;