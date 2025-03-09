import React from 'react';

const ToolPanel = ({ model, onModelUpdate, onElementSelect, selectedElement }) => {
  // Commencer à créer un nouveau nœud
  const handleAddNode = () => {
    // Envoyer un signal spécial pour indiquer que l'utilisateur veut créer un nœud
    onElementSelect({ type: 'create_node' });
  };

  // Commencer à créer une nouvelle relation
  const handleAddRelationship = () => {
    // Envoyer un signal spécial pour indiquer que l'utilisateur veut créer une relation
    onElementSelect({ type: 'create_relationship' });
  };

  // Supprimer l'élément sélectionné
  const handleDelete = () => {
    if (!selectedElement) {
      alert("Veuillez d'abord sélectionner un élément à supprimer.");
      return;
    }

    const { type, data } = selectedElement;

    if (type === 'node') {
      // Demander confirmation
      if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le nœud "${data.name}" ?`)) {
        return;
      }

      // Vérifier si le nœud est utilisé dans des relations
      const relationsUsingNode = model.relationships.filter(rel =>
        rel.start_node === data.name || rel.end_node === data.name
      );

      if (relationsUsingNode.length > 0) {
        if (!window.confirm(`Ce nœud est utilisé dans ${relationsUsingNode.length} relation(s). Supprimer également ces relations ?`)) {
          return;
        }
      }

      // Supprimer le nœud
      const updatedNodes = model.nodes.filter(node => node.name !== data.name);

      // Supprimer également toutes les relations impliquant ce nœud
      const updatedRelationships = model.relationships.filter(rel =>
        rel.start_node !== data.name && rel.end_node !== data.name
      );

      // Mettre à jour le modèle
      onModelUpdate({
        ...model,
        nodes: updatedNodes,
        relationships: updatedRelationships
      });

      // Désélectionner
      onElementSelect(null);
    }
    else if (type === 'relationship') {
      // Demander confirmation
      if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la relation "${data.name}" ?`)) {
        return;
      }

      // Supprimer la relation
      const updatedRelationships = model.relationships.filter(rel =>
        !(rel.name === data.name &&
          rel.start_node === data.start_node &&
          rel.end_node === data.end_node)
      );

      // Mettre à jour le modèle
      onModelUpdate({
        ...model,
        relationships: updatedRelationships
      });

      // Désélectionner
      onElementSelect(null);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Outils</h2>
      <div className="space-y-2">
        <button
          className="w-full flex items-center p-2 rounded border bg-white hover:bg-gray-100"
          onClick={handleAddNode}
        >
          <div className="w-5 h-5 rounded-full bg-node-person mr-2"></div>
          <span>Nouveau Nœud</span>
        </button>

        <button
          className="w-full flex items-center p-2 rounded border bg-white hover:bg-gray-100"
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
          className={`w-full flex items-center p-2 rounded border ${selectedElement ? 'bg-white hover:bg-gray-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          onClick={handleDelete}
          disabled={!selectedElement}
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