import rolesData from '../data/roles.json';

export interface RoleData {
  roleId: string;
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  skillTreeBonuses: {
    product: number;
    marketing: number;
    finance: number;
    technology: number;
  };
}

export class RoleSystem {
  static getAllRoles(): RoleData[] {
    return rolesData.roles as RoleData[];
  }

  static getRole(roleId: string): RoleData | null {
    const role = rolesData.roles.find((r: RoleData) => r.roleId === roleId);
    return role || null;
  }

  static getSkillTreeBonus(roleId: string, tree: 'product' | 'marketing' | 'finance' | 'technology'): number {
    const role = this.getRole(roleId);
    if (!role) return 1.0;
    return role.skillTreeBonuses[tree] || 1.0;
  }

  static getXPMultiplier(roleId: string): number {
    const role = this.getRole(roleId);
    if (!role) return 1.0;
    
    // Founder gets +15% XP
    if (roleId === 'founder') return 1.15;
    
    // Operations Manager gets -10% XP
    if (roleId === 'operations_manager') return 0.9;
    
    return 1.0;
  }

  static getEventOutcomeBonus(roleId: string): number {
    const role = this.getRole(roleId);
    if (!role) return 0;
    
    // Founder gets +10% success rate
    if (roleId === 'founder') return 0.1;
    
    return 0;
  }

  static getActionPointCostReduction(roleId: string): number {
    const role = this.getRole(roleId);
    if (!role) return 0;
    
    // Operations Manager gets 10% reduction
    if (roleId === 'operations_manager') return 0.1;
    
    return 0;
  }

  static getCategoryEffectiveness(roleId: string, category: string): number {
    const role = this.getRole(roleId);
    if (!role) return 1.0;
    
    // Map action categories to skill trees for role bonuses
    const categoryMap: Record<string, 'product' | 'marketing' | 'finance' | 'technology'> = {
      'product': 'product',
      'marketing': 'marketing',
      'finance': 'finance',
      'tech': 'technology',
      'technology': 'technology',
      'business_dev': 'marketing',
      'operations': 'finance',
      'research': 'technology',
      'high_risk': 'product',
    };
    
    const tree = categoryMap[category] || 'product';
    return role.skillTreeBonuses[tree] || 1.0;
  }
}

