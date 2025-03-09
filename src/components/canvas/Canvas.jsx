import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Minimap from './Minimap';

const Canvas = ({ model, onModelUpdate, onElementSelect, selectedElement }) => {
  const svgRef = useRef(null);
  const [simulation, setSimulation] = useState(null);
  
  // État pour le suivi des positions des nœuds
  const [nodePositions, setNodePositions] = useState({});
  const [dragging, setDragging] = useState(false);
  const [currentlyDraggedNode, setCurrentlyDraggedNode] = useState(null);

  // Configuration du zoom et du panoramique
  const initZoom = () => {
    const svg = d3.select(svgRef.current);
    const g = svg.select('g.canvas-content');

    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        // Ne pas zoomer pendant le glisser-déposer d'un nœud
        if (!dragging) {
          g.attr('transform', event.transform);
        }
      });

    svg.call(zoom);

    // Réinitialisation du zoom sur double-clic
    svg.on('dblclick.zoom', null);
  };

  // Conversion du modèle en données pour D3
  const prepareData = () => {
    // Préparer les nœuds
    const nodes = model.nodes.map(node => {
      const position = nodePositions[node.name] || { x: 0, y: 0 };
      return {
        id: node.name,
        ...node,
        x: position.x,
        y: position.y,
        // Fixer la position
        fx: position.x,
        fy: position.y
      };
    });

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

    // D'abord, créer des groupes pour les liens et nœuds
    // Important: liens d'abord, puis nœuds pour l'affichage correct
    g.append('g').attr('class', 'links');
    g.append('g').attr('class', 'nodes');

    // Initialiser le zoom
    initZoom();

    // Créer la simulation de force
    const newSimulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id).distance(200))
      .force('charge', d3.forceManyBody().strength(-800))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(80))
      .alphaDecay(0.1) // Simulation s'arrête plus rapidement
      .velocityDecay(0.5); // Moins d'inertie

    setSimulation(newSimulation);

    // Nettoyage
    return () => {
      if (newSimulation) newSimulation.stop();
    };
  }, []);

  // Générer des positions initiales si elles n'existent pas
  useEffect(() => {
    if (!model.nodes.length || !svgRef.current) return;

    let newPositions = { ...nodePositions };
    let needsUpdate = false;

    model.nodes.forEach((node, index) => {
      if (!nodePositions[node.name]) {
        // Position en cercle pour la première fois
        const angle = (index / model.nodes.length) * 2 * Math.PI;
        const radius = Math.min(svgRef.current.clientWidth, svgRef.current.clientHeight) * 0.3;
        const centerX = svgRef.current.clientWidth / 2;
        const centerY = svgRef.current.clientHeight / 2;

        newPositions[node.name] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        };

        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      setNodePositions(newPositions);
    }
  }, [model.nodes, nodePositions]);

  // Mise à jour du graphe lorsque le modèle change
  useEffect(() => {
    if (!simulation || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select('g.canvas-content');

    const { nodes, links } = prepareData();

    // Mise à jour de la simulation
    simulation.nodes(nodes);
    simulation.force('link').links(links);

    // Dessiner les liens AVANT les nœuds pour l'ordre z-index
    const link = g.select('g.links')
      .selectAll('g.link')
      .data(links, d => d.id);

    // Supprimer les liens obsolètes
    link.exit().remove();

    // Créer les nouveaux liens
    const linkEnter = link.enter()
      .append('g')
      .attr('class', 'link')
      .style('pointer-events', 'all') // Important pour la sélection
      .on('click', (event, d) => {
        // Arrêter la propagation pour éviter de désélectionner
        event.stopPropagation();
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
      .attr('stroke-width', 1)
      .style('pointer-events', 'all'); // Important pour la sélection

    linkEnter.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '10px')
      .style('pointer-events', 'none') // Pas d'interactions avec le texte
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
      .attr('data-id', d => d.id) // Ajouter un attribut data-id pour faciliter la sélection
      .style('cursor', 'move')
      .call(d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded))
      .on('click', (event, d) => {
        // Arrêter la propagation pour éviter de désélectionner
        event.stopPropagation();
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
      .style('pointer-events', 'none') // Pas d'interactions avec le texte
      .text(d => d.name);

    // Labels
    nodeEnter.append('text')
      .attr('x', 10)
      .attr('y', 40)
      .attr('font-size', '10px')
      .attr('font-style', 'italic')
      .style('pointer-events', 'none') // Pas d'interactions avec le texte
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
      .style('pointer-events', 'none') // Pas d'interactions avec le texte
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

    // Positionner initialement tous les nœuds
    allNodes.attr('transform', d => {
      const pos = nodePositions[d.id] || { x: d.x, y: d.y };
      return `translate(${pos.x - 60}, ${pos.y - 60})`;
    });

    // Mettre à jour les liens initialement
    updateLinks(allLinks);

    // Arrêter la simulation après un certain temps pour éviter les mouvements non désirés
    simulation.stop();

    // Clic sur le SVG pour désélectionner
    svg.on('click', () => {
      onElementSelect(null);
    });

    // Fonctions pour le glisser-déposer
    function dragStarted(event, d) {
      setDragging(true);
      setCurrentlyDraggedNode(d.id);
      event.sourceEvent.stopPropagation();

      // Sauvegarder la position initiale pour le déplacement relatif
      d.dragStartX = d.x;
      d.dragStartY = d.y;
    }

    function dragged(event, d) {
      const dx = event.x - d.dragStartX;
      const dy = event.y - d.dragStartY;

      // Mise à jour de la position du nœud
      d.x = d.dragStartX + dx;
      d.y = d.dragStartY + dy;

      // Mettre à jour la position du nœud visuel
      d3.select(event.sourceEvent.target.closest('g.node'))
        .attr('transform', `translate(${d.x - 60}, ${d.y - 60})`);

      // Mettre à jour les liens connectés
      updateLinksForNode(d.id, d.x, d.y);
    }

    function dragEnded(event, d) {
      // Sauvegarder la nouvelle position dans l'état
      setNodePositions(prev => ({
        ...prev,
        [d.id]: { x: d.x, y: d.y }
      }));

      setDragging(false);
      setCurrentlyDraggedNode(null);
    }

    // Fonction pour mettre à jour les liens pour un nœud spécifique
    function updateLinksForNode(nodeId, x, y) {
      g.select('g.links').selectAll('g.link').each(function(linkData) {
        const link = d3.select(this);

        if (linkData.source.id === nodeId || linkData.target.id === nodeId) {
          // Coordonnées source et cible
          const sourceX = linkData.source.id === nodeId ? x : (nodePositions[linkData.source.id]?.x || linkData.source.x);
          const sourceY = linkData.source.id === nodeId ? y : (nodePositions[linkData.source.id]?.y || linkData.source.y);
          const targetX = linkData.target.id === nodeId ? x : (nodePositions[linkData.target.id]?.x || linkData.target.x);
          const targetY = linkData.target.id === nodeId ? y : (nodePositions[linkData.target.id]?.y || linkData.target.y);

          updateLinkPath(link, sourceX, sourceY, targetX, targetY, linkData.source.id === linkData.target.id);
        }
      });
    }

    // Fonction pour mettre à jour tous les liens
    function updateLinks(links) {
      links.each(function(d) {
        const link = d3.select(this);

        // Coordonnées source et cible
        const sourceX = nodePositions[d.source.id]?.x || d.source.x;
        const sourceY = nodePositions[d.source.id]?.y || d.source.y;
        const targetX = nodePositions[d.target.id]?.x || d.target.x;
        const targetY = nodePositions[d.target.id]?.y || d.target.y;

        updateLinkPath(link, sourceX, sourceY, targetX, targetY, d.source.id === d.target.id);
      });
    }

    // Fonction de base pour mettre à jour un chemin de lien
    function updateLinkPath(link, sourceX, sourceY, targetX, targetY, isReflexive) {
      if (isReflexive) {
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
    }
  }, [model, nodePositions, onElementSelect]);

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
        .filter(d => d.name === data.name && d.start_node === data.start_node && d.end_node === data.end_node)
        .select('path')
        .attr('stroke-width', 4);
    }
  }, [selectedElement]);

  // Redessiner le graphe après que toutes les propriétés ont été mises à jour
  useEffect(() => {
    if (model && svgRef.current) {
      const svg = d3.select(svgRef.current);
      const g = svg.select('g.nodes');

      // Mettre à jour les propriétés des nœuds
      g.selectAll('g.node').each(function(d) {
        // Trouver le nœud correspondant dans le modèle
        const modelNode = model.nodes.find(node => node.name === d.id);
        if (!modelNode) return;

        // Mettre à jour les propriétés
        const propertiesGroup = d3.select(this).select('g.properties');
        propertiesGroup.selectAll("*").remove(); // Supprimer toutes les anciennes propriétés

        // Ajouter les nouvelles propriétés
        modelNode.properties.forEach((prop, i) => {
          propertiesGroup.append('text')
            .attr('y', i * 20)
            .attr('font-size', '10px')
            .text(`${prop.name}: ${prop.type}${prop.required ? ' *' : ''}`);
        });
      });
    }
  }, [model]);

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