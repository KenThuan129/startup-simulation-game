import { EventData, OutcomeType } from '../types';
import { PendingEvent, EventChoice } from '../../db/types';
import { EventDataLoader } from '../data/event-loader';

export class EventEngine {
  static async generateEventsFromAction(
    actionId: string,
    eventPool: string[],
    count: number = 1
  ): Promise<PendingEvent[]> {
    const events: PendingEvent[] = [];
    const shuffledPool = [...eventPool].sort(() => Math.random() - 0.5);
    const selectedEventIds = shuffledPool.slice(0, Math.min(count, eventPool.length));

    for (const eventId of selectedEventIds) {
      const eventData = await EventDataLoader.getEvent(eventId);
      if (!eventData) continue;

      // Shuffle choices and assign neutral labels (Option A, B, C, D)
      const shuffledChoices = [...eventData.choices].sort(() => Math.random() - 0.5);
      const labels = ['Option A', 'Option B', 'Option C', 'Option D'];
      
      const choices: EventChoice[] = shuffledChoices.map((choice, index) => ({
        choiceId: choice.choiceId,
        label: labels[index] || `Option ${String.fromCharCode(65 + index)}`, // A, B, C, D
        type: choice.type,
        text: choice.text,
        effects: choice.effects,
        revealed: false, // Hidden until player chooses
      }));

      events.push({
        eventId: eventData.eventId,
        actionId,
        choices,
        selectedChoiceId: null,
      });
    }

    return events;
  }

  static selectChoice(event: PendingEvent, choiceId: string): EventChoice | null {
    return event.choices.find(c => c.choiceId === choiceId) || null;
  }

  static getOutcomeType(choice: EventChoice): OutcomeType {
    return choice.type;
  }
}

