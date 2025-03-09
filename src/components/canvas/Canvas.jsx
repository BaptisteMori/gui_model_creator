import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Minimap from './Minimap';

const Canvas = ({ model, onModelUpdate, onElementSelect, selectedElement }) => {
  const svgRef = useRef(null);
  const [simulation, setSimulation] = useState(null);
  
  // État pour le suivi des positions des nœuds
  const [nodePositions, setNodePositions] = useState({});
  
  // Configuration du zoom
  const initZoom = () => {
    const svg = d3.select(svgRef.current);
    const g = svg.select('g.canvas-content');
    
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    
    // Réinitialisation du zoom
    svg.on('dblclick.zoom', null);
  };

  // Conversion du modèle en données pour D3
  const prepareData = () => {
    // Préparer les nœuds
    const nodes = model.nodes.map(node => ({
      id: node.name,
      ...node,
      // Utiliser les positions sauvegardées si disponibles, sinon null
      x: nodePositions[node.name]?.x,
      y: nodePositions[node.name]?.y
    }));
    
    // Préparer les liens
    const links = model.relationships.map((rel, idx) => ({
      id: `${rel.start_node}-${rel.name}-${rel.end_node}-${idx}`,
      source: rel.start_node,
      target: rel.end_node,
      ...rel
    }));
    
    return { nodes, links };
  };

  // Initialisation du graphe
  useEffect(() => {
    if (!svgRef.current) return;
    
    // Sélectionner les éléments SVG
    const svg = d3.select(svgRef.current);
    const width = svg.node().getBoundingClientRect().width;
    const height = svg.node().getBoundingClientRect().height;
    
    // Créer le conteneur principal
    svg.selectAll('*').remove();
    const g = svg.append('g').attr('class', 'canvas-content');
    
    // Créer les groupes pour les liens et nœuds
    g.append('g').attr('class', 'links');
    g.append('g').attr('class', 'nodes');
    
    // Initialiser le zoom
    initZoom();
    
    // Créer la simulation de force
    const newSimulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-800))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(80));
    
    setSimulation(newSimulation);
    
    // Nettoyage
    return () => {
      newSimulation.stop();
    };
  }, []);

  // Mise à jour du graphe lorsque le modèle change
  useEffect(() => {
    if (!simulation || !svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const g = svg.select('g.canvas-content');
    
    const { nodes, links } = prepareData();
    
    // Mise à jour de la simulation
    simulation.nodes(nodes);
    simulation.force('link').links(links);
    
    // Dessiner les liens
    const link = g.select('g.links')
      .selectAll('g.link')
      .data(links, d => d.id);
    
    // Supprimer les liens obsolètes
    link.exit().remove();
    
    // Créer les nouveaux liens
    const linkEnter = link.enter()
      .append('g')
      .attr('class', 'link')
      .on('click', (event, d) => {
        onElementSelect({ type: 'relationship', data: d });
      });
    
    linkEnter.append('path')
      .attr('class', 'link-path')
      .attr('stroke', '#2196F3')
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrowhead)');
    
    // Rectangle pour le nom de la relation
    linkEnter.append('rect')
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('fill', 'white')
      .attr('stroke', '#2196F3')
      .attr('stroke-width', 1);
    
    linkEnter.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '10px')
      .text(d => d.name);
    
    // Dessiner les nœuds
    const node = g.select('g.nodes')
      .selectAll('g.node')
      .data(nodes, d => d.id);
    
    // Supprimer les nœuds obsolètes
    node.exit().remove();
    
    // Créer les nouveaux nœuds
    const nodeEnter = node.enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded))
      .on('click', (event, d) => {
        onElementSelect({ type: 'node', data: d });
      });
    
    // Rectangle principal du nœud
    nodeEnter.append('rect')
      .attr('width', 120)
      .attr('height', 120)
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('fill', 'white')
      .attr('stroke-width', 2)
      .attr('stroke', d => d.name === 'Person' ? '#ff7043' : '#4CAF50');
    
    // Rectangle d'en-tête
    nodeEnter.append('rect')
      .attr('width', 120)
      .attr('height', 25)
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('fill', d => d.name === 'Person' ? '#ff7043' : '#4CAF50');
    
    // Titre du nœud
    nodeEnter.append('text')
      .attr('x', 60)
      .attr('y', 16)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')
      .text(d => d.name);
    
    // Labels
    nodeEnter.append('text')
      .attr('x', 10)
      .attr('y', 40)
      .attr('font-size', '10px')
      .attr('font-style', 'italic')
      .text(d => `Labels: ${d.labels.join(', ')}`);
    
    // Ligne séparatrice
    nodeEnter.append('line')
      .attr('x1', 0)
      .attr('y1', 50)
      .attr('x2', 120)
      .attr('y2', 50)
      .attr('stroke', '#ddd');
    
    // Propriétés
    nodeEnter.append('g')
      .attr('class', 'properties')
      .attr('transform', 'translate(10, 60)')
      .each(function(d) {
        const propertiesGroup = d3.select(this);
        d.properties.forEach((prop, i) => {
          propertiesGroup.append('text')
            .attr('y', i * 20)
            .attr('font-size', '10px')
            .text(`${prop.name}: ${prop.type}${prop.required ? ' *' : ''}`);
        });
      });
    
    // Mise à jour de tous les nœuds
    const allNodes = nodeEnter.merge(node);
    
    // Mise à jour de tous les liens
    const allLinks = linkEnter.merge(link);
    
    // Définir la flèche pour les liens
    svg.select('defs').remove();
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#2196F3');
    
    // Mise à jour des liens à chaque tick
    simulation.on('tick', () => {
      // Enregistrer les positions des nœuds
      const newPositions = {};
      nodes.forEach(node => {
        newPositions[node.id] = { x: node.x, y: node.y };
      });
      setNodePositions(newPositions);
      
      // Mettre à jour les positions des nœuds
      allNodes.attr('transform', d => `translate(${d.x - 60}, ${d.y - 60})`);
      
      // Mettre à jour les positions des liens
      allLinks.each(function(d) {
        const link = d3.select(this);
        
        // Coordonnées source et cible
        const sourceX = d.source.x;
        const sourceY = d.source.y;
        const targetX = d.target.x;
        const targetY = d.target.y;
        
        // Gestion des liens réflexifs
        if (d.source === d.target) {
          // Créer un arc pour les relations réflexives
          const dr = 50;
          const path = `M${sourceX},${sourceY} A${dr},${dr} 0 1,1 ${sourceX + 1},${sourceY + 1}`;
          link.select('path').attr('d', path);
          
          // Positionner le texte et le rectangle
          const textX = sourceX + 40;
          const textY = sourceY - 40;
          
          // Mettre à jour le texte
          const text = link.select('text')
            .attr('x', textX)
            .attr('y', textY);
          
          // Calculer la largeur du texte
          const textWidth = text.node().getComputedTextLength();
          
          // Mettre à jour le rectangle
          link.select('rect')
            .attr('x', textX - textWidth / 2 - 5)
            .attr('y', textY - 10)
            .attr('width', textWidth + 10)
            .attr('height', 20);
        } else {
          // Lien normal entre deux nœuds différents
          
          // Tracé du chemin
          const path = `M${sourceX},${sourceY} L${targetX},${targetY}`;
          link.select('path').attr('d', path);
          
          // Coordonnées du milieu du lien
          const midX = (sourceX + targetX) / 2;
          const midY = (sourceY + targetY) / 2;
          
          // Mettre à jour le texte
          const text = link.select('text')
            .attr('x', midX)
            .attr('y', midY);
          
          // Calculer la largeur du texte
          const textWidth = text.node().getComputedTextLength();
          
          // Mettre à jour le rectangle
          link.select('rect')
            .attr('x', midX - textWidth / 2 - 5)
            .attr('y', midY - 10)
            .attr('width', textWidth + 10)
            .attr('height', 20);
        }
      });
    });
    
    // Redémarrer la simulation avec un alpha faible
    simulation.alpha(0.3).restart();
    
    // Fonctions de glisser-déposer
    function dragStarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragEnded(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
      
      // Enregistrer les nouvelles positions
      const newPositions = { ...nodePositions };
      newPositions[d.id] = { x: d.x, y: d.y };
      setNodePositions(newPositions);
    }
  }, [model, simulation, nodePositions, onElementSelect]);

  // Mettre en évidence l'élément sélectionné
  useEffect(() => {
    if (!selectedElement || !svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const g = svg.select('g.canvas-content');
    
    // Réinitialiser toutes les sélections
    g.selectAll('g.node rect:first-child').attr('stroke-width', 2);
    g.selectAll('g.link path').attr('stroke-width', 2);
    
    const { type, data } = selectedElement;
    
    if (type === 'node') {
      // Mettre en évidence le nœud sélectionné
      g.selectAll('g.node')
        .filter(d => d.id === data.name)
        .select('rect:first-child')
        .attr('stroke-width', 4);
    } else if (type === 'relationship') {
      // Mettre en évidence la relation sélectionnée
      g.selectAll('g.link')
        .filter(d => d.id === `${data.start_node}-${data.name}-${data.end_node}`)
        .select('path')
        .attr('stroke-width', 4);
    }
  }, [selectedElement]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-canvas-bg">
      <svg 
        ref={svgRef} 
        className="w-full h-full"
      />
      <Minimap svgRef={svgRef} nodePositions={nodePositions} model={model} />
    </div>
  );
};

export default Canvas;
