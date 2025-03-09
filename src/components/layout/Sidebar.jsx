import React from 'react';
import ToolPanel from '../panels/ToolPanel';
import PropertiesPanel from '../panels/PropertiesPanel';

const Sidebar = ({ model, selectedElement, onModelUpdate, onElementSelect }) => {
  return (
    <div className="w-64 bg-sidebar-bg overflow-y-auto flex flex-col">
      <ToolPanel 
        model={model} 
        onModelUpdate={onModelUpdate} 
      />
      
      <div className="border-t border-gray-300 my-2"></div>
      
      <PropertiesPanel 
        model={model} 
        selectedElement={selectedElement} 
        onModelUpdate={onModelUpdate}
      />
      
      <div className="border-t border-gray-300 my-2"></div>
      
      {/* Liste des nœuds disponibles */}
      <div className="px-4 py-2">
        <div className="bg-gray-200 rounded px-2 py-1 font-bold text-sm flex justify-between items-center cursor-pointer">
          <span>Nœuds disponibles</span>
          <span>▼</span>
        </div>
        <div className="mt-2 space-y-1">
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
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
