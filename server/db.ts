import { eq, and, desc, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  spreadsheets, 
  InsertSpreadsheet,
  spreadsheetCollaborators,
  InsertSpreadsheetCollaborator,
  spreadsheetHistory,
  InsertSpreadsheetHistory,
  userProgress,
  InsertUserProgress,
  activeSessions,
  InsertActiveSession,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { v4 as uuidv4 } from "uuid";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// Spreadsheet Functions
// ============================================================================

/**
 * Create a new spreadsheet
 */
export async function createSpreadsheet(data: Omit<InsertSpreadsheet, 'shareId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const shareId = uuidv4();
  const result = await db.insert(spreadsheets).values({
    ...data,
    shareId,
  });
  
  return { id: result[0].insertId, shareId };
}

/**
 * Get spreadsheet by ID
 */
export async function getSpreadsheetById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(spreadsheets).where(eq(spreadsheets.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Get spreadsheet by share ID
 */
export async function getSpreadsheetByShareId(shareId: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(spreadsheets).where(eq(spreadsheets.shareId, shareId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Get all spreadsheets for a user (owned + collaborated)
 */
export async function getUserSpreadsheets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get owned spreadsheets
  const owned = await db.select().from(spreadsheets)
    .where(eq(spreadsheets.userId, userId))
    .orderBy(desc(spreadsheets.updatedAt));
  
  // Get collaborated spreadsheets
  const collabs = await db.select()
    .from(spreadsheetCollaborators)
    .where(and(
      eq(spreadsheetCollaborators.userId, userId),
      eq(spreadsheetCollaborators.status, 'accepted')
    ));
  
  const collabIds = collabs.map(c => c.spreadsheetId);
  let collaborated: typeof owned = [];
  
  if (collabIds.length > 0) {
    // Fetch each collaborated spreadsheet
    for (const collabId of collabIds) {
      const sheet = await db.select().from(spreadsheets)
        .where(eq(spreadsheets.id, collabId))
        .limit(1);
      if (sheet.length > 0) {
        collaborated.push(sheet[0]);
      }
    }
  }
  
  return {
    owned,
    collaborated,
  };
}

/**
 * Update spreadsheet data
 */
export async function updateSpreadsheet(
  id: number, 
  userId: number,
  data: Partial<Pick<InsertSpreadsheet, 'name' | 'columns' | 'rows' | 'isPublic'>>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get current spreadsheet for history
  const current = await getSpreadsheetById(id);
  if (!current) throw new Error("Spreadsheet not found");
  
  // Increment version
  const newVersion = current.version + 1;
  
  // Save history
  await db.insert(spreadsheetHistory).values({
    spreadsheetId: id,
    userId,
    changeType: 'update',
    previousData: { columns: current.columns, rows: current.rows },
    newData: data,
    version: newVersion,
  });
  
  // Update spreadsheet
  await db.update(spreadsheets)
    .set({ ...data, version: newVersion })
    .where(eq(spreadsheets.id, id));
  
  return { version: newVersion };
}

/**
 * Delete spreadsheet
 */
export async function deleteSpreadsheet(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verify ownership
  const sheet = await getSpreadsheetById(id);
  if (!sheet || sheet.userId !== userId) {
    throw new Error("Not authorized to delete this spreadsheet");
  }
  
  // Delete related records
  await db.delete(spreadsheetCollaborators).where(eq(spreadsheetCollaborators.spreadsheetId, id));
  await db.delete(spreadsheetHistory).where(eq(spreadsheetHistory.spreadsheetId, id));
  await db.delete(activeSessions).where(eq(activeSessions.spreadsheetId, id));
  await db.delete(spreadsheets).where(eq(spreadsheets.id, id));
}

// ============================================================================
// Collaboration Functions
// ============================================================================

/**
 * Add collaborator to spreadsheet
 */
export async function addCollaborator(
  spreadsheetId: number, 
  userId: number, 
  role: 'viewer' | 'editor' | 'admin' = 'viewer'
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const inviteCode = uuidv4();
  
  await db.insert(spreadsheetCollaborators).values({
    spreadsheetId,
    userId,
    role,
    inviteCode,
    status: 'pending',
  });
  
  return { inviteCode };
}

/**
 * Accept collaboration invite
 */
export async function acceptInvite(inviteCode: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(spreadsheetCollaborators)
    .set({ status: 'accepted' })
    .where(and(
      eq(spreadsheetCollaborators.inviteCode, inviteCode),
      eq(spreadsheetCollaborators.userId, userId)
    ));
  
  return result;
}

/**
 * Get collaborators for a spreadsheet
 */
export async function getCollaborators(spreadsheetId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(spreadsheetCollaborators)
    .where(eq(spreadsheetCollaborators.spreadsheetId, spreadsheetId));
}

/**
 * Check if user can edit spreadsheet
 */
export async function canEditSpreadsheet(spreadsheetId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  // Check ownership
  const sheet = await getSpreadsheetById(spreadsheetId);
  if (sheet?.userId === userId) return true;
  
  // Check collaboration
  const collab = await db.select()
    .from(spreadsheetCollaborators)
    .where(and(
      eq(spreadsheetCollaborators.spreadsheetId, spreadsheetId),
      eq(spreadsheetCollaborators.userId, userId),
      eq(spreadsheetCollaborators.status, 'accepted')
    ))
    .limit(1);
  
  if (collab.length > 0) {
    return collab[0].role === 'editor' || collab[0].role === 'admin';
  }
  
  return false;
}

// ============================================================================
// Active Session Functions (for real-time collaboration)
// ============================================================================

/**
 * Register active editing session
 */
export async function registerSession(data: InsertActiveSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Remove any existing session for this user on this spreadsheet
  await db.delete(activeSessions).where(and(
    eq(activeSessions.spreadsheetId, data.spreadsheetId),
    eq(activeSessions.userId, data.userId)
  ));
  
  const result = await db.insert(activeSessions).values(data);
  return result[0].insertId;
}

/**
 * Update session heartbeat
 */
export async function updateSessionHeartbeat(sessionId: number, cursorPosition?: object) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(activeSessions)
    .set({ 
      lastHeartbeat: new Date(),
      ...(cursorPosition && { cursorPosition }),
    })
    .where(eq(activeSessions.id, sessionId));
}

/**
 * Get active sessions for a spreadsheet
 */
export async function getActiveSessions(spreadsheetId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Only return sessions with heartbeat in last 30 seconds
  const thirtySecondsAgo = new Date(Date.now() - 30000);
  
  return db.select()
    .from(activeSessions)
    .where(and(
      eq(activeSessions.spreadsheetId, spreadsheetId),
      gte(activeSessions.lastHeartbeat, thirtySecondsAgo)
    ));
}

/**
 * Remove session
 */
export async function removeSession(sessionId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(activeSessions).where(eq(activeSessions.id, sessionId));
}

// ============================================================================
// User Progress Functions
// ============================================================================

/**
 * Get or create user progress
 */
export async function getUserProgress(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(userProgress)
    .where(eq(userProgress.userId, userId))
    .limit(1);
  
  if (result.length > 0) {
    return result[0];
  }
  
  // Create new progress record
  await db.insert(userProgress).values({
    userId,
    tutorialProgress: {},
    completedTutorials: [],
    badges: [],
    quizData: {},
    streakData: { currentStreak: 0, longestStreak: 0, lastActivityDate: null },
    totalLearningTime: 0,
  });
  
  const newResult = await db.select().from(userProgress)
    .where(eq(userProgress.userId, userId))
    .limit(1);
  
  return newResult.length > 0 ? newResult[0] : null;
}

/**
 * Update user progress
 */
export async function updateUserProgress(
  userId: number,
  data: Partial<Pick<InsertUserProgress, 
    'tutorialProgress' | 'completedTutorials' | 'badges' | 'quizData' | 'streakData' | 'totalLearningTime'
  >>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Ensure progress record exists
  await getUserProgress(userId);
  
  await db.update(userProgress)
    .set({ ...data, lastSyncedAt: new Date() })
    .where(eq(userProgress.userId, userId));
}

/**
 * Sync progress from device (merge with server data)
 */
export async function syncUserProgress(
  userId: number,
  deviceProgress: {
    tutorialProgress?: object;
    completedTutorials?: string[];
    badges?: string[];
    quizData?: object;
    streakData?: object;
    totalLearningTime?: number;
  },
  deviceLastSync: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const serverProgress = await getUserProgress(userId);
  if (!serverProgress) throw new Error("Could not get user progress");
  
  // Simple merge strategy: take the most recent data
  // For arrays (completedTutorials, badges), merge unique values
  const mergedProgress: Partial<InsertUserProgress> = {};
  
  // Merge completed tutorials (union of both)
  const serverTutorials = (serverProgress.completedTutorials as string[]) || [];
  const deviceTutorials = deviceProgress.completedTutorials || [];
  mergedProgress.completedTutorials = [...new Set([...serverTutorials, ...deviceTutorials])];
  
  // Merge badges (union of both)
  const serverBadges = (serverProgress.badges as string[]) || [];
  const deviceBadges = deviceProgress.badges || [];
  mergedProgress.badges = [...new Set([...serverBadges, ...deviceBadges])];
  
  // Take higher learning time
  mergedProgress.totalLearningTime = Math.max(
    serverProgress.totalLearningTime || 0,
    deviceProgress.totalLearningTime || 0
  );
  
  // For objects, prefer device data if it's newer
  if (deviceLastSync > serverProgress.lastSyncedAt) {
    if (deviceProgress.tutorialProgress) {
      mergedProgress.tutorialProgress = deviceProgress.tutorialProgress;
    }
    if (deviceProgress.quizData) {
      mergedProgress.quizData = deviceProgress.quizData;
    }
    if (deviceProgress.streakData) {
      mergedProgress.streakData = deviceProgress.streakData;
    }
  }
  
  await updateUserProgress(userId, mergedProgress);
  
  return getUserProgress(userId);
}
