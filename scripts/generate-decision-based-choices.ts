/**
 * Generate decision-based event choices - choices that describe ACTIONS/DECISIONS, not outcomes
 * This makes choices ambiguous and realistic, hiding which option is best
 * Run with: npx ts-node scripts/generate-decision-based-choices.ts
 */

import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { balanceRanges, generateCriticalSuccess, generateSuccess, generateFailure, generateCriticalFailure } from '../src/game/data/event-generator';

const categories = ['product', 'marketing', 'tech', 'business_dev', 'operations', 'finance', 'research', 'high_risk'];

// Decision-based choices: Actions/Decisions that don't reveal outcomes
// Format: [decision_text, outcome_type]
// The decision text should be an action/choice, not an outcome description
const decisionChoices: Record<string, Record<string, Array<[string, 'critical_success' | 'success' | 'failure' | 'critical_failure']>>> = {
  finance: {
    'Budget Review Meeting': [
      ['Rebuild the budget from scratch', 'critical_failure'],
      ['Hire a financial consultant to review', 'success'],
      ['Ask the team to justify all expenses', 'failure'],
      ['Implement automated budget tracking', 'critical_success'],
    ],
    'Investment Strategy Review': [
      ['Put everything in high-risk investments', 'critical_failure'],
      ['Diversify across multiple asset classes', 'critical_success'],
      ['Keep all funds in cash reserves', 'failure'],
      ['Consult with investment advisors', 'success'],
    ],
    'Cost Cutting Initiative': [
      ['Lay off 30% of the team immediately', 'critical_failure'],
      ['Negotiate better vendor contracts', 'critical_success'],
      ['Cut all marketing spending', 'failure'],
      ['Implement lean operations practices', 'success'],
    ],
    'Financial Planning Session': [
      ['Skip planning and focus on growth', 'critical_failure'],
      ['Create detailed 12-month financial projections', 'critical_success'],
      ['Use generic industry benchmarks', 'failure'],
      ['Work with finance team on conservative estimates', 'success'],
    ],
  },
  tech: {
    'Infrastructure Scaling': [
      ['Rebuild everything from scratch', 'failure'],
      ['Ask AI to help refactor the project', 'critical_failure'],
      ['Reduce redundant components in infrastructure', 'success'],
      ['Invest in enterprise-grade scalable solutions', 'critical_success'],
    ],
    'Security Breach Attempt': [
      ['Ignore it and hope it goes away', 'critical_failure'],
      ['Implement multi-layer security immediately', 'critical_success'],
      ['Just add a firewall', 'failure'],
      ['Hire a security consultant', 'success'],
    ],
    'Database Migration': [
      ['Do it manually overnight', 'critical_failure'],
      ['Use a proven migration tool with rollback', 'critical_success'],
      ['Copy data directly without testing', 'failure'],
      ['Migrate in phases with backups', 'success'],
    ],
    'Performance Bottleneck': [
      ['Throw more servers at it', 'failure'],
      ['Refactor the bottleneck code completely', 'critical_success'],
      ['Ignore it for now', 'critical_failure'],
      ['Profile and optimize specific functions', 'success'],
    ],
  },
  product: {
    'Feature Development Challenge': [
      ['Ship MVP immediately without testing', 'critical_failure'],
      ['Spend 3 months perfecting before launch', 'failure'],
      ['Release beta to 100 selected users first', 'success'],
      ['Build with user feedback loop integrated', 'critical_success'],
    ],
    'User Feedback Integration': [
      ['Ignore all feedback and trust your vision', 'critical_failure'],
      ['Implement every single request', 'failure'],
      ['Prioritize by user impact and feasibility', 'critical_success'],
      ['Create a public roadmap showing priorities', 'success'],
    ],
    'Critical Bug Discovery': [
      ['Delay fix to next release cycle', 'critical_failure'],
      ['Hotfix immediately without testing', 'failure'],
      ['Fix properly with tests and deploy carefully', 'critical_success'],
      ['Form a task force to address systematically', 'success'],
    ],
    'Feature Launch': [
      ['Launch to all users at once', 'failure'],
      ['Cancel launch to add more features', 'critical_failure'],
      ['Soft launch to 10% of users first', 'success'],
      ['Launch with feature flags for gradual rollout', 'critical_success'],
    ],
  },
  marketing: {
    'Social Media Campaign': [
      ['Spend entire budget on one viral post attempt', 'critical_failure'],
      ['Skip marketing to save money', 'failure'],
      ['Run small tests across multiple platforms', 'success'],
      ['Invest in quality content with clear targeting', 'critical_success'],
    ],
    'Influencer Partnership': [
      ['Partner with the biggest name regardless of cost', 'critical_failure'],
      ['Avoid influencers entirely', 'failure'],
      ['Work with micro-influencers in your niche', 'critical_success'],
      ['Test with one influencer first', 'success'],
    ],
    'PR Crisis': [
      ['Stay silent and wait it out', 'critical_failure'],
      ['Blame competitors publicly', 'failure'],
      ['Issue immediate transparent apology', 'critical_success'],
      ['Hire PR firm to handle response', 'success'],
    ],
    'Content Marketing Series': [
      ['Publish 10 articles in one week', 'failure'],
      ['Don\'t create any content', 'critical_failure'],
      ['Publish one high-quality piece weekly', 'critical_success'],
      ['Repurpose existing content', 'success'],
    ],
  },
  business_dev: {
    'Strategic Partnership Opportunity': [
      ['Accept first offer without negotiation', 'critical_failure'],
      ['Reject all partnerships to stay independent', 'failure'],
      ['Negotiate terms that benefit both parties', 'critical_success'],
      ['Consult legal before committing', 'success'],
    ],
    'Investor Meeting': [
      ['Exaggerate numbers to impress', 'critical_failure'],
      ['Cancel the meeting', 'failure'],
      ['Prepare detailed pitch with realistic projections', 'critical_success'],
      ['Show basic metrics and vision', 'success'],
    ],
    'Enterprise Sales Pitch': [
      ['Promise features you can\'t deliver', 'critical_failure'],
      ['Present generic demo to everyone', 'failure'],
      ['Customize pitch to their specific pain points', 'critical_success'],
      ['Send pre-recorded demo video', 'success'],
    ],
  },
  operations: {
    'Hiring Process': [
      ['Hire anyone who applies quickly', 'critical_failure'],
      ['Take 6 months to find perfect candidate', 'failure'],
      ['Implement structured interview process', 'critical_success'],
      ['Use referrals from current team', 'success'],
    ],
    'Team Building Activity': [
      ['Skip team building to save time', 'failure'],
      ['Force mandatory weekend retreat', 'critical_failure'],
      ['Organize optional casual team events', 'success'],
      ['Create ongoing collaborative projects', 'critical_success'],
    ],
    'Remote Work Infrastructure': [
      ['Expect team to use personal tools', 'failure'],
      ['Don\'t invest in remote tools', 'critical_failure'],
      ['Provide proper collaboration software', 'critical_success'],
      ['Set up basic video conferencing', 'success'],
    ],
  },
  research: {
    'Market Research Study': [
      ['Skip research and trust your gut', 'critical_failure'],
      ['Spend months on exhaustive research', 'failure'],
      ['Conduct focused interviews with target users', 'critical_success'],
      ['Use free online market reports', 'success'],
    ],
    'User Research Session': [
      ['Ask leading questions to confirm biases', 'critical_failure'],
      ['Don\'t do any user research', 'failure'],
      ['Conduct unbiased open-ended interviews', 'critical_success'],
      ['Send out a quick survey', 'success'],
    ],
    'Competitive Analysis': [
      ['Ignore competitors completely', 'critical_failure'],
      ['Copy competitor features directly', 'failure'],
      ['Analyze gaps and find differentiation', 'critical_success'],
      ['Quick review of competitor websites', 'success'],
    ],
  },
  high_risk: {
    'Rapid Market Expansion': [
      ['Expand to 10 countries simultaneously', 'critical_failure'],
      ['Stay in one market forever', 'failure'],
      ['Test one new market carefully first', 'success'],
      ['Expand with local partners', 'critical_success'],
    ],
    'Major Strategic Pivot': [
      ['Pivot overnight without planning', 'critical_failure'],
      ['Never pivot despite market signals', 'failure'],
      ['Pivot gradually with user validation', 'critical_success'],
      ['Run parallel tests before full pivot', 'success'],
    ],
    'Major Technology Rewrite': [
      ['Rewrite everything in a new language', 'critical_failure'],
      ['Keep legacy code forever', 'failure'],
      ['Refactor incrementally with tests', 'critical_success'],
      ['Rewrite one module as proof of concept', 'success'],
    ],
  },
};

// Generate decision-based choice text (just the action/decision, no outcome)
function generateDecisionText(category: string, eventName: string, outcomeType: 'critical_success' | 'success' | 'failure' | 'critical_failure'): string {
  // Check if we have specific decisions for this event
  const eventDecisions = decisionChoices[category]?.[eventName];
  if (eventDecisions) {
    const matchingDecisions = eventDecisions.filter(d => d[1] === outcomeType);
    if (matchingDecisions.length > 0) {
      return matchingDecisions[Math.floor(Math.random() * matchingDecisions.length)][0];
    }
  }

  // Fallback: Generate generic decision-based choices
  const genericDecisions: Record<string, Record<string, string[]>> = {
    critical_success: {
      product: [
        'Build with user feedback integrated from day one',
        'Invest in comprehensive testing infrastructure',
        'Design for scalability from the start',
        'Create clear documentation alongside development',
      ],
      marketing: [
        'Focus on authentic community building',
        'Invest in quality content over quantity',
        'Build relationships with key influencers',
        'Use data-driven targeting strategies',
      ],
      tech: [
        'Choose proven, scalable architecture',
        'Implement comprehensive monitoring',
        'Build with security as a priority',
        'Design for maintainability',
      ],
      finance: [
        'Create detailed financial forecasts',
        'Diversify revenue streams',
        'Maintain healthy cash reserves',
        'Implement automated financial tracking',
      ],
      business_dev: [
        'Negotiate win-win partnerships',
        'Build relationships before asking',
        'Provide value first, sell second',
        'Focus on long-term strategic deals',
      ],
      operations: [
        'Establish clear processes and documentation',
        'Invest in team development',
        'Create positive company culture',
        'Build scalable operational systems',
      ],
      research: [
        'Conduct thorough user interviews',
        'Validate assumptions with data',
        'Study market trends deeply',
        'Analyze competitive landscape carefully',
      ],
      high_risk: [
        'Test carefully before scaling',
        'Validate assumptions at each step',
        'Build partnerships to reduce risk',
        'Maintain flexibility in approach',
      ],
    },
    success: {
      product: [
        'Follow industry best practices',
        'Release incrementally with feedback',
        'Balance speed and quality',
        'Use proven frameworks and tools',
      ],
      marketing: [
        'Run targeted campaigns',
        'Focus on one channel at a time',
        'Measure and adjust strategies',
        'Build organic growth',
      ],
      tech: [
        'Use reliable third-party services',
        'Implement standard security practices',
        'Follow coding best practices',
        'Maintain regular backups',
      ],
      finance: [
        'Track expenses carefully',
        'Review budget monthly',
        'Consult with advisors',
        'Use standard accounting practices',
      ],
      business_dev: [
        'Take meetings with potential partners',
        'Network at industry events',
        'Follow up consistently',
        'Build case studies',
      ],
      operations: [
        'Hire based on team fit',
        'Set clear expectations',
        'Use standard HR practices',
        'Provide basic training',
      ],
      research: [
        'Review existing market data',
        'Send user surveys',
        'Analyze usage metrics',
        'Study competitor features',
      ],
      high_risk: [
        'Move forward cautiously',
        'Test one aspect at a time',
        'Have backup plans ready',
        'Consult with experts',
      ],
    },
    failure: {
      product: [
        'Rush to market without proper testing',
        'Skip user research',
        'Use outdated technology',
        'Ignore scalability concerns',
      ],
      marketing: [
        'Spend without tracking ROI',
        'Target everyone at once',
        'Copy competitor campaigns exactly',
        'Ignore brand consistency',
      ],
      tech: [
        'Choose cheapest hosting option',
        'Skip security updates',
        'Use deprecated libraries',
        'Ignore performance warnings',
      ],
      finance: [
        'Spend without budget tracking',
        'Ignore cash flow warnings',
        'Mix personal and business expenses',
        'Delay financial reviews',
      ],
      business_dev: [
        'Accept any deal quickly',
        'Overpromise to close deals',
        'Skip due diligence',
        'Ignore partnership red flags',
      ],
      operations: [
        'Hire without proper screening',
        'Skip onboarding process',
        'Ignore team feedback',
        'Don\'t document processes',
      ],
      research: [
        'Base decisions on assumptions',
        'Skip user validation',
        'Ignore market data',
        'Rely only on internal opinions',
      ],
      high_risk: [
        'Move too slowly to act',
        'Avoid taking any risks',
        'Wait for perfect conditions',
        'Overthink every decision',
      ],
    },
    critical_failure: {
      product: [
        'Ship broken features to production',
        'Ignore all user feedback',
        'Use experimental tech for core features',
        'Skip all quality checks',
      ],
      marketing: [
        'Spend entire budget on one failed campaign',
        'Use misleading marketing tactics',
        'Ignore negative feedback',
        'Copy competitor exactly without thinking',
      ],
      tech: [
        'Ignore critical security vulnerabilities',
        'Delete database without backup',
        'Use unmaintained dependencies',
        'Skip all testing',
      ],
      finance: [
        'Mix business and personal accounts completely',
        'Ignore all financial warnings',
        'Make major investments without research',
        'Spend without any budget',
      ],
      business_dev: [
        'Sign bad deal out of desperation',
        'Burn bridges with potential partners',
        'Lie to investors',
        'Ignore legal advice',
      ],
      operations: [
        'Hire unqualified friends',
        'Create toxic work environment',
        'Ignore all HR best practices',
        'Don\'t provide any training',
      ],
      research: [
        'Make decisions based on zero data',
        'Ignore all market signals',
        'Build features no one wants',
        'Skip competitive analysis completely',
      ],
      high_risk: [
        'Bet everything on one risky move',
        'Ignore all warning signs',
        'Move forward without any validation',
        'Make irreversible decisions quickly',
      ],
    },
  };

  const categoryDecisions = genericDecisions[outcomeType]?.[category] || genericDecisions[outcomeType]?.['product'] || ['Make a decision'];
  return categoryDecisions[Math.floor(Math.random() * categoryDecisions.length)];
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

// Generate a single event with decision-based choices
function generateDecisionBasedEvent(category: string, eventId: string, eventName: string): any {
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
        text: generateDecisionText(category, eventName, 'critical_success'),
        effects: generateCriticalSuccess(balanceRanges),
      },
      {
        choiceId: `${eventId}_s`,
        type: 'success',
        text: generateDecisionText(category, eventName, 'success'),
        effects: generateSuccess(balanceRanges),
      },
      {
        choiceId: `${eventId}_f`,
        type: 'failure',
        text: generateDecisionText(category, eventName, 'failure'),
        effects: generateFailure(balanceRanges),
      },
      {
        choiceId: `${eventId}_cf`,
        type: 'critical_failure',
        text: generateDecisionText(category, eventName, 'critical_failure'),
        effects: generateCriticalFailure(balanceRanges),
      },
    ],
  };
}

// Read existing events.json and regenerate with decision-based choices
function regenerateEventsWithDecisionChoices(): any[] {
  const eventsPath = join(__dirname, '../src/game/data/events.json');
  const existingEvents = JSON.parse(readFileSync(eventsPath, 'utf-8'));
  
  return existingEvents.map((event: any) => {
    return generateDecisionBasedEvent(event.category, event.eventId, event.name);
  });
}

// Main execution
console.log('Generating decision-based event choices...');
const events = regenerateEventsWithDecisionChoices();
writeFileSync(
  join(__dirname, '../src/game/data/events.json'),
  JSON.stringify(events, null, 2)
);
console.log(`✅ Regenerated ${events.length} events with decision-based choices`);
console.log('Choices now describe ACTIONS/DECISIONS rather than outcomes, making them ambiguous and realistic!');
