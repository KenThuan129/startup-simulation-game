import { SkillData } from '../types';
import skillData from './skills.json';

export class SkillDataLoader {
  private static skills: Map<string, SkillData> = new Map();
  private static initialized = false;

  static initialize(): void {
    if (this.initialized) return;

    const skills = Array.isArray(skillData) ? skillData : [];
    for (const skill of skills) {
      // Type assertion for JSON data
      this.skills.set(skill.skillId, skill as SkillData);
    }

    this.initialized = true;
  }

  static getSkill(skillId: string): SkillData | null {
    this.initialize();
    return this.skills.get(skillId) || null;
  }

  static async getAllSkills(): Promise<SkillData[]> {
    this.initialize();
    return Array.from(this.skills.values());
  }

  static async getSkillsByTree(tree: string): Promise<SkillData[]> {
    this.initialize();
    return Array.from(this.skills.values()).filter(s => s.tree === tree);
  }
}

