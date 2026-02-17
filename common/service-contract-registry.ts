import { 
  ServiceContract, 
  ContractViolation, 
  ParamSchema, 
  ResponseSchema,
  ErrorCategory,
  ErrorReporter 
} from './error-reporting';

export class ServiceContractRegistry {
  private static instance: ServiceContractRegistry;
  private contracts: Map<string, ServiceContract> = new Map();
  private violations: ContractViolation[] = [];
  private reporter: ErrorReporter;

  private constructor() {
    this.reporter = ErrorReporter.getInstance();
  }

  static getInstance(): ServiceContractRegistry {
    if (!ServiceContractRegistry.instance) {
      ServiceContractRegistry.instance = new ServiceContractRegistry();
    }
    return ServiceContractRegistry.instance;
  }

  register(contract: Omit<ServiceContract, 'id' | 'createdAt' | 'updatedAt'>): ServiceContract {
    const newContract: ServiceContract = {
      ...contract,
      id: `contract_${contract.serviceName}_${contract.contractVersion}_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.contracts.set(newContract.id, newContract);
    this.reporter.registerContract(newContract);
    
    return newContract;
  }

  get(contractId: string): ServiceContract | undefined {
    return this.contracts.get(contractId);
  }

  getByServiceAndEndpoint(serviceName: string, endpoint: string): ServiceContract | undefined {
    for (const contract of this.contracts.values()) {
      if (contract.serviceName === serviceName && contract.endpoint === endpoint) {
        return contract;
      }
    }
    return undefined;
  }

  getAll(): ServiceContract[] {
    return Array.from(this.contracts.values());
  }

  remove(contractId: string): boolean {
    return this.contracts.delete(contractId);
  }

  update(contractId: string, updates: Partial<ServiceContract>): ServiceContract | null {
    const existing = this.contracts.get(contractId);
    if (!existing) return null;

    const updated: ServiceContract = {
      ...existing,
      ...updates,
      id: contractId,
      createdAt: existing.createdAt,
      updatedAt: new Date()
    };
    
    this.contracts.set(contractId, updated);
    return updated;
  }
}

export class ContractValidator {
  private registry: ServiceContractRegistry;
  private reporter: ErrorReporter;

  constructor(registry?: ServiceContractRegistry) {
    this.registry = registry || ServiceContractRegistry.getInstance();
    this.reporter = ErrorReporter.getInstance();
  }

  validate(
    serviceName: string,
    endpoint: string,
    actualParams: Record<string, any>,
    actualResponse: any,
    responseTime: number
  ): ContractViolation | null {
    const contract = this.registry.getByServiceAndEndpoint(serviceName, endpoint);
    
    if (!contract) {
      return null;
    }

    const violations: ContractViolation[] = [];

    for (const expectedParam of contract.expectedParams) {
      const actualValue = actualParams[expectedParam.name];
      
      if (expectedParam.required && (actualValue === undefined || actualValue === null)) {
        violations.push({
          id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          contractId: contract.id,
          timestamp: new Date(),
          violationType: 'param_mismatch',
          actualRequest: actualParams,
          expectedContract: contract,
          deviation: `Missing required parameter: ${expectedParam.name}`,
          severity: 'high'
        });
        continue;
      }

      if (actualValue !== undefined) {
        if (expectedParam.type && typeof actualValue !== expectedParam.type) {
          violations.push({
            id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            contractId: contract.id,
            timestamp: new Date(),
            violationType: 'param_mismatch',
            actualRequest: actualParams,
            expectedContract: contract,
            deviation: `Parameter '${expectedParam.name}' type mismatch: expected ${expectedParam.type}, got ${typeof actualValue}`,
            severity: 'medium'
          });
        }

        if (expectedParam.pattern && typeof actualValue === 'string') {
          const regex = new RegExp(expectedParam.pattern);
          if (!regex.test(actualValue)) {
            violations.push({
              id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              contractId: contract.id,
              timestamp: new Date(),
              violationType: 'param_mismatch',
              actualRequest: actualParams,
              expectedContract: contract,
              deviation: `Parameter '${expectedParam.name}' does not match pattern: ${expectedParam.pattern}`,
              severity: 'low'
            });
          }
        }

        if (expectedParam.minLength !== undefined && typeof actualValue === 'string' && actualValue.length < expectedParam.minLength) {
          violations.push({
            id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            contractId: contract.id,
            timestamp: new Date(),
            violationType: 'param_mismatch',
            actualRequest: actualParams,
            expectedContract: contract,
            deviation: `Parameter '${expectedParam.name}' length ${actualValue.length} is less than minimum ${expectedParam.minLength}`,
            severity: 'medium'
          });
        }

        if (expectedParam.maxLength !== undefined && typeof actualValue === 'string' && actualValue.length > expectedParam.maxLength) {
          violations.push({
            id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            contractId: contract.id,
            timestamp: new Date(),
            violationType: 'param_mismatch',
            actualRequest: actualParams,
            expectedContract: contract,
            deviation: `Parameter '${expectedParam.name}' length ${actualValue.length} exceeds maximum ${expectedParam.maxLength}`,
            severity: 'medium'
          });
        }

        if (expectedParam.minimum !== undefined && typeof actualValue === 'number' && actualValue < expectedParam.minimum) {
          violations.push({
            id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            contractId: contract.id,
            timestamp: new Date(),
            violationType: 'param_mismatch',
            actualRequest: actualParams,
            expectedContract: contract,
            deviation: `Parameter '${expectedParam.name}' value ${actualValue} is less than minimum ${expectedParam.minimum}`,
            severity: 'medium'
          });
        }

        if (expectedParam.maximum !== undefined && typeof actualValue === 'number' && actualValue > expectedParam.maximum) {
          violations.push({
            id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            contractId: contract.id,
            timestamp: new Date(),
            violationType: 'param_mismatch',
            actualRequest: actualParams,
            expectedContract: contract,
            deviation: `Parameter '${expectedParam.name}' value ${actualValue} exceeds maximum ${expectedParam.maximum}`,
            severity: 'medium'
          });
        }

        if (expectedParam.enum && !expectedParam.enum.includes(actualValue)) {
          violations.push({
            id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            contractId: contract.id,
            timestamp: new Date(),
            violationType: 'param_mismatch',
            actualRequest: actualParams,
            expectedContract: contract,
            deviation: `Parameter '${expectedParam.name}' value '${actualValue}' is not in allowed values: [${expectedParam.enum.join(', ')}]`,
            severity: 'medium'
          });
        }
      }
    }

    if (responseTime > contract.timeout) {
      violations.push({
        id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contractId: contract.id,
        timestamp: new Date(),
        violationType: 'timeout',
        actualRequest: actualParams,
        actualResponse,
        expectedContract: contract,
        deviation: `Request timeout: ${responseTime}ms exceeded contract timeout of ${contract.timeout}ms`,
        severity: 'medium'
      });
    }

    if (violations.length > 0) {
      const primaryViolation = violations[0];
      
      this.reporter.report({
        level: 'warning',
        component: 'api',
        category: ErrorCategory.CONTRACT_VIOLATION,
        source: 'server',
        message: `Contract violation for ${serviceName}${endpoint}: ${primaryViolation.deviation}`,
        context: {
          contract: {
            contractId: contract.id,
            expectedParams: contract.expectedParams,
            actualParams,
            deviation: primaryViolation.deviation
          }
        },
        severity: primaryViolation.severity
      });

      return primaryViolation;
    }

    return null;
  }

  getViolations(contractId?: string): ContractViolation[] {
    return this.reporter.getContractViolations(contractId);
  }
}

export const contractRegistry = ServiceContractRegistry.getInstance();
export const contractValidator = new ContractValidator();
