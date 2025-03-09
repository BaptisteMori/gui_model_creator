import React, { useState, useEffect } from 'react';

const PropertiesPanel = ({ model, selectedElement, onModelUpdate }) => {
  // États pour les données existantes
  const [name, setName] = useState('');
  const [labels, setLabels] = useState('');
  const [properties, setProperties] = useState([]);
  const [startNode, setStartNode] = useState('');
  const [endNode, setEndNode] = useState('');

  // États pour l'ajout de nouveaux éléments
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newPropertyType, setNewPropertyType] = useState('str');
  const [newPropertyRequired, setNewPropertyRequired] = useState(false);

  // Mode de création
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Mettre à jour le formulaire lorsqu'un élément est sélectionné
  useEffect(() => {
    if (selectedElement) {
      const { type, data } = selectedElement;

      // Détecter si nous sommes en mode création
      setIsCreatingNew(type === 'new_node' || type === 'new_relationship');

      setName(data.name || '');

      if (type === 'node' || type === 'new_node') {
        setLabels(data.labels ? data.labels.join(', ') : '');
        setProperties(data.properties || []);
        setStartNode('');
        setEndNode('');
      } else if (type === 'relationship' || type === 'new_relationship') {
        setLabels('');
        setProperties(data.properties || []);
        setStartNode(data.start_node || '');
        setEndNode(data.end_node || '');
      }
    } else {
      // Réinitialiser le formulaire
      setIsCreatingNew(false);
      setName('');
      setLabels('');
      setProperties([]);
      setStartNode('');
      setEndNode('');
    }

    // Réinitialiser aussi le formulaire d'ajout de propriété
    setShowAddProperty(false);
    setNewPropertyName('');
    setNewPropertyType('str');
    setNewPropertyRequired(false);
  }, [selectedElement]);

  // Sauvegarder les modifications
  const handleSave = () => {
    if (isCreatingNew) {
      handleCreateNewItem();
      return;
    }

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

    updatedData.properties = properties;

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
    // Valider les données
    if (!newPropertyName.trim()) {
      alert("Le nom de la propriété est requis");
      return;
    }

    // Vérifier si la propriété existe déjà
    if (properties.some(p => p.name === newPropertyName.trim())) {
      alert("Une propriété avec ce nom existe déjà");
      return;
    }

    const newProperty = {
      name: newPropertyName.trim(),
      type: newPropertyType,
      required: newPropertyRequired,
      description: ''
    };

    const updatedProperties = [...properties, newProperty];
    setProperties(updatedProperties);

    // Si un élément est sélectionné et pas en mode création, mettre immédiatement à jour le modèle
    if (selectedElement && !isCreatingNew) {
      const { type, data } = selectedElement;
      const updatedData = { ...data, properties: updatedProperties };

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

    // Réinitialiser le formulaire d'ajout de propriété
    setShowAddProperty(false);
    setNewPropertyName('');
    setNewPropertyType('str');
    setNewPropertyRequired(false);
  };

  // Supprimer une propriété
  const handleDeleteProperty = (index) => {
    const newProperties = [...properties];
    newProperties.splice(index, 1);
    setProperties(newProperties);

    // Si un élément est sélectionné et pas en mode création, mettre immédiatement à jour le modèle
    if (selectedElement && !isCreatingNew) {
      const { type, data } = selectedElement;
      const updatedData = { ...data, properties: newProperties };

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

  // Créer un nouvel élément
  const handleCreateNewItem = () => {
    if (!selectedElement) return;

    const { type } = selectedElement;

    if (type === 'new_node') {
      // Valider les données
      if (!name.trim()) {
        alert("Le nom du nœud est requis");
        return;
      }

      // Vérifier si un nœud avec ce nom existe déjà
      if (model.nodes.some(node => node.name === name)) {
        alert("Un nœud avec ce nom existe déjà");
        return;
      }

      // Créer un nouveau nœud
      const newNode = {
        name: name,
        labels: labels.split(',').map(label => label.trim()).filter(Boolean),
        properties: properties
      };

      // Mettre à jour le modèle
      const updatedModel = {
        ...model,
        nodes: [...model.nodes, newNode]
      };

      onModelUpdate(updatedModel);
    }
    else if (type === 'new_relationship') {
      // Valider les données
      if (!name.trim()) {
        alert("Le nom de la relation est requis");
        return;
      }

      if (!startNode) {
        alert("Le nœud de départ est requis");
        return;
      }

      if (!endNode) {
        alert("Le nœud de fin est requis");
        return;
      }

      // Vérifier si les nœuds existent
      if (!model.nodes.some(node => node.name === startNode)) {
        alert(`Le nœud de départ "${startNode}" n'existe pas`);
        return;
      }

      if (!model.nodes.some(node => node.name === endNode)) {
        alert(`Le nœud de fin "${endNode}" n'existe pas`);
        return;
      }

      // Vérifier si une relation identique existe déjà
      if (model.relationships.some(rel =>
        rel.name === name && rel.start_node === startNode && rel.end_node === endNode
      )) {
        alert("Une relation identique existe déjà");
        return;
      }

      // Créer une nouvelle relation
      const newRelationship = {
        name: name,
        start_node: startNode,
        end_node: endNode,
        properties: properties
      };

      // Mettre à jour le modèle
      const updatedModel = {
        ...model,
        relationships: [...model.relationships, newRelationship]
      };

      onModelUpdate(updatedModel);
    }
  };

  // Déterminer le titre du panneau
  const getPanelTitle = () => {
    if (!selectedElement) {
      return "Propriétés";
    }

    const { type } = selectedElement;

    if (type === 'new_node') {
      return 'Nouveau Nœud';
    } else if (type === 'new_relationship') {
      return 'Nouvelle Relation';
    } else if (type === 'node') {
      return `Nœud: ${selectedElement.data.name}`;
    } else if (type === 'relationship') {
      return `Relation: ${selectedElement.data.name}`;
    }

    return "Propriétés";
  };

  // Générer le contenu du panneau
  const renderPanelContent = () => {
    // Si aucun élément n'est sélectionné
    if (!selectedElement) {
      return (
        <div className="text-gray-500 text-sm">Aucun élément sélectionné</div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Nom */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-sm border"
          />
        </div>

        {/* Labels (pour les nœuds) */}
        {(selectedElement.type === 'node' || selectedElement.type === 'new_node') && (
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

        {/* Nœuds de départ et de fin (pour les relations) */}
        {(selectedElement.type === 'relationship' || selectedElement.type === 'new_relationship') && (
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

        {/* Propriétés */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Propriétés:</label>
            <button
              onClick={() => setShowAddProperty(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Ajouter
            </button>
          </div>

          {/* Formulaire d'ajout de propriété */}
          {showAddProperty && (
            <div className="mt-2 bg-gray-50 p-3 rounded border border-gray-200">
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Nom:</label>
                  <input
                    type="text"
                    value={newPropertyName}
                    onChange={(e) => setNewPropertyName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-1 text-xs border"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Type:</label>
                  <select
                    value={newPropertyType}
                    onChange={(e) => setNewPropertyType(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-1 text-xs border"
                  >
                    <option value="str">str</option>
                    <option value="int">int</option>
                    <option value="float">float</option>
                    <option value="bool">bool</option>
                    <option value="date">date</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="required"
                    checked={newPropertyRequired}
                    onChange={(e) => setNewPropertyRequired(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="required" className="text-xs font-medium text-gray-700">Requis</label>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowAddProperty(false)}
                    className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddProperty}
                    className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Liste des propriétés */}
          <div className="mt-1 bg-white rounded-md border border-gray-300 overflow-hidden">
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

        {/* Bouton de sauvegarde */}
        <div className="pt-2">
          <button
            onClick={handleSave}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            {isCreatingNew ? 'Créer' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">{getPanelTitle()}</h2>
      {renderPanelContent()}
    </div>
  );
};

export default PropertiesPanel;