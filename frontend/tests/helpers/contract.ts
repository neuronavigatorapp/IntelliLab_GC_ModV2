import Ajv, { type JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Contract Validation Helper
 * 
 * Validates API responses against OpenAPI schema contracts using Ajv.
 * Ensures that both mock and real API responses conform to the expected structure.
 */

export class ContractValidator {
  private ajv: Ajv;
  private openApiSchema: any;
  private responseSchemas: Map<string, any> = new Map();

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strictSchema: false, // Allow additional properties for flexibility
      allowUnionTypes: true
    });
    addFormats(this.ajv);

    this.loadOpenAPISchema();
    this.prepareResponseSchemas();
  }

  private loadOpenAPISchema() {
    try {
      const schemaPath = join(__dirname, '..', 'contracts', 'openapi.json');
      const schemaContent = readFileSync(schemaPath, 'utf-8');
      this.openApiSchema = JSON.parse(schemaContent);

      console.log('📋 Loaded OpenAPI schema with', Object.keys(this.openApiSchema.paths || {}).length, 'paths');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn('⚠️ Could not load OpenAPI schema:', message);
      console.warn('💡 Run: node scripts/fetch-openapi.mjs to fetch the schema');
      this.openApiSchema = { paths: {} };
    }
  }

  private prepareResponseSchemas() {
    if (!this.openApiSchema.paths) return;

    for (const [path, pathItem] of Object.entries(this.openApiSchema.paths)) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (typeof operation !== 'object' || operation === null || !(operation as any).responses) continue;

        const operationObj = operation as any;
        const response200 = operationObj.responses['200'];
        if (response200?.content?.['application/json']?.schema) {
          const key = `${method.toUpperCase()} ${path}`;
          let schema = response200.content['application/json'].schema;

          // Resolve $ref if present
          if (schema.$ref) {
            const refPath = schema.$ref.replace('#/', '').split('/');
            schema = this.resolveRef(this.openApiSchema, refPath);
          }

          this.responseSchemas.set(key, schema);
        }
      }
    }

    console.log('🔍 Prepared', this.responseSchemas.size, 'response schemas for validation');
  }

  private resolveRef(schema: any, refPath: string[]): any {
    let current = schema;
    for (const segment of refPath) {
      current = current?.[segment];
    }
    return current;
  }

  /**
   * Validate an API response against its OpenAPI contract
   */
  validateResponse(path: string, method: string, responseData: any): ValidationResult {
    const key = `${method.toUpperCase()} ${path}`;
    const schema = this.responseSchemas.get(key);

    if (!schema) {
      return {
        valid: true,
        warning: `No schema found for ${key}`,
        path,
        method
      };
    }

    const validate = this.ajv.compile(schema);
    const valid = validate(responseData);

    if (valid) {
      return {
        valid: true,
        path,
        method,
        schema: schema
      };
    } else {
      return {
        valid: false,
        errors: validate.errors || [],
        path,
        method,
        schema: schema
      };
    }
  }

  /**
   * Get available contract endpoints
   */
  getAvailableContracts(): string[] {
    return Array.from(this.responseSchemas.keys());
  }

  /**
   * Validate multiple common endpoints at once
   */
  validateCommonEndpoints(responses: Record<string, { path: string; method: string; data: any }>): ValidationSummary {
    const results: ValidationResult[] = [];

    for (const [name, response] of Object.entries(responses)) {
      const result = this.validateResponse(response.path, response.method, response.data);
      result.name = name;
      results.push(result);
    }

    const validCount = results.filter(r => r.valid).length;
    const totalCount = results.length;

    return {
      results,
      summary: {
        total: totalCount,
        valid: validCount,
        invalid: totalCount - validCount,
        passRate: totalCount > 0 ? (validCount / totalCount * 100).toFixed(1) : '0'
      }
    };
  }
}

export interface ValidationResult {
  valid: boolean;
  path: string;
  method: string;
  name?: string;
  errors?: any[];
  warning?: string;
  schema?: any;
}

export interface ValidationSummary {
  results: ValidationResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    passRate: string;
  };
}

// Singleton instance for easy use in tests
export const contractValidator = new ContractValidator();

/**
 * Convenience function for validating responses in tests
 */
export function validateResponse(path: string, method: string, responseData: any): ValidationResult {
  return contractValidator.validateResponse(path, method, responseData);
}

/**
 * Convenience function for logging validation results
 */
export function logValidationResult(result: ValidationResult): void {
  const emoji = result.valid ? '✅' : '❌';
  const name = result.name ? `[${result.name}] ` : '';

  console.log(`${emoji} ${name}Contract validation: ${result.method} ${result.path}`);

  if (result.warning) {
    console.warn(`⚠️ ${result.warning}`);
  }

  if (!result.valid && result.errors) {
    console.error('🔍 Validation errors:');
    result.errors.forEach(error => {
      const path = error.instancePath || error.dataPath || 'root';
      console.error(`  • ${path}: ${error.message}`);
    });
  }
}

/**
 * Convenience function for logging validation summary
 */
export function logValidationSummary(summary: ValidationSummary): void {
  console.log('📊 Contract Validation Summary:');
  console.log(`   Total: ${summary.summary.total}`);
  console.log(`   Valid: ${summary.summary.valid}`);
  console.log(`   Invalid: ${summary.summary.invalid}`);
  console.log(`   Pass Rate: ${summary.summary.passRate}%`);

  const failed = summary.results.filter(r => !r.valid);
  if (failed.length > 0) {
    console.log('❌ Failed validations:');
    failed.forEach(result => {
      const name = result.name ? `[${result.name}] ` : '';
      console.log(`   • ${name}${result.method} ${result.path}`);
    });
  }
}