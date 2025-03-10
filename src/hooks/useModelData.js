import { useState, useEffect, useCallback } from 'react';
import { importModel, exportModel } from '../utils/modelTransformer';
import { validateModel } from '../utils/validators';

// Clé pour le stockage local
const STORAGE_KEY = 'graph-model-editor-data';

/**
 * Hook pour gérer les données du modèle, y compris leur chargement,
 * sauvegarde et validation
 * @param {Object} initialModel - Modèle initial (optionnel)
 */
const useModelData = (initialModel = null) => {
  // État du modèle
  const [model, setModel] = useState(null);
  
  // Positions des nœuds
  const [nodePositions, setNodePositions] = useState({});

  // État de chargement
  const [loading, setLoading] = useState(true);

  // Erreurs de validation
  const [validationErrors, setValidationErrors] = useState([]);

  // Chargement initial du modèle
  useEffect(() => {
    const loadModel = async () => {
      try {
        // Essayer de charger depuis le stockage local
        const storedData = localStorage.getItem(STORAGE_KEY);

        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const importedData = importModel(parsedData);
          setModel({
            nodes: importedData.nodes,
            relationships: importedData.relationships
          });
          setNodePositions(importedData.positions || {});
        } else if (initialModel) {
          // Utiliser le modèle initial si disponible
          const importedData = importModel(initialModel);
          setModel({
            nodes: importedData.nodes,
            relationships: importedData.relationships
          });
          setNodePositions(importedData.positions || {});
        } else {
          // Créer un modèle vide par défaut
          setModel({
            nodes: [],
            relationships: []
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement du modèle:', error);
        // Modèle vide en cas d'erreur
        setModel({
          nodes: [],
          relationships: []
        });
        setValidationErrors(['Erreur lors du chargement du modèle: ' + error.message]);
      } finally {
        setLoading(false);
      }
    };

    loadModel();
  }, [initialModel]);

  // Sauvegarder le modèle dans le stockage local
  useEffect(() => {
    if (model) {
      try {
        const exportedModel = exportModel(model, nodePositions);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(exportedModel));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du modèle:', error);
      }
    }
  }, [model, nodePositions]);

  // Valider le modèle
  useEffect(() => {
    if (model) {
      const { isValid, errors } = validateModel(model);
      setValidationErrors(isValid ? [] : errors);
    }
  }, [model]);

  // Mettre à jour le modèle
  const updateModel = useCallback((newModel) => {
    if (!newModel) return;
    setModel(newModel);
  }, []);

  // Mettre à jour les positions des nœuds
  const updateNodePositions = useCallback((positions) => {
    // Assurer que nous avons un objet de positions valide
    if (!positions || typeof positions !== 'object') return;

    setNodePositions(positions);

    // Sauvegarder immédiatement dans le localStorage pour éviter des désynchronisations
    try {
      const currentModel = model;
      if (currentModel) {
        const exportedModel = exportModel(currentModel, positions);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(exportedModel));
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des positions:', error);
    }
  }, [model]);

  // Importer un modèle depuis un fichier JSON
  const importModelFromJson = useCallback((jsonData) => {
    try {
      const parsedData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      const importedData = importModel(parsedData);

      setModel({
        nodes: importedData.nodes,
        relationships: importedData.relationships
      });

      // Mettre à jour les positions si disponibles
      if (importedData.positions) {
        setNodePositions(importedData.positions);
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de l\'importation du modèle:', error);
      setValidationErrors(['Erreur lors de l\'importation du modèle: ' + error.message]);
      return { success: false, error: error.message };
    }
  }, []);

  // Exporter le modèle au format JSON
  const exportModelToJson = useCallback(() => {
    if (!model) return null;

    try {
      // Utiliser une copie profonde des positions pour éviter les références partagées
      const positionsCopy = JSON.parse(JSON.stringify(nodePositions));

      // S'assurer que toutes les positions sont valides
      const validatedPositions = {};
      Object.entries(positionsCopy).forEach(([key, value]) => {
        if (value && typeof value.x === 'number' && typeof value.y === 'number') {
          validatedPositions[key] = value;
        }
      });

      const exportedModel = exportModel(model, validatedPositions);
      return JSON.stringify(exportedModel, null, 2);
    } catch (error) {
      console.error('Erreur lors de l\'exportation du modèle:', error);
      return null;
    }
  }, [model, nodePositions]);

  // Les autres fonctions existantes...

  return {
    model,
    loading,
    validationErrors,
    nodePositions,
    updateModel,
    updateNodePositions,
    importModelFromJson,
    exportModelToJson
  };
};

export default useModelData;