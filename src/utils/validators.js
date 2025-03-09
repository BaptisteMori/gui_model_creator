/**
 * Utilitaires pour valider les données du modèle
 */

/**
 * Types de données valides pour les propriétés
 */
export const VALID_TYPES = ['str', 'int', 'float', 'bool', 'date'];

/**
 * Valide un nom (pour nœuds et relations)
 * @param {string} name - Nom à valider
 * @returns {boolean} - True si le nom est valide
 */
export const isValidName = (name) => {
  if (!name || typeof name !== 'string') return false;
  
  // Le nom doit contenir uniquement des lettres, chiffres et underscores
  // et ne pas commencer par un chiffre
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
};

/**
 * Valide un type de propriété
 * @param {string} type - Type à valider
 * @returns {boolean} - True si le type est valide
 */
export const isValidType = (type) => {
  return VALID_TYPES.includes(type);
};

/**
 * Valide une propriété
 * @param {Object} property - Propriété à valider
 * @returns {Object} - Résultat de la validation {isValid, errors}
 */
export const validateProperty = (property) => {
  const errors = [];
  
  // Vérifier le nom
  if (!isValidName(property.name)) {
    errors.push('Le nom de la propriété est invalide.');
  }
  
  // Vérifier le type
  if (!isValidType(property.type)) {
    errors.push(`Le type "${property.type}" est invalide. Types valides: ${VALID_TYPES.join(', ')}.`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Valide un nœud
 * @param {Object} node - Nœud à valider
 * @returns {Object} - Résultat de la validation {isValid, errors}
 */
export const validateNode = (node) => {
  const errors = [];
  
  // Vérifier le nom
  if (!isValidName(node.name)) {
    errors.push('Le nom du nœud est invalide.');
  }
  
  // Vérifier les labels
  if (!Array.isArray(node.labels) || node.labels.length === 0) {
    errors.push('Le nœud doit avoir au moins un label.');
  } else {
    for (const label of node.labels) {
      if (typeof label !== 'string' || label.trim() === '') {
        errors.push('Les labels doivent être des chaînes non vides.');
        break;
      }
    }
  }
  
  // Vérifier les propriétés
  if (Array.isArray(node.properties)) {
    for (const property of node.properties) {
      const validation = validateProperty(property);
      if (!validation.isValid) {
        errors.push(...validation.errors.map(err => `Propriété "${property.name}": ${err}`));
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Valide une relation
 * @param {Object} relationship - Relation à valider
 * @param {Array} existingNodes - Liste des nœuds existants
 * @returns {Object} - Résultat de la validation {isValid, errors}
 */
export const validateRelationship = (relationship, existingNodes = []) => {
  const errors = [];
  
  // Vérifier le nom
  if (!isValidName(relationship.name)) {
    errors.push('Le nom de la relation est invalide.');
  }
  
  // Vérifier les nœuds de départ et de fin
  const nodeNames = new Set(existingNodes.map(node => node.name));
  
  if (!nodeNames.has(relationship.start_node)) {
    errors.push(`Le nœud de départ "${relationship.start_node}" n'existe pas.`);
  }
  
  if (!nodeNames.has(relationship.end_node)) {
    errors.push(`Le nœud de fin "${relationship.end_node}" n'existe pas.`);
  }
  
  // Vérifier les propriétés
  if (Array.isArray(relationship.properties)) {
    for (const property of relationship.properties) {
      const validation = validateProperty(property);
      if (!validation.isValid) {
        errors.push(...validation.errors.map(err => `Propriété "${property.name}": ${err}`));
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Valide un modèle complet
 * @param {Object} model - Modèle à valider
 * @returns {Object} - Résultat de la validation {isValid, errors}
 */
export const validateModel = (model) => {
  const errors = [];
  
  // Vérifier la structure de base
  if (!model || !model.nodes || !model.relationships) {
    errors.push('Le modèle doit contenir les propriétés "nodes" et "relationships".');
    return { isValid: false, errors };
  }
  
  // Vérifier les nœuds
  for (const node of model.nodes) {
    const validation = validateNode(node);
    if (!validation.isValid) {
      errors.push(...validation.errors.map(err => `Nœud "${node.name}": ${err}`));
    }
  }
  
  // Vérifier les relations
  for (const relationship of model.relationships) {
    const validation = validateRelationship(relationship, model.nodes);
    if (!validation.isValid) {
      errors.push(...validation.errors.map(err => `Relation "${relationship.name}": ${err}`));
    }
  }
  
  // Vérifier l'unicité des noms des nœuds
  const nodeNames = model.nodes.map(node => node.name);
  const duplicateNodeNames = nodeNames.filter((name, index) => nodeNames.indexOf(name) !== index);
  
  if (duplicateNodeNames.length > 0) {
    errors.push(`Noms de nœuds en double: ${duplicateNodeNames.join(', ')}.`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
