import React, { useState } from 'react';

const ToolPanel = ({ model, onModelUpdate }) => {
  const [toolMode, setToolMode] = useState(null);

  const handleAddNode = () => {
    // Si on est déjà en mode ajout de nœud, on désactive
    if (toolMode === 'add-node') {
      setToolMode(null);
      return;
    }
    
    setToolMode('add-node');
    
    // Boîte de dialogue pour créer un nouveau nœud
    const nodeName = prompt('Nom du nouveau nœud:');
    if (!nodeName) {
      setToolMode(null);
      return;
    }
    
    // Vérifier si le nœud existe déjà
    if (model.nodes.some(node => node.name === nodeName)) {
      alert('Un nœud avec ce nom existe déjà.');
      setToolMode(null);
      return;
    }
    
    // Créer un nouveau nœud
    const newNode = {
      name: nodeName,
      labels: [nodeName],
      properties: []
    };
    
    // Mettre à jour le modèle
    onModelUpdate({
      ...model,
      nodes: [...model.nodes, newNode]
    });
    
    setToolMode(null);
  };

  const handleAddRelationship = () => {
    // Si on est déjà en mode ajout de relation, on désactive
    if (toolMode === 'add-relationship') {
      setToolMode(null);
      return;
    }
    
    setToolMode('add-relationship');
    
    // Boîte de dialogue pour créer une nouvelle relation
    const relationshipName = prompt('Nom de la nouvelle relation:');
    if (!relationshipName) {
      setToolMode(null);
      return;
    }
    
    // Demander le nœud de départ
    const startNodeOptions = model.nodes.map(node => node.name).join(', ');
    const startNode = prompt(`Nœud de départ (${startNodeOptions}):`);
    if (!startNode || !model.nodes.some(node => node.name === startNode)) {
      alert('Nœud de départ invalide.');
      setToolMode(null);
      return;
    }
    
    // Demander le nœud de fin
    const endNode = prompt(`Nœud de fin (${startNodeOptions}):`);
    if (!endNode || !model.nodes.some(node => node.name === endNode)) {
      alert('Nœud de fin invalide.');
      setToolMode(null);
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
    onModelUpdate({
      ...model,
      relationships: [...model.relationships, newRelationship]
    });
    
    setToolMode(null);
  };

  const handleDelete = () => {
    // Cette fonction sera complétée plus tard pour supprimer un élément sélectionné
    alert('Pour supprimer un élément, sélectionnez-le d\'abord dans le canvas.');
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Outils</h2>
      <div className="space-y-2">
        <button 
          className={`w-full flex items-center p-2 rounded border ${toolMode === 'add-node' ? 'bg-gray-200 border-gray-400' : 'bg-white border-gray-300'}`}
          onClick={handleAddNode}
        >
          <div className="w-5 h-5 rounded-full bg-node-person mr-2"></div>
          <span>Nouveau Nœud</span>
        </button>
        
        <button 
          className={`w-full flex items-center p-2 rounded border ${toolMode === 'add-relationship' ? 'bg-gray-200 border-gray-400' : 'bg-white border-gray-300'}`}
          onClick={handleAddRelationship}
        >
          <div className="w-5 h-5 flex items-center justify-center mr-2">
            <div className="w-4 h-0.5 bg-relationship relative">
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-relationship"></div>
            </div>
          </div>
          <span>Nouvelle Relation</span>
        </button>
        
        <button 
          className="w-full flex items-center p-2 rounded border bg-white border-gray-300"
          onClick={handleDelete}
        >
          <div className="w-5 h-5 flex items-center justify-center mr-2 text-red-500">
            🗑️
          </div>
          <span>Supprimer</span>
        </button>
      </div>
    </div>
  );
};

export default ToolPanel;
