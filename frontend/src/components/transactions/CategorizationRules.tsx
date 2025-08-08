import { MagnifyingGlassIcon, PlusIcon, TagIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface CategoryRule {
  id: string;
  name: string;
  category: string;
  conditions: {
    field: 'description' | 'amount' | 'account';
    operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
    value: string;
    case_sensitive?: boolean;
  }[];
  enabled: boolean;
  created_at: string;
  matches_count?: number;
}

interface CategorizationRulesProps {
  onRuleChange?: (rules: CategoryRule[]) => void;
}

export function CategorizationRules({ onRuleChange }: CategorizationRulesProps) {
  const [rules, setRules] = useState<CategoryRule[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  // Note: placeholder UI state removed to avoid unused variable warnings
  
  // Default categories
  const defaultCategories = [
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 
    'Bills & Utilities', 'Healthcare', 'Travel', 'Education', 
    'Income', 'Investment', 'Transfer', 'Other'
  ];

  // Sample rules for demonstration
  useEffect(() => {
    const sampleRules: CategoryRule[] = [
      {
        id: '1',
        name: 'Grocery Stores',
        category: 'Food & Dining',
        conditions: [
          { field: 'description', operator: 'contains', value: 'grocery', case_sensitive: false },
          { field: 'description', operator: 'contains', value: 'supermarket', case_sensitive: false }
        ],
        enabled: true,
        created_at: new Date().toISOString(),
        matches_count: 45
      },
      {
        id: '2',
        name: 'Gas Stations',
        category: 'Transportation',
        conditions: [
          { field: 'description', operator: 'contains', value: 'gas', case_sensitive: false },
          { field: 'description', operator: 'contains', value: 'fuel', case_sensitive: false }
        ],
        enabled: true,
        created_at: new Date().toISOString(),
        matches_count: 28
      },
      {
        id: '3',
        name: 'Large Purchases',
        category: 'Shopping',
        conditions: [
          { field: 'amount', operator: 'greater_than', value: '500' }
        ],
        enabled: false,
        created_at: new Date().toISOString(),
        matches_count: 12
      }
    ];
    setRules(sampleRules);
  }, []);

  const handleRuleToggle = (ruleId: string) => {
    const updatedRules = rules.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    );
    setRules(updatedRules);
    onRuleChange?.(updatedRules);
  };

  const handleDeleteRule = (ruleId: string) => {
    const updatedRules = rules.filter(rule => rule.id !== ruleId);
    setRules(updatedRules);
    onRuleChange?.(updatedRules);
  };

  const handleNewRule = () => {
    const newRule: CategoryRule = {
      id: Date.now().toString(),
      name: 'New Rule',
      category: 'Other',
      conditions: [
        { field: 'description', operator: 'contains', value: '', case_sensitive: false }
      ],
      enabled: true,
      created_at: new Date().toISOString()
    };
    setRules([...rules, newRule]);
    setIsEditing(newRule.id);
    // no-op: previously closed new-rule form
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<CategoryRule>) => {
    const updatedRules = rules.map(rule =>
      rule.id === ruleId ? { ...rule, ...updates } : rule
    );
    setRules(updatedRules);
    onRuleChange?.(updatedRules);
  };

  const renderRuleEditor = (rule: CategoryRule) => {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rule Name
            </label>
            <input
              type="text"
              value={rule.name}
              onChange={(e) => handleUpdateRule(rule.id, { name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={rule.category}
              onChange={(e) => handleUpdateRule(rule.id, { category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {defaultCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Conditions (OR logic)
          </label>
          {rule.conditions.map((condition, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <select
                value={condition.field}
                onChange={(e) => {
                  const newConditions = [...rule.conditions];
                  newConditions[index] = { ...condition, field: e.target.value as any };
                  handleUpdateRule(rule.id, { conditions: newConditions });
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="description">Description</option>
                <option value="amount">Amount</option>
                <option value="account">Account</option>
              </select>
              
              <select
                value={condition.operator}
                onChange={(e) => {
                  const newConditions = [...rule.conditions];
                  newConditions[index] = { ...condition, operator: e.target.value as any };
                  handleUpdateRule(rule.id, { conditions: newConditions });
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="contains">contains</option>
                <option value="equals">equals</option>
                <option value="starts_with">starts with</option>
                <option value="ends_with">ends with</option>
                {condition.field === 'amount' && (
                  <>
                    <option value="greater_than">greater than</option>
                    <option value="less_than">less than</option>
                  </>
                )}
              </select>
              
              <input
                type={condition.field === 'amount' ? 'number' : 'text'}
                value={condition.value}
                onChange={(e) => {
                  const newConditions = [...rule.conditions];
                  newConditions[index] = { ...condition, value: e.target.value };
                  handleUpdateRule(rule.id, { conditions: newConditions });
                }}
                placeholder="Value..."
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              
              {rule.conditions.length > 1 && (
                <button
                  onClick={() => {
                    const newConditions = rule.conditions.filter((_, i) => i !== index);
                    handleUpdateRule(rule.id, { conditions: newConditions });
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          
          <button
            onClick={() => {
              const newConditions = [...rule.conditions, {
                field: 'description' as const,
                operator: 'contains' as const,
                value: '',
                case_sensitive: false
              }];
              handleUpdateRule(rule.id, { conditions: newConditions });
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Condition
          </button>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={() => setIsEditing(null)}
            className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => setIsEditing(null)}
            className="px-3 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Save Rule
          </button>
        </div>
      </div>
    );
  };

  const renderRule = (rule: CategoryRule) => {
    if (isEditing === rule.id) {
      return renderRuleEditor(rule);
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <TagIcon className="w-5 h-5 text-gray-400" />
              <h3 className="font-medium text-gray-900">{rule.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                rule.enabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {rule.enabled ? 'Active' : 'Disabled'}
              </span>
            </div>
            
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {rule.category}
              </span>
            </div>
            
            <div className="mt-2 text-sm text-gray-600">
              <strong>Conditions:</strong>
              {rule.conditions.map((condition, index) => (
                <span key={index} className="ml-2">
                  {index > 0 && 'OR '}
                  {condition.field} {condition.operator} "{condition.value}"
                </span>
              ))}
            </div>
            
            {rule.matches_count !== undefined && (
              <div className="mt-2 text-xs text-gray-500">
                Matched {rule.matches_count} transactions
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleRuleToggle(rule.id)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                rule.enabled
                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
            >
              {rule.enabled ? 'Disable' : 'Enable'}
            </button>
            
            <button
              onClick={() => setIsEditing(rule.id)}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium hover:bg-blue-200"
            >
              Edit
            </button>
            
            <button
              onClick={() => handleDeleteRule(rule.id)}
              className="p-1 text-red-500 hover:text-red-700"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Categorization Rules
          </h2>
          <p className="text-gray-600 mt-1">
            Automatically categorize transactions based on custom rules
          </p>
        </div>
        
        <button
          onClick={handleNewRule}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          New Rule
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Total Rules</p>
              <p className="text-2xl font-bold text-blue-700">{rules.length}</p>
            </div>
            <TagIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Active Rules</p>
              <p className="text-2xl font-bold text-green-700">
                {rules.filter(r => r.enabled).length}
              </p>
            </div>
            <MagnifyingGlassIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-purple-900">Total Matches</p>
              <p className="text-2xl font-bold text-purple-700">
                {rules.reduce((sum, rule) => sum + (rule.matches_count || 0), 0)}
              </p>
            </div>
            <TagIcon className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Rules list */}
      <div className="space-y-4">
        {rules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <TagIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium">No categorization rules yet</p>
            <p className="text-sm">Create your first rule to automatically categorize transactions</p>
          </div>
        ) : (
          rules.map(rule => (
            <div key={rule.id}>
              {renderRule(rule)}
            </div>
          ))
        )}
      </div>

      {/* Help text */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">How it works:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Rules are applied in order when processing transactions</li>
          <li>• Multiple conditions in a rule use OR logic</li>
          <li>• Text matching is case-insensitive by default</li>
          <li>• Rules can be temporarily disabled without deletion</li>
        </ul>
      </div>
    </div>
  );
}