import React, { useState, useEffect } from 'react';
import ToolPanel from '../panels/ToolPanel';
import PropertiesPanel from '../panels/PropertiesPanel';

const Sidebar = ({ model, selectedElement, onModelUpdate, onElementSelect }) => {
  const [adaptedSelectedElement, setAdaptedSelectedElement] = useState(null);
  const [showNodesList, setShowNodesList] = useState(true);

  // Gérer les types spéciaux d'éléments sélectionnés (create_node, create_relationship)
  useEffect(() => {
    if (!selectedElement) {
      setAdaptedSelectedElement(null);
      return;
    }

    if (selectedElement.type === 'create_node') {
      // Simuler un élément "nouveau nœud" pour le panneau de propriétés
      setAdaptedSelectedElement({
        type: 'new_node',
        data: { name: '', labels: [], properties: [] }
      });
    }
    else if (selectedElement.type === 'create_relationship') {
      // Simuler un élément "nouvelle relation" pour le panneau de propriétés
      setAdaptedSelectedElement({
        type: 'new_relationship',
        data: { name: '', start_node: '', end_node: '', properties: [] }
      });
    }
    else {
      // Élément normal (nœud ou relation)
      setAdaptedSelectedElement(selectedElement);
    }
  }, [selectedElement]);

  return (
    <div className="w-64 bg-sidebar-bg overflow-y-auto flex flex-col">
      <ToolPanel
        model={model}
        onModelUpdate={onModelUpdate}
        selectedElement={selectedElement}
        onElementSelect={onElementSelect}
      />

      <div className="border-t border-gray-300 my-2"></div>

      <PropertiesPanel
        model={model}
        selectedElement={adaptedSelectedElement}
        onModelUpdate={onModelUpdate}
      />

      <div className="border-t border-gray-300 my-2"></div>

      {/* Liste des nœuds disponibles */}
      <div className="px-4 py-2">
        <div
          className="bg-gray-200 rounded px-2 py-1 font-bold text-sm flex justify-between items-center cursor-pointer"
          onClick={() => setShowNodesList(!showNodesList)}
        >
          <span>Nœuds disponibles</span>
          <span>{showNodesList ? '▼' : '►'}</span>
        </div>

        {showNodesList && (
          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {model.nodes.map((node) => (
              <div
                key={node.name}
                className="flex items-center justify-between bg-gray-100 hover:bg-gray-200 rounded px-2 py-1 text-sm cursor-pointer"
                onClick={() => onElementSelect({ type: 'node', data: node })}
              >
                <span>{node.name}</span>
                <span
                  className={`w-3 h-3 rounded-full ${node.name === 'Person' ? 'bg-node-person' : 'bg-node-product'}`}
                ></span>
              </div>
            ))}

            {model.nodes.length === 0 && (
              <div className="text-gray-500 text-xs italic p-1">
                Aucun nœud disponible
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;