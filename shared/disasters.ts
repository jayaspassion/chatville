import type {DisasterKind} from './state';
export interface DisasterDefinition {
  kind: DisasterKind; startCommand: string; defendCommand: string;
  title: string; instruction: string; pattern: {afterMs:number; damage:number}[];
}
export const DISASTERS: Record<DisasterKind,DisasterDefinition> = {
  meteor: {kind:'meteor',startCommand:'!meteor',defendCommand:'!shield',title:'METEOR INCOMING',instruction:'type !shield to protect your house!',pattern:[{afterMs:30000,damage:1}]},
  acidrain: {kind:'acidrain',startCommand:'!acidrain',defendCommand:'!umbrella',title:'ACID RAIN',instruction:'type !umbrella to cover your house!',pattern:[{afterMs:15000,damage:1},{afterMs:30000,damage:1}]},
  tornado: {kind:'tornado',startCommand:'!tornado',defendCommand:'!anchor',title:'TORNADO',instruction:'type !anchor!',pattern:[{afterMs:30000,damage:2}]}
};
export const DISASTER_KINDS = Object.keys(DISASTERS) as DisasterKind[];
