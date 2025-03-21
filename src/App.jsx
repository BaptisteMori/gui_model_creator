import React, { useState, useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Canvas from './components/canvas/Canvas';
import Sidebar from './components/layout/Sidebar';
import useModelData from './hooks/useModelData';

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
  ],
  positions: {
    "Person": { x: 150, y: 200 },
    "Product": { x: 450, y: 200 }
  }
};

function App() {
  const {
    model,
    loading,
    validationErrors,
    nodePositions,
    updateModel,
    updateNodePositions,
    importModelFromJson,
    exportModelToJson
  } = useModelData(initialModel);

  const [selectedElement, setSelectedElement] = useState(null);
  const [elementToEdit, setElementToEdit] = useState(null);

  // Gérer la sélection d'éléments
  const handleElementSelect = (element) => {
    // Si on reçoit null ou un nouvel élément, réinitialiser l'élément en édition
    if (!element || !selectedElement || element.type !== selectedElement.type ||
        (element.data && selectedElement.data && element.data.name !== selectedElement.data.name)) {
      setElementToEdit(null);
    }

    setSelectedElement(element);
  };

  // Gérer les erreurs de validation
  useEffect(() => {
    if (validationErrors.length > 0) {
      console.warn('Erreurs de validation du modèle:', validationErrors);
    }
  }, [validationErrors]);

  // Si le modèle est en cours de chargement, afficher un message
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-app-bg">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-app-bg">
      <Navbar
        model={model}
        onModelUpdate={updateModel}
        onImport={importModelFromJson}
        onExport={exportModelToJson}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <Canvas
            model={model}
            onModelUpdate={updateModel}
            onElementSelect={handleElementSelect}
            selectedElement={selectedElement}
            nodePositions={nodePositions}
            onNodePositionsUpdate={updateNodePositions}
          />
        </div>

        <Sidebar
          model={model}
          selectedElement={selectedElement}
          onModelUpdate={updateModel}
          onElementSelect={handleElementSelect}
          elementToEdit={elementToEdit}
          setElementToEdit={setElementToEdit}
        />
      </div>
    </div>
  );
}

export default App;