import React, { useState, useEffect, useRef } from 'react';

// Exemple de modèle initial basé sur les spécifications
const initialModel = {
  nodes: [
    {
      name: "Person",
      labels: ["Person", "User"],
      properties: [
        { name: "name", type: "str", required: true, description: "Le nom de la personne" }
      ]
    },
    {
      name: "Product",
      labels: ["Product", "Item"],
      properties: [
        { name: "id", type: "str", required: true, description: "L'identifiant du produit" },
        { name: "price", type: "float", required: true, description: "Le prix du produit" }
      ]
    }
  ],
  relationships: [
    {
      name: "BUYS",
      start_node: "Person",
      end_node: "Product",
      properties: [
        { name: "date", type: "date", description: "La date d'achat" }
      ]
    },
    {
      name: "KNOWS",
      start_node: "Person",
      end_node: "Person",
      properties: [
        { name: "since", type: "int", description: "Depuis combien d'années" }
      ]
    }
  ]
};

// Composant principal de l'application
const ModelEditor = () => {
  const [model, setModel] = useState(initialModel);
  const [selectedElement, setSelectedElement] = useState(null);
  const [nodePositions, setNodePositions] = useState({
    Person: { x: 150, y: 200 },
    Product: { x: 450, y: 200 }
  });
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  // Lorsqu'un élément est sélectionné
  const handleElementSelect = (type, elementData) => {
    setSelectedElement({ type, data: elementData });
  };

  // Mettre à jour le modèle
  const handleModelUpdate = (updatedModel) => {
    setModel(updatedModel);
  };

  // Ajouter un nouveau nœud
  const handleAddNode = () => {
    const nodeName = prompt("Entrez le nom du nouveau nœud:");
    if (!nodeName) return;
    
    // Vérifier si un nœud avec ce nom existe déjà
    if (model.nodes.some(node => node.name === nodeName)) {
      alert("Un nœud avec ce nom existe déjà.");
      return;
    }
    
    // Créer un nouveau nœud
    const newNode = {
      name: nodeName,
      labels: [nodeName],
      properties: []
    };
    
    // Ajouter le nœud au modèle
    const updatedModel = {
      ...model,
      nodes: [...model.nodes, newNode]
    };
    
    // Définir une position aléatoire pour le nouveau nœud
    const randomX = 100 + Math.random() * 500;
    const randomY = 100 + Math.random() * 300;
    
    // Mettre à jour les positions
    setNodePositions({
      ...nodePositions,
      [nodeName]: { x: randomX, y: randomY }
    });
    
    // Mettre à jour le modèle
    setModel(updatedModel);
  };

  // Ajouter une nouvelle relation
  const handleAddRelationship = () => {
    // Demander le nom de la relation
    const relationshipName = prompt("Entrez le nom de la nouvelle relation:");
    if (!relationshipName) return;
    
    // Lister les nœuds disponibles
    const nodeNames = model.nodes.map(node => node.name);
    const nodeList = nodeNames.join(", ");
    
    // Demander le nœud de départ
    const startNode = prompt(`Entrez le nœud de départ (${nodeList}):`);
    if (!startNode || !nodeNames.includes(startNode)) {
      alert("Nœud de départ invalide.");
      return;
    }
    
    // Demander le nœud de fin
    const endNode = prompt(`Entrez le nœud de fin (${nodeList}):`);
    if (!endNode || !nodeNames.includes(endNode)) {
      alert("Nœud de fin invalide.");
      return;
    }
    
    // Vérifier si une relation identique existe déjà
    const relationshipExists = model.relationships.some(rel => 
      rel.name === relationshipName && 
      rel.start_node === startNode && 
      rel.end_node === endNode
    );
    
    if (relationshipExists) {
      alert("Une relation identique existe déjà.");
      return;
    }
    
    // Créer une nouvelle relation
    const newRelationship = {
      name: relationshipName,
      start_node: startNode,
      end_node: endNode,
      properties: []
    };
    
    // Mettre à jour le modèle
    const updatedModel = {
      ...model,
      relationships: [...model.relationships, newRelationship]
    };
    
    setModel(updatedModel);
  };

  // Supprimer un élément (nœud ou relation)
  const handleDelete = () => {
    if (!selectedElement) {
      alert("Veuillez d'abord sélectionner un élément à supprimer.");
      return;
    }
    
    const { type, data } = selectedElement;
    
    if (type === 'node') {
      // Demander confirmation
      if (!confirm(`Êtes-vous sûr de vouloir supprimer le nœud "${data.name}" ?`)) {
        return;
      }
      
      // Supprimer le nœud
      const updatedNodes = model.nodes.filter(node => node.name !== data.name);
      
      // Supprimer également toutes les relations impliquant ce nœud
      const updatedRelationships = model.relationships.filter(rel => 
        rel.start_node !== data.name && rel.end_node !== data.name
      );
      
      // Mettre à jour le modèle
      setModel({
        ...model,
        nodes: updatedNodes,
        relationships: updatedRelationships
      });
      
      // Mettre à jour les positions
      const updatedPositions = { ...nodePositions };
      delete updatedPositions[data.name];
      setNodePositions(updatedPositions);
      
      // Désélectionner
      setSelectedElement(null);
    } else if (type === 'relationship') {
      // Demander confirmation
      if (!confirm(`Êtes-vous sûr de vouloir supprimer la relation "${data.name}" ?`)) {
        return;
      }
      
      // Supprimer la relation
      const updatedRelationships = model.relationships.filter(rel => 
        !(rel.name === data.name && 
          rel.start_node === data.start_node && 
          rel.end_node === data.end_node)
      );
      
      // Mettre à jour le modèle
      setModel({
        ...model,
        relationships: updatedRelationships
      });
      
      // Désélectionner
      setSelectedElement(null);
    }
  };

  // Ajouter une propriété à l'élément sélectionné
  const handleAddProperty = () => {
    if (!selectedElement) {
      alert("Veuillez d'abord sélectionner un élément.");
      return;
    }
    
    // Demander le nom de la propriété
    const propertyName = prompt("Entrez le nom de la propriété:");
    if (!propertyName) return;
    
    // Demander le type de la propriété
    const propertyType = prompt("Entrez le type de la propriété (str, int, float, bool, date):");
    if (!propertyType || !['str', 'int', 'float', 'bool', 'date'].includes(propertyType)) {
      alert("Type de propriété invalide.");
      return;
    }
    
    // Demander si la propriété est obligatoire
    const isRequired = confirm("Cette propriété est-elle obligatoire?");
    
    // Créer la nouvelle propriété
    const newProperty = {
      name: propertyName,
      type: propertyType,
      required: isRequired,
      description: ""
    };
    
    const { type, data } = selectedElement;
    
    if (type === 'node') {
      // Ajouter la propriété au nœud
      const updatedNodes = model.nodes.map(node => 
        node.name === data.name 
          ? { ...node, properties: [...node.properties, newProperty] }
          : node
      );
      
      // Mettre à jour le modèle
      setModel({
        ...model,
        nodes: updatedNodes
      });
      
      // Mettre à jour l'élément sélectionné
      setSelectedElement({
        type: 'node',
        data: { ...data, properties: [...data.properties, newProperty] }
      });
    } else if (type === 'relationship') {
      // Ajouter la propriété à la relation
      const updatedRelationships = model.relationships.map(rel => 
        (rel.name === data.name && rel.start_node === data.start_node && rel.end_node === data.end_node)
          ? { ...rel, properties: [...rel.properties, newProperty] }
          : rel
      );
      
      // Mettre à jour le modèle
      setModel({
        ...model,
        relationships: updatedRelationships
      });
      
      // Mettre à jour l'élément sélectionné
      setSelectedElement({
        type: 'relationship',
        data: { ...data, properties: [...data.properties, newProperty] }
      });
    }
  };

  // Exporter le modèle
  const handleExport = () => {
    const jsonData = JSON.stringify(model, null, 2);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonData);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "model.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Importer un modèle
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const importedModel = JSON.parse(event.target.result);
            
            // Validation de base
            if (!importedModel.nodes || !importedModel.relationships) {
              throw new Error('Format invalide: le modèle doit contenir "nodes" et "relationships"');
            }
            
            setModel(importedModel);
            
            // Réinitialiser les positions pour les nouveaux nœuds
            const newPositions = {};
            importedModel.nodes.forEach((node, index) => {
              const angle = (index / importedModel.nodes.length) * 2 * Math.PI;
              const radius = 200;
              const x = 400 + radius * Math.cos(angle);
              const y = 250 + radius * Math.sin(angle);
              newPositions[node.name] = { x, y };
            });
            
            setNodePositions(newPositions);
            setSelectedElement(null);
          } catch (error) {
            alert(`Erreur lors de l'importation: ${error.message}`);
          }
        };
        reader.readAsText(file);
      }
    };
    
    input.click();
  };

  // Gérer le début du glisser-déposer d'un nœud
  const handleNodeDragStart = (e, nodeName) => {
    if (!nodePositions[nodeName]) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const offsetX = e.clientX - canvasRect.left - nodePositions[nodeName].x;
    const offsetY = e.clientY - canvasRect.top - nodePositions[nodeName].y;
    
    setDraggedNode(nodeName);
    setDragOffset({ x: offsetX, y: offsetY });
  };

  // Gérer le glisser-déposer d'un nœud
  const handleNodeDrag = (e) => {
    if (!draggedNode) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left - dragOffset.x;
    const y = e.clientY - canvasRect.top - dragOffset.y;
    
    // Mettre à jour la position du nœud
    setNodePositions({
      ...nodePositions,
      [draggedNode]: { x, y }
    });
  };

  // Gérer la fin du glisser-déposer d'un nœud
  const handleNodeDragEnd = () => {
    setDraggedNode(null);
  };

  // Gérer le clic sur le canvas
  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current) {
      // Clic sur le canvas (pas sur un nœud ou une relation)
      setSelectedElement(null);
    }
  };

  // Calculer la position du milieu d'une relation
  const getRelationshipMidpoint = (relationship) => {
    const startPos = nodePositions[relationship.start_node] || { x: 0, y: 0 };
    const endPos = nodePositions[relationship.end_node] || { x: 0, y: 0 };
    
    return {
      x: (startPos.x + endPos.x) / 2,
      y: (startPos.y + endPos.y) / 2
    };
  };

  // Effet pour configurer les écouteurs d'événements pour le glisser-déposer
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (draggedNode) {
        handleNodeDrag(e);
      }
    };
    
    const handleMouseUp = () => {
      if (draggedNode) {
        handleNodeDragEnd();
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedNode]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Barre de navigation */}
      <nav className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
        <div className="text-xl font-bold">Éditeur de Modèle</div>
        <div className="flex space-x-2">
          <button 
            onClick={handleImport}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white"
          >
            Import
          </button>
          <button 
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
          >
            Export
          </button>
        </div>
      </nav>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas - Zone principale */}
        <div 
          ref={canvasRef}
          className="flex-1 bg-white relative overflow-auto"
          onClick={handleCanvasClick}
        >
          {/* Afficher les relations */}
          {model.relationships.map((relationship, index) => {
            // Obtenir les positions des nœuds
            const startPos = nodePositions[relationship.start_node] || { x: 0, y: 0 };
            const endPos = nodePositions[relationship.end_node] || { x: 0, y: 0 };
            
            // Calculer le point central pour le texte
            const midPoint = getRelationshipMidpoint(relationship);
            
            // Vérifier si c'est une relation réflexive
            const isReflexive = relationship.start_node === relationship.end_node;
            
            // Calculer le chemin de la relation
            let path = '';
            if (isReflexive) {
              // Créer un arc pour les relations réflexives
              const radius = 30;
              path = `M${startPos.x + 60},${startPos.y} A${radius},${radius} 0 1,1 ${startPos.x + 61},${startPos.y + 1}`;
              // Ajuster le point central pour le texte
              midPoint.x = startPos.x + 60;
              midPoint.y = startPos.y - 40;
            } else {
              // Tracer une ligne droite pour les relations normales
              path = `M${startPos.x + 60},${startPos.y + 75} L${endPos.x + 60},${endPos.y + 75}`;
            }
            
            // Déterminer si la relation est sélectionnée
            const isSelected = selectedElement && 
                               selectedElement.type === 'relationship' && 
                               selectedElement.data.name === relationship.name &&
                               selectedElement.data.start_node === relationship.start_node &&
                               selectedElement.data.end_node === relationship.end_node;
            
            return (
              <div key={`rel-${index}`} className="absolute">
                {/* Ligne/Arc de la relation */}
                <svg 
                  className="absolute top-0 left-0" 
                  style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                >
                  <path 
                    d={path} 
                    stroke="#2196F3" 
                    strokeWidth={isSelected ? 4 : 2} 
                    fill="none" 
                    markerEnd="url(#arrowhead)" 
                  />
                  <defs>
                    <marker 
                      id="arrowhead" 
                      markerWidth="10" 
                      markerHeight="7" 
                      refX="0" 
                      refY="3.5" 
                      orient="auto"
                    >
                      <polygon 
                        points="0 0, 10 3.5, 0 7" 
                        fill="#2196F3" 
                      />
                    </marker>
                  </defs>
                </svg>
                
                {/* Étiquette de la relation */}
                <div 
                  className={`absolute px-2 py-1 bg-white border ${isSelected ? 'border-blue-500' : 'border-blue-300'} rounded text-xs`}
                  style={{ 
                    left: midPoint.x - 20, 
                    top: midPoint.y - 10,
                    cursor: 'pointer' 
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleElementSelect('relationship', relationship);
                  }}
                >
                  {relationship.name}
                </div>
              </div>
            );
          })}
          
          {/* Afficher les nœuds */}
          {model.nodes.map((node) => {
            const position = nodePositions[node.name] || { x: 0, y: 0 };
            const isSelected = selectedElement && 
                               selectedElement.type === 'node' && 
                               selectedElement.data.name === node.name;
            
            const nodeColor = node.name === 'Person' ? '#ff7043' : '#4CAF50';
            
            return (
              <div
                key={node.name}
                className={`absolute w-120 border-2 rounded-md bg-white cursor-move ${isSelected ? 'shadow-lg' : 'shadow'}`}
                style={{ 
                  left: position.x, 
                  top: position.y,
                  borderColor: nodeColor,
                  width: '120px',
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleNodeDragStart(e, node.name);
                  handleElementSelect('node', node);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleElementSelect('node', node);
                }}
              >
                {/* En-tête du nœud */}
                <div 
                  className="p-2 text-white font-bold text-center rounded-t-sm"
                  style={{ backgroundColor: nodeColor }}
                >
                  {node.name}
                </div>
                
                {/* Labels */}
                <div className="p-2 text-xs italic text-gray-600">
                  Labels: {node.labels.join(', ')}
                </div>
                
                {/* Séparateur */}
                <div className="border-t border-gray-200"></div>
                
                {/* Propriétés */}
                <div className="p-2">
                  {node.properties.map((prop, propIndex) => (
                    <div key={propIndex} className="text-xs mb-1">
                      <span className="font-medium">{prop.name}</span>
                      <span className="text-gray-600 ml-1">{prop.type}</span>
                      {prop.required && <span className="text-red-500 ml-1">*</span>}
                    </div>
                  ))}
                  
                  {node.properties.length === 0 && (
                    <div className="text-xs text-gray-400 italic">Aucune propriété</div>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Minimap dans le coin inférieur gauche */}
          <div className="absolute left-4 bottom-4 w-32 h-32 bg-white border border-gray-300 rounded shadow-md overflow-hidden">
            {/* Contenu de la minimap */}
            <div className="relative w-full h-full">
              {model.relationships.map((rel, idx) => {
                const startPos = nodePositions[rel.start_node];
                const endPos = nodePositions[rel.end_node];
                
                if (!startPos || !endPos) return null;
                
                // Facteur d'échelle pour la minimap
                const scale = 0.15;
                
                return (
                  <svg key={`mini-rel-${idx}`} className="absolute top-0 left-0 w-full h-full">
                    <line
                      x1={startPos.x * scale + 16}
                      y1={startPos.y * scale + 16}
                      x2={endPos.x * scale + 16}
                      y2={endPos.y * scale + 16}
                      stroke="#2196F3"
                      strokeWidth={1}
                      opacity={0.7}
                    />
                  </svg>
                );
              })}
              
              {model.nodes.map((node) => {
                const pos = nodePositions[node.name];
                if (!pos) return null;
                
                // Facteur d'échelle pour la minimap
                const scale = 0.15;
                const nodeColor = node.name === 'Person' ? '#ff7043' : '#4CAF50';
                
                return (
                  <div
                    key={`mini-${node.name}`}
                    className="absolute w-4 h-4 rounded-sm opacity-70"
                    style={{
                      left: pos.x * scale + 14,
                      top: pos.y * scale + 14,
                      backgroundColor: nodeColor
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Panneau latéral */}
        <div className="w-64 bg-gray-200 overflow-y-auto flex flex-col">
          {/* Section d'outils */}
          <div className="p-4">
            <h2 className="font-bold mb-2">Outils</h2>
            <div className="space-y-2">
              <button 
                className="w-full flex items-center p-2 rounded border bg-white hover:bg-gray-100"
                onClick={handleAddNode}
              >
                <div className="w-4 h-4 rounded-full bg-node-person mr-2"></div>
                <span>Nouveau Nœud</span>
              </button>
              
              <button 
                className="w-full flex items-center p-2 rounded border bg-white hover:bg-gray-100"
                onClick={handleAddRelationship}
              >
                <div className="w-4 h-4 flex items-center justify-center mr-2">
                  <div className="w-3 h-0.5 bg-blue-500 relative">
                    <div className="absolute right-0 border-4 border-transparent border-l-blue-500"></div>
                  </div>
                </div>
                <span>Nouvelle Relation</span>
              </button>
              
              <button 
                className="w-full flex items-center p-2 rounded border bg-white hover:bg-gray-100"
                onClick={handleDelete}
              >
                <div className="w-4 h-4 flex items-center justify-center mr-2 text-red-500">
                  🗑️
                </div>
                <span>Supprimer</span>
              </button>
            </div>
          </div>
          
          {/* Séparateur */}
          <div className="border-t border-gray-300 my-2"></div>
          
          {/* Section des propriétés */}
          <div className="p-4 flex-1">
            <h2 className="font-bold mb-2">Propriétés</h2>
            
            {!selectedElement ? (
              <p className="text-sm text-gray-500">Aucun élément sélectionné</p>
            ) : (
              <div className="space-y-3">
                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom:</label>
                  <div className="mt-1 p-2 bg-gray-100 rounded text-sm">
                    {selectedElement.data.name}
                  </div>
                </div>
                
                {/* Labels (pour les nœuds) */}
                {selectedElement.type === 'node' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Labels:</label>
                    <div className="mt-1 p-2 bg-gray-100 rounded text-sm">
                      {selectedElement.data.labels.join(', ')}
                    </div>
                  </div>
                )}
                
                {/* Nœuds de départ et de fin (pour les relations) */}
                {selectedElement.type === 'relationship' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nœud de départ:</label>
                      <div className="mt-1 p-2 bg-gray-100 rounded text-sm">
                        {selectedElement.data.start_node}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nœud de fin:</label>
                      <div className="mt-1 p-2 bg-gray-100 rounded text-sm">
                        {selectedElement.data.end_node}
                      </div>
                    </div>
                  </>
                )}
                
                {/* Propriétés */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Propriétés:</label>
                    <button
                      onClick={handleAddProperty}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      + Ajouter
                    </button>
                  </div>
                  <div className="mt-1 bg-white rounded border border-gray-300 overflow-hidden">
                    {selectedElement.data.properties.length === 0 ? (
                      <p className="p-2 text-sm text-gray-500">Aucune propriété</p>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {selectedElement.data.properties.map((prop, index) => (
                          <div key={index} className="p-2 text-sm">
                            <span className="font-medium">{prop.name}</span>
                            <span className="text-gray-500 ml-2">{prop.type}</span>
                            {prop.required && <span className="ml-1 text-red-500">*</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Séparateur */}
          <div className="border-t border-gray-300 my-2"></div>
          
          {/* Liste des nœuds disponibles */}
          <div className="p-4">
            <div className="bg-gray-300 rounded p-2 font-bold text-sm flex justify-between items-center cursor-pointer">
              <span>Nœuds disponibles</span>
              <span>▼</span>
            </div>
            <div className="mt-2 space-y-1">
              {model.nodes.map((node) => (
                <div 
                  key={node.name}
                  className="flex items-center justify-between bg-gray-100 hover:bg-gray-200 rounded p-2 text-sm cursor-pointer"
                  onClick={() => handleElementSelect('node', node)}
                >
                  <span>{node.name}</span>
                  <span 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: node.name === 'Person' ? '#ff7043' : '#4CAF50' }}
                  ></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelEditor;
