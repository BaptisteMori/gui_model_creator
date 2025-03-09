/**
 * Utilitaires pour transformer le modèle entre différents formats
 */

/**
 * Convertit un modèle brut en format interne pour l'application
 * @param {Object} rawModel - Modèle JSON brut
 * @returns {Object} - Modèle formaté pour l'application
 */
export const importModel = (rawModel) => {
  // Valider la structure de base
  if (!rawModel || !rawModel.nodes || !rawModel.relationships) {
    throw new Error('Format de modèle invalide. Le modèle doit contenir les propriétés "nodes" et "relationships".');
  }
  
  // Normaliser les nœuds
  const nodes = rawModel.nodes.map(node => ({
    name: node.name || '',
    labels: Array.isArray(node.labels) ? node.labels : [node.name || ''],
    properties: Array.isArray(node.properties) ? node.properties.map(prop => ({
      name: prop.name || '',
      type: prop.type || 'str',
      required: !!prop.required,
      description: prop.description || ''
    })) : []
  }));
  
  // Normaliser les relations
  const relationships = rawModel.relationships.map(rel => ({
    name: rel.name || '',
    start_node: rel.start_node || '',
    end_node: rel.end_node || '',
    properties: Array.isArray(rel.properties) ? rel.properties.map(prop => ({
      name: prop.name || '',
      type: prop.type || 'str',
      required: !!prop.required,
      description: prop.description || ''
    })) : []
  }));
  
  return { nodes, relationships };
};

/**
 * Convertit le modèle interne en format JSON pour l'export
 * @param {Object} model - Modèle interne de l'application
 * @returns {Object} - Modèle JSON pour l'export
 */
export const exportModel = (model) => {
  // Structure de base
  const exportedModel = {
    nodes: model.nodes.map(node => ({
      name: node.name,
      labels: node.labels,
      properties: node.properties
    })),
    relationships: model.relationships.map(rel => ({
      name: rel.name,
      start_node: rel.start_node,
      end_node: rel.end_node,
      properties: rel.properties
    }))
  };
  
  return exportedModel;
};

/**
 * Vérifie si un modèle a des références cohérentes
 * (chaque relation fait référence à des nœuds existants)
 * @param {Object} model - Modèle à vérifier
 * @returns {boolean} - True si le modèle est cohérent
 */
export const validateModelReferences = (model) => {
  const nodeNames = new Set(model.nodes.map(node => node.name));
  
  // Vérifier que toutes les relations font référence à des nœuds existants
  for (const rel of model.relationships) {
    if (!nodeNames.has(rel.start_node)) {
      return false;
    }
    if (!nodeNames.has(rel.end_node)) {
      return false;
    }
  }
  
  return true;
};
