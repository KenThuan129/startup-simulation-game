/**
 * Data generation script for expanding game content
 * Run with: npx ts-node scripts/generate-data.ts
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

const categories = ['product', 'marketing', 'tech', 'business_dev', 'operations', 'finance', 'research', 'high_risk'];

// Helper to generate random number in range
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate event IDs for a category
function generateEventIds(category: string, startIndex: number, count: number): string[] {
  const prefix = category === 'business_dev' ? 'business' : category;
  return Array.from({ length: count }, (_, i) => `${prefix}_event_${startIndex + i}`);
}

// Generate expanded actions (12+ per category)
function generateActions() {
  const allActions: any[] = [];
  
  categories.forEach(category => {
    const categoryActions: any[] = [];
    const prefix = category === 'business_dev' ? 'business' : category;
    
    // Action templates per category
    const templates: Record<string, string[][]> = {
      product: [
        ['Build New Feature', 'Develop a new feature for your product'],
        ['Improve User Experience', 'Focus on UX improvements'],
        ['Fix Critical Bugs', 'Address major bugs affecting users'],
        ['Performance Optimization', 'Optimize app performance and speed'],
        ['Add Mobile Support', 'Extend your product to mobile platforms'],
        ['Implement Analytics', 'Add analytics and tracking capabilities'],
        ['User Onboarding Flow', 'Improve new user onboarding experience'],
        ['A/B Testing Framework', 'Set up A/B testing infrastructure'],
        ['API Development', 'Build public API for integrations'],
        ['Accessibility Improvements', 'Make product more accessible'],
        ['Internationalization', 'Add multi-language support'],
        ['Product Documentation', 'Create comprehensive product docs'],
        ['Beta Testing Program', 'Launch beta testing with select users'],
        ['Feature Flags System', 'Implement feature flagging system'],
      ],
      marketing: [
        ['Social Media Campaign', 'Launch a social media marketing campaign'],
        ['Influencer Partnership', 'Partner with influencers to promote your product'],
        ['Content Marketing', 'Create and distribute content to attract users'],
        ['Paid Advertising', 'Invest in paid ads across platforms'],
        ['Email Marketing', 'Launch email marketing campaign'],
        ['SEO Optimization', 'Improve search engine visibility'],
        ['Webinar Series', 'Host educational webinars'],
        ['Community Building', 'Build online community around product'],
        ['Referral Program', 'Launch user referral program'],
        ['PR Campaign', 'Public relations and media outreach'],
        ['Trade Show Participation', 'Attend industry trade shows'],
        ['Partnership Marketing', 'Form marketing partnerships'],
        ['Video Marketing', 'Create video content and ads'],
        ['Podcast Sponsorship', 'Sponsor relevant podcasts'],
      ],
      tech: [
        ['Upgrade Infrastructure', 'Scale your technical infrastructure'],
        ['Security Audit', 'Conduct a security audit and fix vulnerabilities'],
        ['Implement CI/CD', 'Set up continuous integration and deployment'],
        ['Database Optimization', 'Optimize database performance and queries'],
        ['API Rate Limiting', 'Implement rate limiting'],
        ['Monitoring System', 'Set up monitoring and alerting'],
        ['Load Testing', 'Conduct load testing'],
        ['Backup System', 'Implement backup and disaster recovery'],
        ['Code Review Process', 'Establish code review practices'],
        ['Automated Testing', 'Implement comprehensive test suite'],
        ['Cloud Migration', 'Migrate to cloud infrastructure'],
        ['Microservices Architecture', 'Refactor to microservices'],
        ['Container Orchestration', 'Implement container orchestration'],
        ['Service Mesh', 'Set up service mesh for microservices'],
      ],
      business_dev: [
        ['Strategic Partnership', 'Form a strategic partnership with another company'],
        ['Pitch to Investors', 'Present your startup to potential investors'],
        ['Customer Discovery', 'Conduct customer interviews and research'],
        ['B2B Sales Outreach', 'Reach out to potential enterprise clients'],
        ['Channel Partnerships', 'Build channel partner network'],
        ['Enterprise Sales', 'Target enterprise customers'],
        ['Strategic Alliances', 'Form strategic alliances'],
        ['Investor Relations', 'Maintain investor relationships'],
        ['Customer Success Program', 'Launch customer success initiative'],
        ['Sales Team Building', 'Hire and train sales team'],
        ['Market Expansion', 'Expand to new markets'],
        ['Distribution Partnerships', 'Partner with distributors'],
        ['Strategic Acquisition', 'Explore acquisition opportunities'],
        ['Joint Ventures', 'Form joint venture partnerships'],
      ],
      operations: [
        ['Hire Developer', 'Recruit a new developer to your team'],
        ['Hire Marketer', 'Bring on a marketing specialist'],
        ['Improve Processes', 'Streamline internal processes'],
        ['Team Building', 'Invest in team morale and culture'],
        ['Office Setup', 'Set up physical office space'],
        ['Remote Work Infrastructure', 'Build remote work capabilities'],
        ['HR Policies', 'Establish HR policies and procedures'],
        ['Employee Training', 'Invest in employee development'],
        ['Vendor Management', 'Optimize vendor relationships'],
        ['Supply Chain Optimization', 'Improve supply chain efficiency'],
        ['Quality Assurance', 'Implement QA processes'],
        ['Customer Support', 'Build customer support team'],
        ['Legal Compliance', 'Ensure legal compliance'],
        ['Risk Management', 'Implement risk management processes'],
      ],
      finance: [
        ['Budget Review', 'Review and optimize your budget'],
        ['Cost Cutting', 'Identify and reduce unnecessary costs'],
        ['Pricing Strategy', 'Review and adjust pricing model'],
        ['Revenue Optimization', 'Find new revenue streams'],
        ['Financial Planning', 'Create financial forecasts'],
        ['Tax Optimization', 'Optimize tax strategy'],
        ['Invoice Management', 'Improve invoicing and collections'],
        ['Expense Tracking', 'Implement expense tracking system'],
        ['Financial Reporting', 'Set up financial reporting'],
        ['Cash Flow Management', 'Optimize cash flow'],
        ['Investment Strategy', 'Develop investment strategy'],
        ['Credit Line', 'Secure credit line'],
        ['Equity Financing', 'Raise equity financing'],
        ['Debt Refinancing', 'Refinance existing debt'],
      ],
      research: [
        ['Market Research', 'Study market trends and competitors'],
        ['User Research', 'Deep dive into user behavior and needs'],
        ['Technology Research', 'Explore new technologies and tools'],
        ['Competitive Analysis', 'Analyze competitor strategies'],
        ['User Interviews', 'Conduct user interviews'],
        ['Surveys and Polls', 'Run user surveys'],
        ['Data Analysis', 'Analyze user and market data'],
        ['Trend Analysis', 'Study industry trends'],
        ['Technology Evaluation', 'Evaluate new technologies'],
        ['Customer Segmentation', 'Segment customer base'],
        ['Market Validation', 'Validate market opportunity'],
        ['Product-Market Fit', 'Research product-market fit'],
        ['User Personas', 'Develop user personas'],
        ['Market Sizing', 'Size target market'],
      ],
      high_risk: [
        ['Rapid Expansion', 'Aggressively expand to new markets'],
        ['Major Pivot', 'Make a significant pivot in strategy'],
        ['Acquisition Attempt', 'Attempt to acquire a smaller competitor'],
        ['All-In Marketing Blitz', 'Spend heavily on a massive marketing campaign'],
        ['Major Technology Rewrite', 'Rewrite core technology'],
        ['International Expansion', 'Expand internationally'],
        ['Competitive Attack', 'Launch aggressive competitive campaign'],
        ['High-Stakes Partnership', 'Form high-risk partnership'],
        ['Major Hiring Spree', 'Hire large number of employees'],
        ['Product Line Expansion', 'Launch multiple new products'],
        ['Market Disruption', 'Attempt to disrupt market'],
        ['Regulatory Challenge', 'Challenge industry regulations'],
        ['Major Investment', 'Make large capital investment'],
        ['Strategic Bet', 'Make high-risk strategic bet'],
      ],
    };

    const categoryTemplates = templates[category] || [];
    
    // Generate 14 actions per category (more than required 12)
    for (let i = 0; i < 14; i++) {
      const template = categoryTemplates[i] || [`${category} Action ${i + 1}`, `Perform ${category} action`];
      const actionId = `${prefix}_action_${i + 1}`;
      const eventStartIndex = i * 4 + 1;
      const eventPool = generateEventIds(category, eventStartIndex, 4);
      
      categoryActions.push({
        actionId,
        category,
        name: template[0],
        description: template[1],
        eventPool,
      });
    }
    
    allActions.push(...categoryActions);
  });

  return allActions;
}

console.log('Generating expanded actions...');
const actions = generateActions();
writeFileSync(
  join(__dirname, '../src/game/data/actions.json'),
  JSON.stringify(actions, null, 2)
);
console.log(`Generated ${actions.length} actions (${actions.length / categories.length} per category)`);

