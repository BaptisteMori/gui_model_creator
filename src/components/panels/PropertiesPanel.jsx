import React, { useState, useEffect } from 'react';

const PropertiesPanel = ({ model, selectedElement, onModelUpdate }) => {
  const [name, setName] = useState('');
  const [labels, setLabels] = useState('');
  const [properties, setProperties] = useState([]);
  const [startNode, setStartNode] = useState('');
  const [endNode, setEndNode] = useState('');

  // Mettre à jour le formulaire lorsqu'un élément est sélectionné
  useEffect(() => {
    if (selectedElement) {
      const { type, data } = selectedElement;
      
      setName(data.name || '');
      
      if (type === 'node') {
        setLabels(data.labels ? data.labels.join(', ') : '');
        setProperties(data.properties || []);
        setStartNode('');
        setEndNode('');
      } else if (type === 'relationship') {
        setLabels('');
        setProperties(data.properties || []);
        setStartNode(data.start_node || '');
        setEndNode(data.end_node || '');
      }
    } else {
      // Réinitialiser le formulaire
      setName('');
      setLabels('');
      setProperties([]);
      setStartNode('');
      setEndNode('');
    }
  }, [selectedElement]);

  // Sauvegarder les modifications
  const handleSave = () => {
    if (!selectedElement) return;
    
    const { type, data } = selectedElement;
    const updatedData = { ...data };
    
    updatedData.name = name;
    
    if (type === 'node') {
      updatedData.labels = labels.split(',').map(label => label.trim()).filter(Boolean);
    } else if (type === 'relationship') {
      updatedData.start_node = startNode;
      updatedData.end_node = endNode;
    }
    
    // Mettre à jour le modèle
    const updatedModel = { ...model };
    
    if (type === 'node') {
      updatedModel.nodes = model.nodes.map(node => 
        node.name === data.name ? updatedData : node
      );
    } else if (type === 'relationship') {
      updatedModel.relationships = model.relationships.map(rel => 
        rel.name === data.name && rel.start_node === data.start_node && rel.end_node === data.end_node 
          ? updatedData 
          : rel
      );
    }
    
    onModelUpdate(updatedModel);
  };

  // Ajouter une propriété
  const handleAddProperty = () => {
    const propertyName = prompt('Nom de la propriété:');
    if (!propertyName) return;
    
    const propertyType = prompt('Type de la propriété (str, int, float, bool, date):');
    if (!propertyType) return;
    
    // eslint-disable-next-line no-restricted-globals
    const isRequired = confirm('Cette propriété est-elle obligatoire?');
    
    const newProperty = {
      name: propertyName,
      type: propertyType,
      required: isRequired,
      description: ''
    };
    
    setProperties([...properties, newProperty]);
    
    // Mettre à jour immédiatement si un élément est sélectionné
    if (selectedElement) {
      const { type, data } = selectedElement;
      const updatedData = { ...data };
      updatedData.properties = [...properties, newProperty];
      
      const updatedModel = { ...model };
      
      if (type === 'node') {
        updatedModel.nodes = model.nodes.map(node => 
          node.name === data.name ? updatedData : node
        );
      } else if (type === 'relationship') {
        updatedModel.relationships = model.relationships.map(rel => 
          rel.name === data.name && rel.start_node === data.start_node && rel.end_node === data.end_node 
            ? updatedData 
            : rel
        );
      }
      
      onModelUpdate(updatedModel);
    }
  };

  // Supprimer une propriété
  const handleDeleteProperty = (index) => {
    const newProperties = [...properties];
    newProperties.splice(index, 1);
    setProperties(newProperties);
    
    // Mettre à jour immédiatement si un élément est sélectionné
    if (selectedElement) {
      const { type, data } = selectedElement;
      const updatedData = { ...data };
      updatedData.properties = newProperties;
      
      const updatedModel = { ...model };
      
      if (type === 'node') {
        updatedModel.nodes = model.nodes.map(node => 
          node.name === data.name ? updatedData : node
        );
      } else if (type === 'relationship') {
        updatedModel.relationships = model.relationships.map(rel => 
          rel.name === data.name && rel.start_node === data.start_node && rel.end_node === data.end_node 
            ? updatedData 
            : rel
        );
      }
      
      onModelUpdate(updatedModel);
    }
  };

  if (!selectedElement) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-bold mb-2">Propriétés</h2>
        <p className="text-gray-500 text-sm">Aucun élément sélectionné</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Propriétés</h2>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm border"
          />
        </div>
        
        {selectedElement.type === 'node' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Labels:</label>
            <input
              type="text"
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              placeholder="Séparés par des virgules"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm border"
            />
          </div>
        )}
        
        {selectedElement.type === 'relationship' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nœud de départ:</label>
              <select
                value={startNode}
                onChange={(e) => setStartNode(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm border"
              >
                <option value="">Sélectionner un nœud</option>
                {model.nodes.map(node => (
                  <option key={node.name} value={node.name}>{node.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Nœud de fin:</label>
              <select
                value={endNode}
                onChange={(e) => setEndNode(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm border"
              >
                <option value="">Sélectionner un nœud</option>
                {model.nodes.map(node => (
                  <option key={node.name} value={node.name}>{node.name}</option>
                ))}
              </select>
            </div>
          </>
        )}
        
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Propriétés:</label>
            <button
              onClick={handleAddProperty}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Ajouter
            </button>
          </div>
          <div className="mt-2 bg-white rounded-md border border-gray-300 overflow-hidden">
            {properties.length === 0 ? (
              <p className="p-3 text-sm text-gray-500">Aucune propriété</p>
            ) : (
              <div className="divide-y divide-gray-200">
                {properties.map((prop, index) => (
                  <div key={index} className="p-3 text-sm flex justify-between items-center">
                    <div>
                      <span className="font-medium">{prop.name}</span>
                      <span className="text-gray-500 ml-2">{prop.type}</span>
                      {prop.required && <span className="ml-2 text-red-500">*</span>}
                    </div>
                    <button
                      onClick={() => handleDeleteProperty(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="pt-2">
          <button
            onClick={handleSave}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-relationship hover:bg-blue-700"
          >
            Sauvegarder les modifications
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
