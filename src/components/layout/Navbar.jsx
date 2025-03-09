import React from 'react';

const Navbar = ({ model, onModelUpdate, onImport, onExport }) => {
  // Fonction pour gérer l'import du modèle
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
            const result = onImport(event.target.result);
            if (!result.success) {
              alert('Erreur lors de l\'import: ' + result.error);
            }
          } catch (error) {
            alert('Erreur lors de la lecture du fichier JSON: ' + error.message);
          }
        };
        reader.readAsText(file);
      }
    };
    
    input.click();
  };

  // Fonction pour gérer l'export du modèle
  const handleExport = () => {
    const jsonData = onExport();
    if (jsonData) {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonData);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "model.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } else {
      alert('Erreur lors de l\'export du modèle');
    }
  };

  return (
    <nav className="bg-nav-bg text-white h-12 flex items-center justify-between px-4">
      <div className="text-lg font-semibold">Éditeur de Modèle</div>
      <div className="flex space-x-4">
        <button 
          onClick={handleImport}
          className="btn-success btn"
        >
          Import
        </button>
        <button 
          onClick={handleExport}
          className="btn-primary btn"
        >
          Export
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
