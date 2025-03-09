import { useState, useEffect, useCallback } from 'react';

/**
 * Hook pour gérer les interactions avec le canvas
 * @param {Object} modelData - Données du modèle
 * @param {Function} onModelUpdate - Fonction de mise à jour du modèle
 * @param {Function} onElementSelect - Fonction de sélection d'un élément
 */
const useCanvasInteraction = (modelData, onModelUpdate, onElementSelect) => {
  // Mode d'interaction actuel
  const [interactionMode, setInteractionMode] = useState(null);
  
  // Éléments en cours de modification
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedRelationship, setSelectedRelationship] = useState(null);
  
  // Positions des nœuds sur le canvas
  const [nodePositions, setNodePositions] = useState({});
  
  // Élément temporaire pour la création de relation
  const [tempRelationship, setTempRelationship] = useState(null);
  
  // Réinitialiser le mode d'interaction
  const resetInteraction = useCallback(() => {
    setInteractionMode(null);
    setSelectedNodeId(null);
    setSelectedRelationship(null);
    setTempRelationship(null);
  }, []);
  
  // Démarrer le mode d'ajout de nœud
  const startAddNodeMode = useCallback(() => {
    setInteractionMode('add-node');
  }, []);
  
  // Démarrer le mode d'ajout de relation
  const startAddRelationshipMode = useCallback(() => {
    setInteractionMode('add-relationship');
  }, []);
  
  // Démarrer le mode de suppression
  const startDeleteMode = useCallback(() => {
    setInteractionMode('delete');
  }, []);
  
  // Ajouter un nœud à une position spécifique
  const addNode = useCallback((nodeData, position) => {
    if (!nodeData || !position) return;
    
    const newNode = {
      ...nodeData,
      id: nodeData.name,
    };
    
    // Mettre à jour le modèle
    const updatedModel = {
      ...modelData,
      nodes: [...modelData.nodes, newNode]
    };
    
    // Mettre à jour les positions
    setNodePositions(prev => ({
      ...prev,
      [newNode.id]: position
    }));
    
    onModelUpdate(updatedModel);
    resetInteraction();
  }, [modelData, onModelUpdate, resetInteraction]);
  
  // Ajouter une relation entre deux nœuds
  const addRelationship = useCallback((startNodeId, endNodeId, relationshipData) => {
    if (!startNodeId || !endNodeId || !relationshipData) return;
    
    const newRelationship = {
      ...relationshipData,
      start_node: startNodeId,
      end_node: endNodeId,
    };
    
    // Mettre à jour le modèle
    const updatedModel = {
      ...modelData,
      relationships: [...modelData.relationships, newRelationship]
    };
    
    onModelUpdate(updatedModel);
    resetInteraction();
  }, [modelData, onModelUpdate, resetInteraction]);
  
  // Supprimer un nœud
  const deleteNode = useCallback((nodeId) => {
    if (!nodeId) return;
    
    // Filtrer le nœud à supprimer
    const updatedNodes = modelData.nodes.filter(node => node.name !== nodeId);
    
    // Supprimer également toutes les relations impliquant ce nœud
    const updatedRelationships = modelData.relationships.filter(rel => 
      rel.start_node !== nodeId && rel.end_node !== nodeId
    );
    
    // Mettre à jour le modèle
    const updatedModel = {
      ...modelData,
      nodes: updatedNodes,
      relationships: updatedRelationships
    };
    
    onModelUpdate(updatedModel);
    
    // Supprimer également de la liste des positions
    setNodePositions(prev => {
      const newPositions = { ...prev };
      delete newPositions[nodeId];
      return newPositions;
    });
    
    resetInteraction();
  }, [modelData, onModelUpdate, resetInteraction]);
  
  // Supprimer une relation
  const deleteRelationship = useCallback((relationship) => {
    if (!relationship) return;
    
    // Filtrer la relation à supprimer
    const updatedRelationships = modelData.relationships.filter(rel => 
      !(rel.name === relationship.name && 
        rel.start_node === relationship.start_node && 
        rel.end_node === relationship.end_node)
    );
    
    // Mettre à jour le modèle
    const updatedModel = {
      ...modelData,
      relationships: updatedRelationships
    };
    
    onModelUpdate(updatedModel);
    resetInteraction();
  }, [modelData, onModelUpdate, resetInteraction]);
  
  // Mettre à jour la position d'un nœud
  const updateNodePosition = useCallback((nodeId, position) => {
    if (!nodeId || !position) return;
    
    setNodePositions(prev => ({
      ...prev,
      [nodeId]: position
    }));
  }, []);
  
  // Gérer les clics sur le canvas en fonction du mode
  const handleCanvasClick = useCallback((event, element) => {
    // Traiter en fonction du mode d'interaction
    switch (interactionMode) {
      case 'add-node':
        // Ici, on demanderait normalement les détails du nœud
        // Pour cet exemple, nous créons un nœud générique
        addNode({
          name: `NewNode_${Date.now()}`,
          labels: [`NewNode_${Date.now()}`],
          properties: []
        }, { x: event.clientX, y: event.clientY });
        break;
        
      case 'add-relationship':
        if (element && element.type === 'node') {
          if (!selectedNodeId) {
            // Premier nœud sélectionné
            setSelectedNodeId(element.id);
            setTempRelationship({
              start: { id: element.id, x: element.x, y: element.y }
            });
          } else if (element.id !== selectedNodeId) {
            // Deuxième nœud sélectionné, créer la relation
            addRelationship(selectedNodeId, element.id, {
              name: `REL_${Date.now()}`,
              properties: []
            });
          }
        }
        break;
        
      case 'delete':
        if (element) {
          if (element.type === 'node') {
            deleteNode(element.id);
          } else if (element.type === 'relationship') {
            deleteRelationship(element.data);
          }
        }
        break;
        
      default:
        // Mode normal, sélectionner l'élément
        if (element) {
          onElementSelect(element);
        } else {
          onElementSelect(null);
        }
    }
  }, [interactionMode, selectedNodeId, addNode, addRelationship, deleteNode, deleteRelationship, onElementSelect]);
  
  // Gérer le mouvement de la souris pour la création de relation
  const handleMouseMove = useCallback((event) => {
    if (interactionMode === 'add-relationship' && tempRelationship && tempRelationship.start) {
      setTempRelationship({
        ...tempRelationship,
        end: { x: event.clientX, y: event.clientY }
      });
    }
  }, [interactionMode, tempRelationship]);
  
  // Écouter les mouvements de la souris pour le mode d'ajout de relation
  useEffect(() => {
    if (interactionMode === 'add-relationship') {
      window.addEventListener('mousemove', handleMouseMove);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [interactionMode, handleMouseMove]);
  
  return {
    interactionMode,
    startAddNodeMode,
    startAddRelationshipMode,
    startDeleteMode,
    resetInteraction,
    handleCanvasClick,
    nodePositions,
    updateNodePosition,
    tempRelationship
  };
};

export default useCanvasInteraction;
