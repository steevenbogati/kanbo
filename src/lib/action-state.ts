/** Shared shape returned by every server action, so forms handle it the same way. */
export type ActionState = { ok: boolean; error: string | null };

export const idleState: ActionState = { ok: false, error: null };
