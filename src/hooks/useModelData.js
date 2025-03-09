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
          setModel(importModel(parsedData));
        } else if (initialModel) {
          // Utiliser le modèle initial si disponible
          setModel(importModel(initialModel));
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
        const exportedModel = exportModel(model);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(exportedModel));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du modèle:', error);
      }
    }
  }, [model]);
  
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
  
  // Importer un modèle depuis un fichier JSON
  const importModelFromJson = useCallback((jsonData) => {
    try {
      const parsedData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      const importedModel = importModel(parsedData);
      setModel(importedModel);
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
      const exportedModel = exportModel(model);
      return JSON.stringify(exportedModel, null, 2);
    } catch (error) {
      console.error('Erreur lors de l\'exportation du modèle:', error);
      return null;
    }
  }, [model]);
  
  // Ajouter un nouveau nœud
  const addNode = useCallback((nodeData) => {
    if (!nodeData || !nodeData.name) return { success: false, error: 'Données de nœud invalides' };
    
    // Vérifier si un nœud avec ce nom existe déjà
    if (model.nodes.some(node => node.name === nodeData.name)) {
      return { success: false, error: 'Un nœud avec ce nom existe déjà' };
    }
    
    const updatedModel = {
      ...model,
      nodes: [...model.nodes, nodeData]
    };
    
    setModel(updatedModel);
    return { success: true };
  }, [model]);
  
  // Mettre à jour un nœud existant
  const updateNode = useCallback((nodeName, nodeData) => {
    if (!nodeName || !nodeData) return { success: false, error: 'Données invalides' };
    
    // Trouver le nœud à mettre à jour
    const nodeIndex = model.nodes.findIndex(node => node.name === nodeName);
    if (nodeIndex === -1) {
      return { success: false, error: 'Nœud non trouvé' };
    }
    
    // Vérifier si le nouveau nom est déjà utilisé par un autre nœud
    if (nodeData.name !== nodeName && model.nodes.some(node => node.name === nodeData.name)) {
      return { success: false, error: 'Un nœud avec ce nom existe déjà' };
    }
    
    // Créer une copie du modèle avec le nœud mis à jour
    const updatedNodes = [...model.nodes];
    updatedNodes[nodeIndex] = nodeData;
    
    // Mettre à jour également les références dans les relations
    const updatedRelationships = model.relationships.map(rel => {
      if (rel.start_node === nodeName) {
        return { ...rel, start_node: nodeData.name };
      }
      if (rel.end_node === nodeName) {
        return { ...rel, end_node: nodeData.name };
      }
      return rel;
    });
    
    setModel({
      ...model,
      nodes: updatedNodes,
      relationships: updatedRelationships
    });
    
    return { success: true };
  }, [model]);
  
  // Supprimer un nœud
  const deleteNode = useCallback((nodeName) => {
    if (!nodeName) return { success: false, error: 'Nom de nœud non spécifié' };
    
    // Vérifier si le nœud existe
    if (!model.nodes.some(node => node.name === nodeName)) {
      return { success: false, error: 'Nœud non trouvé' };
    }
    
    // Filtrer le nœud à supprimer
    const updatedNodes = model.nodes.filter(node => node.name !== nodeName);
    
    // Supprimer également toutes les relations impliquant ce nœud
    const updatedRelationships = model.relationships.filter(rel => 
      rel.start_node !== nodeName && rel.end_node !== nodeName
    );
    
    setModel({
      ...model,
      nodes: updatedNodes,
      relationships: updatedRelationships
    });
    
    return { success: true };
  }, [model]);
  
  // Ajouter une nouvelle relation
  const addRelationship = useCallback((relationshipData) => {
    if (!relationshipData || !relationshipData.name || !relationshipData.start_node || !relationshipData.end_node) {
      return { success: false, error: 'Données de relation invalides' };
    }
    
    // Vérifier si les nœuds référencés existent
    const startNodeExists = model.nodes.some(node => node.name === relationshipData.start_node);
    const endNodeExists = model.nodes.some(node => node.name === relationshipData.end_node);
    
    if (!startNodeExists) {
      return { success: false, error: 'Le nœud de départ n\'existe pas' };
    }
    
    if (!endNodeExists) {
      return { success: false, error: 'Le nœud de fin n\'existe pas' };
    }
    
    // Vérifier si une relation identique existe déjà
    const relationshipExists = model.relationships.some(rel => 
      rel.name === relationshipData.name && 
      rel.start_node === relationshipData.start_node && 
      rel.end_node === relationshipData.end_node
    );
    
    if (relationshipExists) {
      return { success: false, error: 'Une relation identique existe déjà' };
    }
    
    const updatedModel = {
      ...model,
      relationships: [...model.relationships, relationshipData]
    };
    
    setModel(updatedModel);
    return { success: true };
  }, [model]);
  
  // Mettre à jour une relation existante
  const updateRelationship = useCallback((relationshipId, relationshipData) => {
    if (!relationshipId || !relationshipData) return { success: false, error: 'Données invalides' };
    
    // Décomposer l'ID de la relation
    const [name, startNode, endNode] = relationshipId.split('|');
    
    // Trouver la relation à mettre à jour
    const relationshipIndex = model.relationships.findIndex(rel => 
      rel.name === name && rel.start_node === startNode && rel.end_node === endNode
    );
    
    if (relationshipIndex === -1) {
      return { success: false, error: 'Relation non trouvée' };
    }
    
    // Vérifier si les nœuds référencés existent
    const startNodeExists = model.nodes.some(node => node.name === relationshipData.start_node);
    const endNodeExists = model.nodes.some(node => node.name === relationshipData.end_node);
    
    if (!startNodeExists) {
      return { success: false, error: 'Le nœud de départ n\'existe pas' };
    }
    
    if (!endNodeExists) {
      return { success: false, error: 'Le nœud de fin n\'existe pas' };
    }
    
    // Vérifier si la nouvelle configuration est déjà utilisée par une autre relation
    const conflictingRelationship = model.relationships.some((rel, idx) => 
      idx !== relationshipIndex && 
      rel.name === relationshipData.name && 
      rel.start_node === relationshipData.start_node && 
      rel.end_node === relationshipData.end_node
    );
    
    if (conflictingRelationship) {
      return { success: false, error: 'Une relation avec cette configuration existe déjà' };
    }
    
    // Créer une copie du modèle avec la relation mise à jour
    const updatedRelationships = [...model.relationships];
    updatedRelationships[relationshipIndex] = relationshipData;
    
    setModel({
      ...model,
      relationships: updatedRelationships
    });
    
    return { success: true };
  }, [model]);
  
  // Supprimer une relation
  const deleteRelationship = useCallback((relationshipId) => {
    if (!relationshipId) return { success: false, error: 'ID de relation non spécifié' };
    
    // Décomposer l'ID de la relation
    const [name, startNode, endNode] = relationshipId.split('|');
    
    // Vérifier si la relation existe
    const relationshipExists = model.relationships.some(rel => 
      rel.name === name && rel.start_node === startNode && rel.end_node === endNode
    );
    
    if (!relationshipExists) {
      return { success: false, error: 'Relation non trouvée' };
    }
    
    // Filtrer la relation à supprimer
    const updatedRelationships = model.relationships.filter(rel => 
      !(rel.name === name && rel.start_node === startNode && rel.end_node === endNode)
    );
    
    setModel({
      ...model,
      relationships: updatedRelationships
    });
    
    return { success: true };
  }, [model]);
  
  return {
    model,
    loading,
    validationErrors,
    updateModel,
    importModelFromJson,
    exportModelToJson,
    addNode,
    updateNode,
    deleteNode,
    addRelationship,
    updateRelationship,
    deleteRelationship
  };
};

export default useModelData;
