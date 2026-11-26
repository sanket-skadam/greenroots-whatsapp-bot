export {
  getOrCreateUser,
  saveUser,
  type ChatTurn,
  type DraftListing,
  type StateStep,
  type UserRecord,
  type UserRole,
} from './db/database.js';
export type { LangCode as UserLanguage } from './data/catalog.js';

import { saveUser, type ChatTurn, type UserRecord } from './db/database.js';

export function appendHistory(user: UserRecord, role: ChatTurn['role'], text: string): void {
  user.history.push({ role, text });
  if (user.history.length > 10) {
    user.history.splice(0, user.history.length - 10);
  }
  saveUser(user);
}

export function clearDrafts(user: UserRecord): void {
  user.draftListing = null;
  user.selectedListingId = null;
  user.selectedQuantityTons = null;
  saveUser(user);
}
