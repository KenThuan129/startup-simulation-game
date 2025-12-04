/**
 * Generate realistic anomaly data with proper flags and triggers
 * Run with: npx ts-node scripts/generate-realistic-anomalies.ts
 */

interface AnomalyTemplate {
  name: string;
  description: string;
  effects: {
    cash?: number;
    users?: number;
    quality?: number;
    hype?: number;
    virality?: number;
    xp?: number;
  };
  triggers?: string[];
  flags?: string[];
  weight?: number; // Higher = more likely
}

const anomalyTemplates: AnomalyTemplate[] = [
  // Positive anomalies (40%)
  {
    name: 'Surprise Enterprise Client',
    description: 'A Fortune 500 company reaches out for a custom enterprise solution. This could be huge!',
    effects: { cash: 50000, users: 200, hype: 20, xp: 100 },
    triggers: ['business_dev', 'marketing'],
    weight: 3,
  },
  {
    name: 'Viral Social Media Moment',
    description: 'Your product goes viral on TikTok/Reddit. Users are flooding in faster than you can handle!',
    effects: { cash: -2000, users: 1000, hype: 50, virality: 15, xp: 150 },
    triggers: ['marketing', 'product'],
    flags: ['viral_moment', 'modify_marketing'],
    weight: 2,
  },
  {
    name: 'Investor Interest',
    description: 'A top-tier VC firm expresses serious interest. They want to schedule a meeting.',
    effects: { cash: 30000, hype: 30, xp: 80 },
    triggers: ['business_dev', 'finance'],
    weight: 3,
  },
  {
    name: 'Major Media Coverage',
    description: 'TechCrunch/TechRadar features your startup. The exposure is incredible!',
    effects: { cash: -1000, users: 400, hype: 35, xp: 90 },
    triggers: ['marketing', 'business_dev'],
    flags: ['modify_marketing'],
    weight: 3,
  },
  {
    name: 'Strategic Partnership Success',
    description: 'A major partnership deal closes. Both companies benefit from the collaboration.',
    effects: { cash: -1500, users: 350, hype: 28, xp: 75 },
    triggers: ['business_dev'],
    weight: 3,
  },
  {
    name: 'Celebrity Endorsement',
    description: 'A well-known influencer or celebrity tweets about your product. The response is overwhelming!',
    effects: { cash: -5000, users: 600, hype: 45, xp: 100 },
    triggers: ['marketing'],
    flags: ['modify_marketing', 'viral_moment'],
    weight: 1,
  },
  {
    name: 'Technology Breakthrough',
    description: 'Your R&D team makes a significant breakthrough. This could revolutionize your product!',
    effects: { cash: -2000, quality: 25, hype: 30, xp: 80 },
    triggers: ['tech', 'research'],
    weight: 2,
  },
  {
    name: 'Industry Award',
    description: 'You win a prestigious industry award. The recognition boosts your credibility.',
    effects: { cash: -1000, hype: 35, xp: 60 },
    triggers: ['marketing', 'product'],
    weight: 2,
  },
  {
    name: 'User Base Explosion',
    description: 'Word-of-mouth spreads like wildfire. New users sign up in droves!',
    effects: { cash: -3000, users: 800, hype: 40, xp: 120 },
    triggers: ['marketing', 'product'],
    flags: ['viral_moment'],
    weight: 2,
  },
  {
    name: 'Market Leader Endorsement',
    description: 'A market leader publicly endorses your approach. This validates your strategy.',
    effects: { cash: -2000, users: 500, hype: 38, xp: 90 },
    triggers: ['business_dev', 'marketing'],
    weight: 2,
  },
  {
    name: 'Innovation Recognition',
    description: 'Your innovative approach gets recognized by industry experts. Great PR opportunity!',
    effects: { cash: -500, hype: 25, xp: 55 },
    triggers: ['product', 'research'],
    weight: 3,
  },
  {
    name: 'Talent Acquisition',
    description: 'You successfully recruit a top-tier engineer/executive. Their expertise elevates the team.',
    effects: { cash: -5000, quality: 20, hype: 15, xp: 60 },
    triggers: ['operations'],
    weight: 3,
  },
  {
    name: 'Customer Success Story',
    description: 'A major customer shares their success story. This becomes powerful marketing material.',
    effects: { cash: -500, users: 150, hype: 15, xp: 40 },
    triggers: ['marketing'],
    weight: 4,
  },
  {
    name: 'Unexpected Windfall',
    description: 'You receive an unexpected grant or tax refund. Every dollar counts!',
    effects: { cash: 25000, xp: 50 },
    weight: 2,
  },
  {
    name: 'Patent Filing Success',
    description: 'Your patent application is approved. This protects your IP and adds value.',
    effects: { cash: -3000, hype: 20, xp: 50 },
    triggers: ['research', 'product'],
    weight: 2,
  },
  {
    name: 'Market Expansion Opportunity',
    description: 'A new market opens up. This could be your chance to scale internationally!',
    effects: { cash: -3000, users: 250, hype: 20, xp: 70 },
    triggers: ['business_dev'],
    weight: 3,
  },

  // Negative anomalies (40%)
  {
    name: 'Infrastructure Breakdown',
    description: 'Your servers crash during peak hours. Users are frustrated and leaving bad reviews.',
    effects: { cash: -5000, users: -150, quality: -15, hype: -25, xp: 10 },
    triggers: ['tech', 'operations'],
    flags: ['lock_action'],
    weight: 3,
  },
  {
    name: 'Market Crash',
    description: 'The market takes a sudden downturn. Investors are pulling back, and customers are cutting spending.',
    effects: { cash: -10000, users: -100, hype: -20, xp: 5 },
    weight: 2,
  },
  {
    name: 'Key Employee Leaves',
    description: 'Your lead developer/CTO resigns to join a competitor. This is a major blow.',
    effects: { cash: -3000, quality: -10, hype: -10, xp: 5 },
    triggers: ['operations'],
    weight: 3,
  },
  {
    name: 'Competitor Launch',
    description: 'A well-funded competitor launches a similar product with aggressive marketing. They\'re stealing your users.',
    effects: { cash: -2000, users: -200, hype: -15, xp: 8 },
    weight: 3,
  },
  {
    name: 'Data Breach Attempt',
    description: 'Hackers attempt to breach your systems. While you caught it, the incident damages trust.',
    effects: { cash: -6000, users: -180, quality: -20, hype: -30, xp: 10 },
    triggers: ['tech'],
    flags: ['lock_action'],
    weight: 2,
  },
  {
    name: 'Product Recall',
    description: 'A critical bug forces you to recall a recent release. This is expensive and embarrassing.',
    effects: { cash: -12000, users: -250, quality: -25, hype: -35, xp: 12 },
    triggers: ['product', 'tech'],
    flags: ['lock_action'],
    weight: 1,
  },
  {
    name: 'Regulatory Compliance Issue',
    description: 'You discover a compliance gap. Fixing it requires immediate attention and resources.',
    effects: { cash: -10000, quality: -15, hype: -20, xp: 10 },
    weight: 2,
  },
  {
    name: 'Server Outage',
    description: 'Extended downtime due to infrastructure failure. Users are losing patience.',
    effects: { cash: -4000, users: -120, quality: -10, hype: -20, xp: 8 },
    triggers: ['tech'],
    flags: ['lock_action'],
    weight: 3,
  },
  {
    name: 'Supply Chain Disruption',
    description: 'A key supplier fails to deliver. This impacts your operations significantly.',
    effects: { cash: -7000, quality: -8, xp: 12 },
    triggers: ['operations'],
    weight: 2,
  },
  {
    name: 'Competitive Threat',
    description: 'A competitor announces a major feature that directly competes with your core value proposition.',
    effects: { cash: -3000, users: -150, hype: -18, xp: 10 },
    weight: 3,
  },
  {
    name: 'Economic Downturn',
    description: 'The economy enters a recession. Customers are cutting budgets, and fundraising becomes harder.',
    effects: { cash: -15000, users: -200, hype: -25, xp: 8 },
    weight: 1,
  },
  {
    name: 'Security Vulnerability Found',
    description: 'Security researchers discover a critical vulnerability. You must patch it immediately.',
    effects: { cash: -4000, quality: -12, hype: -15, xp: 8 },
    triggers: ['tech'],
    flags: ['lock_action'],
    weight: 2,
  },
  {
    name: 'Regulatory Change',
    description: 'New regulations are introduced that affect your business model. Compliance costs rise.',
    effects: { cash: -8000, quality: -5, xp: 15 },
    weight: 2,
  },
  {
    name: 'Partnership Falls Through',
    description: 'A major partnership deal you were counting on falls apart at the last minute.',
    effects: { cash: -2000, hype: -12, xp: 5 },
    triggers: ['business_dev'],
    weight: 3,
  },
  {
    name: 'Negative PR Campaign',
    description: 'A competitor launches a smear campaign. False rumors spread on social media.',
    effects: { cash: -5000, users: -100, hype: -30, xp: 8 },
    triggers: ['marketing'],
    weight: 1,
  },

  // Mixed/Neutral anomalies (20%)
  {
    name: 'Acquisition Offer',
    description: 'A larger company makes an acquisition offer. It\'s tempting, but accepting means giving up control.',
    effects: { cash: 100000, hype: 40, xp: 200 },
    triggers: ['business_dev'],
    flags: ['special_event'],
    weight: 1,
  },
  {
    name: 'Pivot Opportunity',
    description: 'Market feedback suggests a pivot could be beneficial. But pivoting is risky and resource-intensive.',
    effects: { cash: -5000, quality: 10, hype: 15, xp: 50 },
    triggers: ['product'],
    flags: ['special_event'],
    weight: 2,
  },
  {
    name: 'Major Customer Churn',
    description: 'Your biggest customer cancels their contract. This hurts, but frees up resources.',
    effects: { cash: -8000, users: -300, hype: -10, xp: 20 },
    triggers: ['business_dev'],
    weight: 2,
  },
  {
    name: 'Team Conflict',
    description: 'Internal team conflicts arise. Resolving them requires time and energy.',
    effects: { cash: -2000, quality: -5, hype: -8, xp: 15 },
    triggers: ['operations'],
    weight: 3,
  },
  {
    name: 'Feature Request Overload',
    description: 'Users request so many features that prioritizing becomes difficult. But engagement is high!',
    effects: { cash: -1000, users: 50, hype: 10, xp: 30 },
    triggers: ['product'],
    weight: 3,
  },
];

function generateAnomalies(): any[] {
  return anomalyTemplates.map((template, i) => ({
    anomalyId: `anomaly_${i + 1}`,
    name: template.name,
    description: template.description,
    effects: template.effects,
    triggers: template.triggers || [],
    flags: template.flags || [],
    weight: template.weight || 1,
  }));
}

// Output JSON
const anomalies = generateAnomalies();
console.log(JSON.stringify(anomalies, null, 2));

