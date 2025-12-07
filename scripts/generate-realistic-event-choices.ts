/**
 * Generate realistic event choices with nuanced, real-life startup decision scenarios
 * Run with: npx ts-node scripts/generate-realistic-event-choices.ts
 */

import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { balanceRanges, generateCriticalSuccess, generateSuccess, generateFailure, generateCriticalFailure } from '../src/game/data/event-generator';

const categories = ['product', 'marketing', 'tech', 'business_dev', 'operations', 'finance', 'research', 'high_risk'];

// Realistic choice templates that present difficult decisions with trade-offs
const realisticChoiceTemplates: Record<string, Record<string, string[][]>> = {
  product: {
    'Feature Development Challenge': [
      ['Aggressively push for MVP launch', 'Launch fast but risk bugs. Could capture market early, but quality issues may hurt reputation.'],
      ['Take time for thorough testing', 'Slower launch ensures quality, but competitors might beat you to market.'],
      ['Release as beta to select users', 'Get feedback while managing risk. Moderate approach with balanced outcomes.'],
      ['Delay launch to perfect features', 'Highest quality but may miss the window. Could be too late by the time it\'s ready.'],
    ],
    'User Feedback Integration': [
      ['Implement all top requests immediately', 'Users love it, but stretches resources thin and may break existing features.'],
      ['Prioritize by feasibility and impact', 'Balanced approach - satisfies users without overcommitting resources.'],
      ['Create a public roadmap instead', 'Transparent but doesn\'t deliver value immediately. Good for long-term trust.'],
      ['Ignore feedback and focus on vision', 'Risky - might alienate users, but allows you to stay true to your product vision.'],
    ],
  },
  marketing: {
    'Social Media Campaign': [
      ['Invest heavily in paid ads across platforms', 'High visibility but expensive. Could drain cash if it doesn\'t convert.'],
      ['Focus on organic content creation', 'Cheaper and builds authentic following, but slower growth and uncertain results.'],
      ['Partner with micro-influencers', 'Balanced cost and reach. Good ROI potential but requires relationship management.'],
      ['Skip marketing and rely on word-of-mouth', 'Free but unpredictable. Might work if product is exceptional, but risky.'],
    ],
  },
  // ... we'll generate templates for all events
};

// Generate realistic choice text based on category and event type
function generateRealisticChoiceText(
  category: string,
  eventName: string,
  outcomeType: 'critical_success' | 'success' | 'failure' | 'critical_failure'
): string {
  // Create nuanced scenarios with trade-offs
  const templates: Record<string, Record<string, string[]>> = {
    product: {
      critical_success: [
        `Push for aggressive launch - Your risk pays off spectacularly. The feature resonates perfectly with users, and your early entry gives you a significant competitive advantage.`,
        `Take the bold approach - You make the right call at the right time. Market timing aligns perfectly with your execution.`,
      ],
      success: [
        `Choose the balanced path - Your careful decision-making pays off. You avoid major pitfalls while making steady progress.`,
        `Go with the moderate option - A safe bet that delivers reliable results without taking unnecessary risks.`,
      ],
      failure: [
        `Take the conservative route - You play it too safe. While you avoid disaster, you also miss opportunities that competitors capitalize on.`,
        `Choose the middle ground - Unfortunately, being indecisive means you don't fully commit to any strategy, resulting in lackluster outcomes.`,
      ],
      critical_failure: [
        `Make the risky gamble - Your bet doesn't pay off. The aggressive move backfires, wasting resources and damaging your position.`,
        `Go all-in on the wrong strategy - You commit heavily to an approach that proves to be fundamentally flawed, causing significant setbacks.`,
      ],
    },
    marketing: {
      critical_success: [
        `Double down on the campaign - Your marketing spend hits at the perfect moment. The campaign goes viral, bringing unprecedented attention and conversions.`,
        `Take the bold marketing approach - Your message resonates deeply. The investment pays off many times over.`,
      ],
      success: [
        `Use a measured marketing strategy - Your balanced approach finds the right audience without overspending. Steady growth follows.`,
        `Try a conservative campaign - A safe marketing play that delivers modest but consistent results.`,
      ],
      failure: [
        `Cut marketing budget to save costs - You save money short-term but lose momentum. Your market presence shrinks.`,
        `Spread marketing too thin - Trying to reach everyone means you don't resonate with anyone. Weak results.`,
      ],
      critical_failure: [
        `Ignore marketing completely - Your product stays invisible. Competitors capture the market while you remain unknown.`,
        `Bet everything on a single channel - The channel fails, and you've burned through your marketing budget with nothing to show.`,
      ],
    },
    tech: {
      critical_success: [
        `Invest in robust infrastructure - Your forward-thinking approach pays off. The system scales beautifully and becomes a competitive advantage.`,
        `Take the comprehensive approach - Building it right the first time prevents future crises and positions you well.`,
      ],
      success: [
        `Balance cost and capability - A pragmatic solution that meets current needs without over-engineering. Works as intended.`,
        `Choose the proven solution - Going with established technology reduces risk. Stable and reliable.`,
      ],
      failure: [
        `Cut corners to save money - Short-term savings lead to technical debt. Problems emerge later that cost more to fix.`,
        `Choose the cheapest option - You get what you pay for. The solution fails under load, causing outages.`,
      ],
      critical_failure: [
        `Ignore infrastructure needs - Your systems crumble under pressure. Major outages damage your reputation and user base.`,
        `Make a rushed technical decision - The quick fix creates fundamental problems that require a complete rebuild.`,
      ],
    },
    business_dev: {
      critical_success: [
        `Pursue the strategic partnership aggressively - The partnership becomes a game-changer, opening new markets and revenue streams.`,
        `Take the high-risk, high-reward approach - Your bold move pays off. The deal transforms your business trajectory.`,
      ],
      success: [
        `Negotiate a balanced partnership - A mutually beneficial deal that creates value for both parties. Steady progress.`,
        `Take a cautious partnership approach - You avoid bad deals while securing reasonable terms. Safe but solid.`,
      ],
      failure: [
        `Be too conservative in negotiations - You play it so safe that no meaningful deals materialize. Missed opportunities.`,
        `Rush into a partnership - The deal looks good on paper but fails to deliver expected value.`,
      ],
      critical_failure: [
        `Sign a bad partnership deal - The partnership becomes a liability, draining resources and limiting your options.`,
        `Burn bridges with potential partners - Your aggressive tactics backfire, damaging your reputation in the industry.`,
      ],
    },
  };

  const categoryTemplates = templates[category] || templates['product'];
  const outcomeTemplates = categoryTemplates[outcomeType] || categoryTemplates['success'];
  return outcomeTemplates[Math.floor(Math.random() * outcomeTemplates.length)];
}

// Generate a single event with realistic choices
function generateRealisticEvent(category: string, eventId: string, eventName: string): any {
  return {
    eventId,
    category,
    name: eventName,
    description: `You face a critical decision about ${eventName.toLowerCase()}. Each choice has real consequences with trade-offs.`,
    choices: [
      {
        choiceId: `${eventId}_cs`,
        type: 'critical_success',
        text: generateRealisticChoiceText(category, eventName, 'critical_success'),
        effects: generateCriticalSuccess(balanceRanges),
      },
      {
        choiceId: `${eventId}_s`,
        type: 'success',
        text: generateRealisticChoiceText(category, eventName, 'success'),
        effects: generateSuccess(balanceRanges),
      },
      {
        choiceId: `${eventId}_f`,
        type: 'failure',
        text: generateRealisticChoiceText(category, eventName, 'failure'),
        effects: generateFailure(balanceRanges),
      },
      {
        choiceId: `${eventId}_cf`,
        type: 'critical_failure',
        text: generateRealisticChoiceText(category, eventName, 'critical_failure'),
        effects: generateCriticalFailure(balanceRanges),
      },
    ],
  };
}

// Read existing events.json and regenerate with realistic choices
function regenerateEventsWithRealisticChoices(): any[] {
  const eventsPath = join(__dirname, '../src/game/data/events.json');
  const existingEvents = JSON.parse(readFileSync(eventsPath, 'utf-8'));
  
  return existingEvents.map((event: any) => {
    return generateRealisticEvent(event.category, event.eventId, event.name);
  });
}

// Main execution
console.log('Generating realistic event choices...');
const events = regenerateEventsWithRealisticChoices();
writeFileSync(
  join(__dirname, '../src/game/data/events.json'),
  JSON.stringify(events, null, 2)
);
console.log(`✅ Regenerated ${events.length} events with realistic choices`);
