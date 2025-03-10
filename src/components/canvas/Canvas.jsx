import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Minimap from './Minimap';

const Canvas = ({
  model,
  onModelUpdate,
  onElementSelect,
  selectedElement,
  nodePositions: initialNodePositions,
  onNodePositionsUpdate
}) => {
  const svgRef = useRef(null);
  const [simulation, setSimulation] = useState(null);

  // État pour le suivi des positions des nœuds
  const [nodePositions, setNodePositions] = useState(initialNodePositions || {});
  const [dragging, setDragging] = useState(false);
  const [currentlyDraggedNode, setCurrentlyDraggedNode] = useState(null);

  // Mettre à jour l'état local lorsque les positions initiales changent
  useEffect(() => {
    if (initialNodePositions) {
      setNodePositions(initialNodePositions);
    }
  }, [initialNodePositions]);

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
    // Important: ordre de rendu - liens d'abord, puis nœuds
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
      // Propager les nouvelles positions vers le parent
      onNodePositionsUpdate(newPositions);
    }
  }, [model.nodes, nodePositions, onNodePositionsUpdate]);

  // Mise à jour du graphe lorsque le modèle change
  useEffect(() => {
    if (!simulation || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select('g.canvas-content');

    const { nodes, links } = prepareData();

    // Mise à jour de la simulation
    simulation.nodes(nodes);
    simulation.force('link').links(links);

    // Définir la flèche pour les liens
    svg.select('defs').remove();
    const defs = svg.append('defs');

    // Définition standard de la flèche
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)  // Distance de la pointe de flèche à partir de l'extrémité de la ligne
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#2196F3');

    // Définition de flèche spéciale pour les relations réflexives
    defs.append('marker')
      .attr('id', 'arrowhead-reflexive')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)  // Plus court pour les relations réflexives
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#2196F3');

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

    // Dessiner les liens APRÈS les nœuds
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
      .attr('fill', 'none');

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

    // Mise à jour de tous les liens
    const allLinks = linkEnter.merge(link);

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

      // Mettre à jour temporairement les positions locales pendant le glissement
      // Cela permet de maintenir une référence à jour pour updateLinksForNode
      const tempPositions = {
        ...nodePositions,
        [d.id]: { x: d.x, y: d.y }
      };

      // Mettre à jour les liens connectés avec les positions temporaires
      updateLinksForNode(d.id, d.x, d.y, tempPositions);
    }

    function dragEnded(event, d) {
      // Sauvegarder la nouvelle position dans l'état local
      // Utiliser une fonction de mise à jour d'état pour avoir l'état le plus récent
      setNodePositions(prevPositions => {
        const newPositions = {
          ...prevPositions,
          [d.id]: { x: d.x, y: d.y }
        };

        // Propager les nouvelles positions vers le parent
        // Assurons-nous que cela se fait avec les positions les plus récentes
        setTimeout(() => {
          onNodePositionsUpdate(newPositions);
        }, 0);

        return newPositions;
      });

      setDragging(false);
      setCurrentlyDraggedNode(null);
    }

    // Fonction pour mettre à jour les liens pour un nœud spécifique
    function updateLinksForNode(nodeId, x, y, tempPositions = null) {
      // Utiliser les positions temporaires si fournies (pendant le glissement)
      // sinon utiliser les positions stockées dans l'état
      const positions = tempPositions || nodePositions;

      g.select('g.links').selectAll('g.link').each(function(linkData) {
        const link = d3.select(this);

        if (linkData.source.id === nodeId || linkData.target.id === nodeId) {
          // Coordonnées source et cible
          const sourceX = linkData.source.id === nodeId ? x : (positions[linkData.source.id]?.x || linkData.source.x);
          const sourceY = linkData.source.id === nodeId ? y : (positions[linkData.source.id]?.y || linkData.source.y);
          const targetX = linkData.target.id === nodeId ? x : (positions[linkData.target.id]?.x || linkData.target.x);
          const targetY = linkData.target.id === nodeId ? y : (positions[linkData.target.id]?.y || linkData.target.y);

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
        // Pour les relations réflexives, créer une boucle visible à côté du nœud
        // Placer la boucle au-dessus du nœud
        const dx = 0;        // Décalage horizontal par rapport au centre du nœud
        const dy = -100;     // Décalage vertical négatif pour placer au-dessus
        const loopWidth = 80; // Largeur de la boucle

        // Créer un chemin en forme de boucle (partant du haut du nœud et y revenant)
        const path = `M${sourceX},${sourceY - 60} C${sourceX + dx - loopWidth},${sourceY + dy} ${sourceX + dx + loopWidth},${sourceY + dy} ${sourceX},${sourceY - 60}`;

        link.select('path')
          .attr('d', path)
          .attr('marker-end', 'url(#arrowhead-reflexive)');

        // Position de l'étiquette au milieu de la boucle
        const textX = sourceX + dx;
        const textY = sourceY + dy;

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
        // Décaler légèrement le point de départ/arrivée pour éviter les chevauchements
        // avec les bords des rectangles des nœuds
        const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
        const sourceOffsetX = 60 * Math.cos(angle);
        const sourceOffsetY = 60 * Math.sin(angle);
        const targetOffsetX = 60 * Math.cos(angle + Math.PI);
        const targetOffsetY = 60 * Math.sin(angle + Math.PI);

        const adjustedSourceX = sourceX + sourceOffsetX;
        const adjustedSourceY = sourceY + sourceOffsetY;
        const adjustedTargetX = targetX + targetOffsetX;
        const adjustedTargetY = targetY + targetOffsetY;

        // Tracé du chemin
        const path = `M${adjustedSourceX},${adjustedSourceY} L${adjustedTargetX},${adjustedTargetY}`;
        link.select('path')
          .attr('d', path)
          .attr('marker-end', 'url(#arrowhead)');

        // Coordonnées du milieu du lien
        const midX = (adjustedSourceX + adjustedTargetX) / 2;
        const midY = (adjustedSourceY + adjustedTargetY) / 2;

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
  }, [model, nodePositions, onElementSelect, simulation, onNodePositionsUpdate]);

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