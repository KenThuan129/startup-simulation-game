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

// Generate a single event with decision-based choices
function generateDecisionBasedEvent(category: string, eventId: string, eventName: string): any {
  return {
    eventId,
    category,
    name: eventName,
    description: `You face a critical decision about ${eventName.toLowerCase()}. Each choice represents a different approach - choose wisely.`,
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
