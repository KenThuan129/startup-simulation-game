/**
 * Comprehensive data generation script
 * Generates expanded actions, events, anomalies, and boss moves
 * Run with: npx ts-node scripts/generate-expanded-data.ts
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { balanceRanges, generateCriticalSuccess, generateSuccess, generateFailure, generateCriticalFailure } from '../src/game/data/event-generator';

const categories = ['product', 'marketing', 'tech', 'business_dev', 'operations', 'finance', 'research', 'high_risk'];

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEventIds(category: string, startIndex: number, count: number): string[] {
  const prefix = category === 'business_dev' ? 'business' : category;
  return Array.from({ length: count }, (_, i) => `${prefix}_event_${startIndex + i}`);
}

// Event narrative templates
const eventTemplates: Record<string, string[]> = {
  product: [
    'Feature Development Challenge',
    'User Feedback Integration',
    'Technical Debt Discovery',
    'Feature Launch',
    'UX Research Session',
    'Design System Update',
    'Accessibility Improvements',
    'Mobile App Development',
    'Critical Bug Discovery',
    'Security Vulnerability',
    'Performance Issues',
    'Data Loss Incident',
    'Database Optimization',
    'API Rate Limiting',
    'Caching Implementation',
    'Microservices Migration',
    'Code Refactoring',
    'Feature Deprecation',
    'User Testing Session',
    'Product Roadmap Planning',
    'Beta Feature Rollout',
    'A/B Test Results',
    'User Onboarding Optimization',
    'Feature Flag Management',
    'Product Analytics Review',
    'Customer Support Integration',
    'Third-Party Integration',
    'API Documentation',
    'Product Localization',
    'Feature Request Prioritization',
    'Technical Specification Review',
    'Product Demo Preparation',
    'User Training Materials',
    'Feature Announcement',
    'Product Launch Event',
    'User Community Feedback',
    'Product Metrics Analysis',
    'Feature Sunset Planning',
    'Product Quality Audit',
    'User Journey Mapping',
    'Product Strategy Session',
  ],
  marketing: [
    'Viral Social Media Post',
    'PR Crisis',
    'Content Goes Viral',
    'Influencer Partnership Success',
    'Brand Ambassador Program',
    'Email Campaign Launch',
    'Partnership with Media Outlet',
    'Referral Program Launch',
    'SEO Optimization Campaign',
    'Trade Show Participation',
    'Podcast Appearance',
    'Content Marketing Series',
    'Paid Ad Campaign',
    'Community Building Initiative',
    'Partnership Marketing',
    'Retargeting Campaign',
    'Social Media Engagement',
    'Press Release Distribution',
    'Video Content Creation',
    'Influencer Outreach',
    'Brand Awareness Campaign',
    'Customer Testimonial Collection',
    'Case Study Development',
    'Webinar Hosting',
    'Event Sponsorship',
    'Award Submission',
    'Media Interview',
    'Thought Leadership Content',
    'Customer Success Stories',
    'Market Research Presentation',
    'Competitive Analysis Report',
    'Brand Positioning Review',
    'Marketing Automation Setup',
    'Customer Segmentation Campaign',
    'Loyalty Program Launch',
    'Seasonal Marketing Campaign',
    'Product Launch Marketing',
    'Rebranding Initiative',
    'Marketing Budget Allocation',
    'ROI Analysis Review',
  ],
  tech: [
    'Infrastructure Scaling',
    'Security Breach Attempt',
    'CI/CD Implementation',
    'Database Migration',
    'Security Audit',
    'API Rate Limiting Implementation',
    'Monitoring System Setup',
    'Load Testing',
    'Backup System Implementation',
    'Code Review Process',
    'Automated Testing',
    'Cloud Migration',
    'Database Query Optimization',
    'API Versioning',
    'Container Orchestration',
    'Service Mesh Implementation',
    'Performance Bottleneck',
    'Security Patch Deployment',
    'Infrastructure Cost Optimization',
    'Disaster Recovery Test',
    'API Gateway Setup',
    'Microservices Communication',
    'Database Replication',
    'CDN Configuration',
    'SSL Certificate Renewal',
    'Dependency Update',
    'Code Quality Metrics',
    'Technical Debt Assessment',
    'Infrastructure Monitoring',
    'Security Compliance Check',
    'API Documentation',
    'Developer Onboarding',
    'Code Deployment Pipeline',
    'Error Tracking Setup',
    'Performance Monitoring',
    'Security Scanning',
    'Infrastructure Automation',
    'Database Backup Verification',
    'API Endpoint Testing',
    'System Architecture Review',
  ],
  business_dev: [
    'Strategic Partnership Opportunity',
    'Investor Meeting',
    'Customer Discovery Session',
    'Enterprise Sales Pitch',
    'Channel Partner Onboarding',
    'Strategic Alliance Formation',
    'Investor Relations Update',
    'Customer Success Program',
    'Sales Team Expansion',
    'Market Expansion Planning',
    'Distribution Partnership',
    'Strategic Acquisition Discussion',
    'Joint Venture Proposal',
    'Enterprise Contract Negotiation',
    'Partner Integration',
    'Customer Advisory Board',
    'Sales Process Optimization',
    'Enterprise Demo',
    'Partnership Agreement',
    'Customer Reference Program',
    'Sales Training Program',
    'Market Entry Strategy',
    'Strategic Planning Session',
    'Customer Retention Program',
    'Partnership Marketing Campaign',
    'Enterprise Onboarding',
    'Sales Pipeline Review',
    'Customer Feedback Session',
    'Strategic Roadmap Alignment',
    'Partnership Performance Review',
    'Enterprise Support Setup',
    'Customer Success Metrics',
    'Sales Enablement',
    'Partnership Integration',
    'Enterprise Security Review',
    'Customer Case Study',
    'Strategic Partnership Review',
    'Sales Forecast Review',
    'Customer Expansion Opportunity',
    'Partnership Renewal',
  ],
  operations: [
    'Hiring Process',
    'Team Building Activity',
    'Process Improvement',
    'Office Setup',
    'Remote Work Infrastructure',
    'HR Policy Implementation',
    'Employee Training Program',
    'Vendor Management',
    'Supply Chain Optimization',
    'Quality Assurance Process',
    'Customer Support Setup',
    'Legal Compliance Review',
    'Risk Management Assessment',
    'Facility Management',
    'Employee Onboarding',
    'Performance Review Process',
    'Team Communication Tools',
    'Workflow Optimization',
    'Resource Allocation',
    'Capacity Planning',
    'Vendor Negotiation',
    'Contract Management',
    'Compliance Audit',
    'Safety Protocol Implementation',
    'Employee Retention Program',
    'Knowledge Management System',
    'Documentation Process',
    'Change Management',
    'Stakeholder Communication',
    'Project Management Setup',
    'Team Collaboration Tools',
    'Process Documentation',
    'Quality Control Process',
    'Vendor Performance Review',
    'Resource Planning',
    'Team Structure Review',
    'Operational Efficiency Review',
    'Cost Management Process',
    'Service Level Agreement',
    'Operational Metrics Review',
  ],
  finance: [
    'Budget Review Meeting',
    'Cost Cutting Initiative',
    'Pricing Strategy Review',
    'Revenue Stream Analysis',
    'Financial Planning Session',
    'Tax Strategy Optimization',
    'Invoice Management System',
    'Expense Tracking Implementation',
    'Financial Reporting Setup',
    'Cash Flow Analysis',
    'Investment Strategy Review',
    'Credit Line Application',
    'Equity Financing Round',
    'Debt Refinancing',
    'Financial Audit',
    'Cost-Benefit Analysis',
    'Financial Forecasting',
    'Vendor Payment Optimization',
    'Revenue Recognition',
    'Financial Controls Review',
    'Budget Allocation Review',
    'Financial Risk Assessment',
    'Capital Allocation Decision',
    'Financial Performance Review',
    'Cost Structure Analysis',
    'Revenue Model Optimization',
    'Financial Compliance Check',
    'Investment Opportunity Evaluation',
    'Financial Planning Tool',
    'Expense Approval Process',
    'Financial Dashboard Setup',
    'Cost Center Analysis',
    'Financial Reporting Automation',
    'Budget Variance Analysis',
    'Financial KPI Review',
    'Cash Management Optimization',
    'Financial System Integration',
    'Financial Planning Process',
    'Cost Optimization Initiative',
    'Financial Strategy Review',
  ],
  research: [
    'Market Research Study',
    'User Research Session',
    'Technology Evaluation',
    'Competitive Analysis',
    'User Interview Series',
    'Survey Distribution',
    'Data Analysis Project',
    'Trend Analysis Report',
    'Technology Assessment',
    'Customer Segmentation Study',
    'Market Validation Research',
    'Product-Market Fit Analysis',
    'User Persona Development',
    'Market Sizing Analysis',
    'User Behavior Study',
    'Competitive Intelligence',
    'Technology Research',
    'Market Opportunity Analysis',
    'User Needs Assessment',
    'Industry Trend Research',
    'Technology Feasibility Study',
    'Market Entry Research',
    'User Experience Research',
    'Competitive Benchmarking',
    'Technology Stack Evaluation',
    'Market Segmentation',
    'User Journey Research',
    'Competitive Positioning',
    'Technology Innovation Research',
    'Market Demand Analysis',
    'User Feedback Analysis',
    'Competitive Strategy Research',
    'Technology Adoption Research',
    'Market Growth Analysis',
    'User Satisfaction Study',
    'Competitive Advantage Research',
    'Technology Integration Research',
    'Market Dynamics Analysis',
    'User Engagement Research',
    'Competitive Response Research',
  ],
  high_risk: [
    'Rapid Market Expansion',
    'Major Strategic Pivot',
    'Competitor Acquisition Attempt',
    'Aggressive Marketing Blitz',
    'Major Technology Rewrite',
    'International Market Entry',
    'Competitive Attack Campaign',
    'High-Stakes Partnership',
    'Massive Hiring Initiative',
    'Product Line Expansion',
    'Market Disruption Attempt',
    'Regulatory Challenge',
    'Major Capital Investment',
    'Strategic Bet',
    'Aggressive Pricing Strategy',
    'Market Share Grab',
    'Technology Platform Shift',
    'Major Rebranding',
    'Strategic Partnership Risk',
    'Market Leadership Push',
    'Aggressive Growth Strategy',
    'Technology Innovation Risk',
    'Market Expansion Risk',
    'Competitive Response',
    'Strategic Initiative',
    'High-Risk Investment',
    'Market Entry Risk',
    'Technology Risk',
    'Strategic Decision',
    'Market Opportunity Risk',
    'Competitive Risk',
    'Technology Adoption Risk',
    'Market Position Risk',
    'Strategic Risk',
    'High-Stakes Decision',
    'Market Challenge',
    'Competitive Threat',
    'Technology Challenge',
    'Strategic Challenge',
    'Market Risk',
  ],
};

// Generate decision-based choice text - describes ACTION/DECISION, not outcome
function generateOutcomeText(type: string, category: string, eventName: string): string {
  // Create nuanced scenarios that reflect real startup decision-making
  const realisticChoices: Record<string, Record<string, Record<string, string[]>>> = {
    critical_success: {
      product: {
        'Feature Development Challenge': [
          `Push aggressively for MVP launch - Your risk pays off spectacularly. You beat competitors to market, and users love the feature. Early adoption gives you a significant advantage.`,
          `Invest heavily in the feature - Your commitment pays off. The feature becomes a differentiator that drives growth.`,
        ],
        'User Feedback Integration': [
          `Implement all top requests immediately - Users are thrilled. Your responsiveness creates loyal advocates who spread the word.`,
          `Take the comprehensive approach - You address user needs systematically, building strong product-market fit.`,
        ],
      },
      marketing: {
        'Social Media Campaign': [
          `Double down with paid ads across platforms - Your campaign hits at the perfect moment. The investment pays off many times over as you capture the market.`,
          `Go all-in on the campaign - Your bold move pays off. The campaign goes viral, bringing unprecedented attention.`,
        ],
        'Influencer Partnership': [
          `Partner with top-tier influencers - The partnership is a game-changer. Their endorsement brings massive credibility and reach.`,
          `Invest in multiple influencer collaborations - Your diversified approach captures different audiences, maximizing impact.`,
        ],
      },
      tech: {
        'Infrastructure Scaling': [
          `Invest in robust, scalable infrastructure - Your forward-thinking approach pays off. The system handles growth beautifully.`,
          `Choose enterprise-grade solutions - Premium infrastructure becomes a competitive advantage, enabling rapid scaling.`,
        ],
      },
      business_dev: {
        'Strategic Partnership Opportunity': [
          `Pursue the partnership aggressively - The deal transforms your business. New markets open, revenue multiplies.`,
          `Negotiate for maximum value - Your strategic approach secures an incredible deal that accelerates growth.`,
        ],
      },
    },
    success: {
      product: {
        'Feature Development Challenge': [
          `Take a balanced approach - Careful planning pays off. You deliver a solid feature that meets user needs without overcommitting.`,
          `Follow best practices - Your methodical approach delivers reliable results. Steady progress builds confidence.`,
        ],
      },
      marketing: {
        'Social Media Campaign': [
          `Use a measured marketing strategy - Your balanced approach finds the right audience. Steady, sustainable growth follows.`,
          `Try a conservative campaign - A safe play that delivers consistent results without burning cash.`,
        ],
      },
    },
    failure: {
      product: {
        'Feature Development Challenge': [
          `Play it too safe - You avoid risks, but also miss opportunities. Competitors move faster, and you're left behind.`,
          `Take the conservative route - While you avoid disaster, you also miss the window. The feature arrives too late to matter.`,
        ],
      },
      marketing: {
        'Social Media Campaign': [
          `Cut marketing budget to save costs - You save money short-term but lose momentum. Your market presence shrinks while competitors grow.`,
          `Spread marketing too thin - Trying to reach everyone means you don't resonate with anyone. Weak results.`,
        ],
      },
    },
    critical_failure: {
      product: {
        'Feature Development Challenge': [
          `Rush an unfinished feature to market - The feature crashes on launch, damaging your reputation. Users lose trust, competitors gain ground.`,
          `Ignore user feedback completely - You build what you think users want, but they don't. Resources wasted, opportunity lost.`,
        ],
      },
      marketing: {
        'Social Media Campaign': [
          `Bet everything on a single channel - The channel fails, and you've burned through your marketing budget with nothing to show.`,
          `Use deceptive marketing tactics - Backlash is severe. Negative publicity damages your brand for months.`,
        ],
      },
    },
  };

  // Get category-specific templates or fallback to generic realistic scenarios
  const categoryChoices = realisticChoices[type]?.[category];
  if (categoryChoices && categoryChoices[eventName]) {
    const templates = categoryChoices[eventName];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // Fallback: Generate realistic scenarios based on category and type
  const fallbackTemplates: Record<string, Record<string, string[]>> = {
    critical_success: {
      product: [
        `Take the bold, aggressive approach - Your risk pays off spectacularly. Perfect timing and execution create exceptional results.`,
        `Go all-in with full commitment - Your dedication pays off. The outcome exceeds all expectations.`,
      ],
      marketing: [
        `Double down on the strategy - Your bold move hits at the perfect moment. Exceptional results follow.`,
        `Invest heavily - The commitment pays off many times over. Growth accelerates dramatically.`,
      ],
      tech: [
        `Invest in premium solutions - Your forward-thinking approach becomes a competitive advantage.`,
        `Take the comprehensive approach - Building it right prevents future problems and enables growth.`,
      ],
      business_dev: [
        `Pursue aggressively - The deal transforms your business trajectory. Strategic wins compound.`,
        `Negotiate for maximum value - Your approach secures an incredible opportunity.`,
      ],
    },
    success: {
      product: [
        `Take a balanced, measured approach - Careful planning delivers solid, reliable results.`,
        `Follow best practices - Your methodical approach yields steady progress.`,
      ],
      marketing: [
        `Use a moderate strategy - Balanced approach finds the right audience without overspending.`,
        `Try a conservative campaign - Safe play that delivers consistent results.`,
      ],
      tech: [
        `Balance cost and capability - Pragmatic solution that meets needs without over-engineering.`,
        `Choose proven solutions - Established technology reduces risk while delivering results.`,
      ],
      business_dev: [
        `Negotiate a balanced deal - Mutually beneficial agreement creates steady value.`,
        `Take a cautious approach - You avoid bad deals while securing reasonable terms.`,
      ],
    },
    failure: {
      product: [
        `Play it too safe - You avoid risks but miss opportunities. Competitors move faster.`,
        `Take the conservative route - While safe, you miss the timing window. Results are lackluster.`,
      ],
      marketing: [
        `Cut budget to save costs - Short-term savings cost long-term momentum. Market presence shrinks.`,
        `Spread efforts too thin - Trying to reach everyone means resonating with no one.`,
      ],
      tech: [
        `Cut corners to save money - Short-term savings lead to technical debt and future problems.`,
        `Choose the cheapest option - You get what you pay for. The solution fails under pressure.`,
      ],
      business_dev: [
        `Be too conservative - You play it so safe that no meaningful deals materialize.`,
        `Rush into agreements - Deals look good on paper but fail to deliver expected value.`,
      ],
    },
    critical_failure: {
      product: [
        `Rush an unfinished solution - It crashes spectacularly, damaging reputation and losing users.`,
        `Ignore best practices completely - Fundamental flaws require complete rebuild, wasting all resources.`,
      ],
      marketing: [
        `Bet everything on a single failed channel - Budget burned with zero results.`,
        `Use deceptive tactics - Severe backlash damages brand for months.`,
      ],
      tech: [
        `Ignore infrastructure needs - Systems crumble under pressure, causing major outages.`,
        `Make rushed technical decisions - Quick fixes create problems requiring complete rebuild.`,
      ],
      business_dev: [
        `Sign a bad deal - Partnership becomes a liability, draining resources.`,
        `Burn bridges with aggressive tactics - Reputation damaged, future deals harder to secure.`,
      ],
    },
  };

  const templates = fallbackTemplates[type]?.[category] || fallbackTemplates[type]?.['product'] || ['You make a decision.'];
  return templates[Math.floor(Math.random() * templates.length)];
}

// Generate contextual description based on event type
function generateContextualDescription(category: string, eventName: string): string {
  const contextualTemplates: Record<string, Record<string, string[]>> = {
    finance: {
      'Budget Review Meeting': [
        'You are reviewing your financial situation and need to make critical budget decisions.',
        'Your team is analyzing spending patterns and you must decide how to allocate resources.',
        'Financial planning is underway and you face important choices about budget allocation.',
      ],
      'Investment Strategy Review': [
        'You are evaluating investment opportunities and must decide where to allocate capital.',
        'Your startup is considering different investment strategies to grow capital.',
        'Investment decisions are on the table and you need to choose your approach.',
      ],
      'Cost Cutting Initiative': [
        'You are looking to reduce expenses and must decide which areas to cut.',
        'Cost optimization is needed and you face difficult choices about spending.',
        'Your startup needs to trim costs and you must choose what to prioritize.',
      ],
      'High-Risk Investment': [
        'You are considering a high-risk investment opportunity that could transform or break your startup.',
        'A risky investment option has appeared and you must decide whether to take the gamble.',
        'You are facing a high-stakes investment decision that could make or break your company.',
      ],
    },
    tech: {
      'Infrastructure Scaling': [
        'You are scaling up your infrastructure to handle growth and must choose your approach.',
        'Your systems are under pressure and you need to decide how to scale.',
        'Infrastructure expansion is needed and you face critical technical decisions.',
      ],
      'Security Breach Attempt': [
        'A security threat has been detected and you must decide how to respond.',
        'Your systems are under attack and you need to choose your defense strategy.',
        'Security concerns have emerged and you must decide how to protect your startup.',
      ],
      'Database Migration': [
        'You are migrating your database and must choose the migration strategy.',
        'Database upgrade is necessary and you face critical technical decisions.',
        'You are moving to a new database system and need to decide your approach.',
      ],
      'Performance Bottleneck': [
        'Performance issues are slowing down your system and you must decide how to fix them.',
        'Your application is experiencing slowdowns and you need to choose an optimization strategy.',
        'Performance problems have emerged and you face critical technical decisions.',
      ],
    },
    product: {
      'Feature Development Challenge': [
        'You are developing a new feature and must decide how to approach the development.',
        'Feature development is underway and you face critical product decisions.',
        'A new feature is being built and you need to choose your development strategy.',
      ],
      'User Feedback Integration': [
        'Users are providing feedback and you must decide how to incorporate it.',
        'Customer feedback has come in and you need to choose how to respond.',
        'User suggestions are piling up and you face important product decisions.',
      ],
      'Feature Launch': [
        'You are preparing to launch a new feature and must decide your launch strategy.',
        'A feature is ready to go live and you need to choose how to roll it out.',
        'Feature launch is imminent and you face critical go-to-market decisions.',
      ],
    },
    marketing: {
      'Social Media Campaign': [
        'You are planning a social media campaign and must decide your marketing approach.',
        'Social media marketing is on the agenda and you face important promotional decisions.',
        'You are launching a social campaign and need to choose your strategy.',
      ],
      'Influencer Partnership': [
        'Influencer partnership opportunities have emerged and you must decide how to proceed.',
        'You are considering influencer collaborations and need to choose your approach.',
        'Influencer marketing options are available and you face critical partnership decisions.',
      ],
    },
    business_dev: {
      'Strategic Partnership Opportunity': [
        'A strategic partnership opportunity has appeared and you must decide how to proceed.',
        'You are evaluating a potential partnership and need to choose your negotiation strategy.',
        'Partnership discussions are underway and you face critical business decisions.',
      ],
      'Investor Meeting': [
        'An investor meeting is scheduled and you must decide how to present your startup.',
        'You are preparing for investor discussions and need to choose your pitch approach.',
        'Investor interest has emerged and you face important fundraising decisions.',
      ],
    },
    high_risk: {
      'Rapid Market Expansion': [
        'You are considering rapid expansion and must decide whether to take the risk.',
        'Market expansion opportunities have appeared and you face high-stakes decisions.',
        'You are scaling up your market presence and need to choose your expansion strategy.',
      ],
      'Major Strategic Pivot': [
        'You are considering a major pivot and must decide if it\'s the right move.',
        'Strategic changes are being discussed and you face critical directional decisions.',
        'A pivot opportunity has emerged and you need to choose whether to change course.',
      ],
      'Major Technology Rewrite': [
        'You are considering rewriting your technology stack and must decide if it\'s worth the risk.',
        'A major technical overhaul is being considered and you face critical engineering decisions.',
        'Technology rewrite options are on the table and you need to choose your approach.',
      ],
    },
  };

  // Try to find specific contextual description
  const categoryTemplates = contextualTemplates[category];
  if (categoryTemplates && categoryTemplates[eventName]) {
    const templates = categoryTemplates[eventName];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // Fallback: Generate generic contextual descriptions
  const genericContexts: Record<string, string[]> = {
    finance: [
      'You are facing financial decisions that will impact your startup\'s future.',
      'Financial planning is underway and you must make critical choices.',
      'You are evaluating financial options and need to decide your approach.',
    ],
    tech: [
      'You are facing technical challenges and must decide how to address them.',
      'Technical decisions are needed and you face critical infrastructure choices.',
      'You are dealing with technical issues and need to choose your solution approach.',
    ],
    product: [
      'You are making product decisions that will shape your startup\'s direction.',
      'Product development is underway and you face critical feature choices.',
      'You are working on product improvements and need to decide your strategy.',
    ],
    marketing: [
      'You are planning marketing initiatives and must decide your promotional approach.',
      'Marketing opportunities have emerged and you face important campaign decisions.',
      'You are evaluating marketing strategies and need to choose your tactics.',
    ],
    business_dev: [
      'You are facing business development opportunities and must decide how to proceed.',
      'Partnership and growth opportunities are available and you face critical decisions.',
      'You are exploring business opportunities and need to choose your approach.',
    ],
    operations: [
      'You are making operational decisions that will affect your team and processes.',
      'Operational improvements are needed and you face critical management choices.',
      'You are optimizing operations and need to decide your strategy.',
    ],
    research: [
      'You are conducting research and must decide how to gather and use insights.',
      'Research opportunities have emerged and you face important analytical decisions.',
      'You are evaluating market data and need to choose your research approach.',
    ],
    high_risk: [
      'You are facing high-risk decisions that could transform or endanger your startup.',
      'High-stakes opportunities have appeared and you must decide whether to take the gamble.',
      'You are considering risky moves and need to choose your approach carefully.',
    ],
  };

  const contexts = genericContexts[category] || genericContexts['product'] || ['You face a critical decision.'];
  return contexts[Math.floor(Math.random() * contexts.length)];
}

// Generate a single event
function generateEvent(category: string, eventId: string, eventName: string): any {
  const contextualDesc = generateContextualDescription(category, eventName);
  
  return {
    eventId,
    category,
    name: eventName,
    description: contextualDesc,
    choices: [
      {
        choiceId: `${eventId}_cs`,
        type: 'critical_success',
        text: generateOutcomeText('critical_success', category, eventName),
        effects: generateCriticalSuccess(balanceRanges),
      },
      {
        choiceId: `${eventId}_s`,
        type: 'success',
        text: generateOutcomeText('success', category, eventName),
        effects: generateSuccess(balanceRanges),
      },
      {
        choiceId: `${eventId}_f`,
        type: 'failure',
        text: generateOutcomeText('failure', category, eventName),
        effects: generateFailure(balanceRanges),
      },
      {
        choiceId: `${eventId}_cf`,
        type: 'critical_failure',
        text: generateOutcomeText('critical_failure', category, eventName),
        effects: generateCriticalFailure(balanceRanges),
      },
    ],
  };
}

// Generate expanded actions (12+ per category)
function generateExpandedActions(): any[] {
  const allActions: any[] = [];
  const actionTemplates = {
    product: ['Build New Feature', 'Improve User Experience', 'Fix Critical Bugs', 'Performance Optimization', 'Add Mobile Support', 'Implement Analytics', 'User Onboarding Flow', 'A/B Testing Framework', 'API Development', 'Accessibility Improvements', 'Internationalization', 'Product Documentation', 'Beta Testing Program', 'Feature Flags System'],
    marketing: ['Social Media Campaign', 'Influencer Partnership', 'Content Marketing', 'Paid Advertising', 'Email Marketing', 'SEO Optimization', 'Webinar Series', 'Community Building', 'Referral Program', 'PR Campaign', 'Trade Show Participation', 'Partnership Marketing', 'Video Marketing', 'Podcast Sponsorship'],
    tech: ['Upgrade Infrastructure', 'Security Audit', 'Implement CI/CD', 'Database Optimization', 'API Rate Limiting', 'Monitoring System', 'Load Testing', 'Backup System', 'Code Review Process', 'Automated Testing', 'Cloud Migration', 'Microservices Architecture', 'Container Orchestration', 'Service Mesh'],
    business_dev: ['Strategic Partnership', 'Pitch to Investors', 'Customer Discovery', 'B2B Sales Outreach', 'Channel Partnerships', 'Enterprise Sales', 'Strategic Alliances', 'Investor Relations', 'Customer Success Program', 'Sales Team Building', 'Market Expansion', 'Distribution Partnerships', 'Strategic Acquisition', 'Joint Ventures'],
    operations: ['Hire Developer', 'Hire Marketer', 'Improve Processes', 'Team Building', 'Office Setup', 'Remote Work Infrastructure', 'HR Policies', 'Employee Training', 'Vendor Management', 'Supply Chain Optimization', 'Quality Assurance', 'Customer Support', 'Legal Compliance', 'Risk Management'],
    finance: ['Budget Review', 'Cost Cutting', 'Pricing Strategy', 'Revenue Optimization', 'Financial Planning', 'Tax Optimization', 'Invoice Management', 'Expense Tracking', 'Financial Reporting', 'Cash Flow Management', 'Investment Strategy', 'Credit Line', 'Equity Financing', 'Debt Refinancing'],
    research: ['Market Research', 'User Research', 'Technology Research', 'Competitive Analysis', 'User Interviews', 'Surveys and Polls', 'Data Analysis', 'Trend Analysis', 'Technology Evaluation', 'Customer Segmentation', 'Market Validation', 'Product-Market Fit', 'User Personas', 'Market Sizing'],
    high_risk: ['Rapid Expansion', 'Major Pivot', 'Acquisition Attempt', 'All-In Marketing Blitz', 'Major Technology Rewrite', 'International Expansion', 'Competitive Attack', 'High-Stakes Partnership', 'Major Hiring Spree', 'Product Line Expansion', 'Market Disruption', 'Regulatory Challenge', 'Major Investment', 'Strategic Bet'],
  };

  categories.forEach(category => {
    const prefix = category === 'business_dev' ? 'business' : category;
    const templates = actionTemplates[category as keyof typeof actionTemplates] || [];
    
    for (let i = 0; i < 14; i++) {
      const actionId = `${prefix}_action_${i + 1}`;
      const eventStartIndex = i * 4 + 1;
      const eventPool = generateEventIds(category, eventStartIndex, 4);
      
      allActions.push({
        actionId,
        category,
        name: templates[i] || `${category} Action ${i + 1}`,
        description: `Perform ${templates[i]?.toLowerCase() || `${category} action`}`,
        eventPool,
      });
    }
  });

  return allActions;
}

// Generate expanded events (60+ per category to cover all action references)
function generateExpandedEvents(): any[] {
  const allEvents: any[] = [];
  
  categories.forEach(category => {
    const prefix = category === 'business_dev' ? 'business' : category;
    const templates = eventTemplates[category] || [];
    
    // Generate 60 events per category (actions.json references up to event_56)
    for (let i = 0; i < 60; i++) {
      const eventId = `${prefix}_event_${i + 1}`;
      // Cycle through templates if we need more than available
      const templateIndex = i % templates.length;
      const eventName = templates[templateIndex] || `${category} Event ${i + 1}`;
      allEvents.push(generateEvent(category, eventId, eventName));
    }
  });

  return allEvents;
}

// Generate expanded anomalies (30+)
function generateExpandedAnomalies(): any[] {
  const anomalyTemplates = [
    { name: 'Surprise Enterprise Client', effects: { cash: 50000, users: 200, hype: 20, xp: 100 }, triggers: ['business_dev', 'marketing'] },
    { name: 'Infrastructure Breakdown', effects: { cash: -5000, users: -150, quality: -15, hype: -25, xp: 10 }, triggers: ['tech', 'operations'] },
    { name: 'Market Crash', effects: { cash: -10000, users: -100, hype: -20, xp: 5 } },
    { name: 'Viral Moment', effects: { cash: -2000, users: 1000, hype: 50, xp: 150 }, flags: ['viral_moment'], triggers: ['marketing', 'product'] },
    { name: 'Key Employee Leaves', effects: { cash: -3000, quality: -10, hype: -10, xp: 5 }, triggers: ['operations'] },
    { name: 'Competitor Launch', effects: { cash: -2000, users: -200, hype: -15, xp: 8 } },
    { name: 'Investor Interest', effects: { cash: 30000, hype: 30, xp: 80 }, triggers: ['business_dev', 'finance'] },
    { name: 'Regulatory Change', effects: { cash: -8000, quality: -5, xp: 15 } },
    { name: 'Major Media Coverage', effects: { cash: -1000, users: 400, hype: 35, xp: 90 }, triggers: ['marketing', 'business_dev'] },
    { name: 'Data Breach Attempt', effects: { cash: -6000, users: -180, quality: -20, hype: -30, xp: 10 }, triggers: ['tech'] },
    { name: 'Partnership Opportunity', effects: { cash: -2000, users: 300, hype: 25, xp: 70 }, triggers: ['business_dev'] },
    { name: 'Product Recall', effects: { cash: -12000, users: -250, quality: -25, hype: -35, xp: 12 }, triggers: ['product', 'tech'] },
    { name: 'Talent Acquisition', effects: { cash: -5000, quality: 20, hype: 15, xp: 60 }, triggers: ['operations'] },
    { name: 'Patent Filing', effects: { cash: -3000, hype: 20, xp: 50 }, triggers: ['research', 'product'] },
    { name: 'Acquisition Offer', effects: { cash: 100000, hype: 40, xp: 200 }, triggers: ['business_dev'] },
    { name: 'Unexpected Windfall', effects: { cash: 25000, xp: 50 } },
    { name: 'Server Outage', effects: { cash: -4000, users: -120, quality: -10, hype: -20, xp: 8 }, triggers: ['tech'] },
    { name: 'Celebrity Endorsement', effects: { cash: -5000, users: 600, hype: 45, xp: 100 }, triggers: ['marketing'] },
    { name: 'Supply Chain Disruption', effects: { cash: -7000, quality: -8, xp: 12 }, triggers: ['operations'] },
    { name: 'Market Expansion Opportunity', effects: { cash: -3000, users: 250, hype: 20, xp: 70 }, triggers: ['business_dev'] },
    { name: 'Technology Breakthrough', effects: { cash: -2000, quality: 25, hype: 30, xp: 80 }, triggers: ['tech', 'research'] },
    { name: 'Customer Success Story', effects: { cash: -500, users: 150, hype: 15, xp: 40 }, triggers: ['marketing'] },
    { name: 'Competitive Threat', effects: { cash: -3000, users: -150, hype: -18, xp: 10 } },
    { name: 'Industry Award', effects: { cash: -1000, hype: 35, xp: 60 }, triggers: ['marketing', 'product'] },
    { name: 'Economic Downturn', effects: { cash: -15000, users: -200, hype: -25, xp: 8 } },
    { name: 'Strategic Partnership Success', effects: { cash: -1500, users: 350, hype: 28, xp: 75 }, triggers: ['business_dev'] },
    { name: 'Security Vulnerability Found', effects: { cash: -4000, quality: -12, hype: -15, xp: 8 }, triggers: ['tech'] },
    { name: 'User Base Explosion', effects: { cash: -3000, users: 800, hype: 40, xp: 120 }, triggers: ['marketing', 'product'] },
    { name: 'Regulatory Compliance Issue', effects: { cash: -10000, quality: -15, hype: -20, xp: 10 } },
    { name: 'Innovation Recognition', effects: { cash: -500, hype: 25, xp: 55 }, triggers: ['product', 'research'] },
    { name: 'Market Leader Endorsement', effects: { cash: -2000, users: 500, hype: 38, xp: 90 }, triggers: ['business_dev', 'marketing'] },
  ];

  return anomalyTemplates.map((template, i) => ({
    anomalyId: `anomaly_${i + 1}`,
    name: template.name,
    description: `An unexpected event: ${template.name.toLowerCase()}`,
    effects: template.effects,
    triggers: template.triggers || [],
    flags: template.flags || [],
  }));
}

// Generate boss moves (15+)
function generateBossMoves(): any[] {
  return [
    { actionId: 'boss_attack_1', type: 'attack', name: 'Aggressive Marketing Blitz', description: 'The competitor launches a massive marketing campaign targeting your users.', effects: { users: -50, hype: -10 } },
    { actionId: 'boss_attack_2', type: 'attack', name: 'Price War', description: 'The competitor slashes prices, forcing you to match or lose customers.', effects: { cash: -2000, users: -30 } },
    { actionId: 'boss_attack_3', type: 'attack', name: 'Talent Poaching', description: 'The competitor poaches your key employees.', effects: { quality: -15, hype: -8 } },
    { actionId: 'boss_attack_4', type: 'attack', name: 'Feature Copy', description: 'The competitor copies your key features and launches them first.', effects: { users: -80, hype: -15 } },
    { actionId: 'boss_attack_5', type: 'attack', name: 'Negative PR Campaign', description: 'The competitor spreads negative rumors about your company.', effects: { hype: -25, users: -40 } },
    { actionId: 'boss_defense_1', type: 'defense', name: 'Counter-Marketing Campaign', description: 'Launch your own marketing campaign to retain users.', effects: { cash: -1500, users: 20, hype: 5 } },
    { actionId: 'boss_defense_2', type: 'defense', name: 'Focus on Quality', description: 'Double down on product quality to differentiate.', effects: { cash: -1000, quality: 10 } },
    { actionId: 'boss_defense_3', type: 'defense', name: 'Innovation Push', description: 'Accelerate innovation to stay ahead.', effects: { cash: -2000, quality: 15, hype: 10 } },
    { actionId: 'boss_defense_4', type: 'defense', name: 'Customer Loyalty Program', description: 'Launch a loyalty program to retain customers.', effects: { cash: -800, users: 30, hype: 8 } },
    { actionId: 'boss_defense_5', type: 'defense', name: 'Strategic Partnership', description: 'Form a strategic partnership to counter the threat.', effects: { cash: -1200, users: 50, hype: 12 } },
    { actionId: 'boss_attack_6', type: 'attack', name: 'Market Saturation', description: 'The competitor floods the market, making it harder to stand out.', effects: { users: -60, hype: -12 } },
    { actionId: 'boss_attack_7', type: 'attack', name: 'Exclusive Deals', description: 'The competitor signs exclusive deals with key partners.', effects: { users: -70, hype: -18 } },
    { actionId: 'boss_defense_6', type: 'defense', name: 'Rapid Feature Development', description: 'Quickly develop new features to compete.', effects: { cash: -1800, quality: 12, users: 25 } },
    { actionId: 'boss_defense_7', type: 'defense', name: 'Community Building', description: 'Build a strong community to defend against attacks.', effects: { cash: -600, users: 40, hype: 15 } },
    { actionId: 'boss_attack_8', type: 'attack', name: 'Technology Superiority', description: 'The competitor showcases superior technology.', effects: { quality: -10, hype: -20 } },
  ];
}

// Main execution
console.log('Generating expanded game data...');

console.log('1. Generating actions...');
const actions = generateExpandedActions();
writeFileSync(join(__dirname, '../src/game/data/actions.json'), JSON.stringify(actions, null, 2));
console.log(`   Generated ${actions.length} actions (${actions.length / categories.length} per category)`);

console.log('2. Generating events...');
const events = generateExpandedEvents();
writeFileSync(join(__dirname, '../src/game/data/events.json'), JSON.stringify(events, null, 2));
console.log(`   Generated ${events.length} events (${events.length / categories.length} per category)`);

console.log('3. Generating anomalies...');
const anomalies = generateExpandedAnomalies();
writeFileSync(join(__dirname, '../src/game/data/anomalies.json'), JSON.stringify(anomalies, null, 2));
console.log(`   Generated ${anomalies.length} anomalies`);

console.log('4. Generating boss moves...');
const bossMoves = generateBossMoves();
writeFileSync(join(__dirname, '../src/game/data/bosses.json'), JSON.stringify(bossMoves, null, 2));
console.log(`   Generated ${bossMoves.length} boss moves`);

console.log('\n✅ Data generation complete!');

