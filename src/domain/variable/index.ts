export type { VariableBinding, VariableDefinition, VariableType } from './VariableTypes';
export type { VariableNameValidation } from './VariableValidation';
export {
  checkDuplicateNames,
  extractVariablePattern,
  validateVariableName,
} from './VariableValidation';
export { generateTypeScriptInterface } from './InterfaceGenerator';
