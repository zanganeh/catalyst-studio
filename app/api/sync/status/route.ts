import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface SyncStatus {
  status: 'in_progress' | 'completed' | 'failed' | 'pending' | 'idle';
  progress: number;
  currentStep: string;
  totalSteps: number;
  startedAt?: string;
  completedAt?: string;
  estimatedCompletion?: string;
  errors: Array<{
    code: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    timestamp: string;
  }>;
  validationResults?: {
    passed: boolean;
    errors: number;
    warnings: number;
    details: Array<{
      field: string;
      message: string;
      severity: 'error' | 'warning';
    }>;
  };
}

// Use data directory for persistent storage (works on all platforms)
const SYNC_STATUS_FILE = path.join(process.cwd(), 'data', 'sync-status.json');
const SYNC_STATUS_DIR = path.dirname(SYNC_STATUS_FILE);

// Ensure data directory exists
if (!fs.existsSync(SYNC_STATUS_DIR)) {
  fs.mkdirSync(SYNC_STATUS_DIR, { recursive: true });
}

// Load sync status from file or create default
function loadSyncStatus(): SyncStatus {
  try {
    if (fs.existsSync(SYNC_STATUS_FILE)) {
      const data = fs.readFileSync(SYNC_STATUS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading sync status:', error);
  }
  
  return {
    status: 'idle',
    progress: 0,
    currentStep: '',
    totalSteps: 0,
    errors: []
  };
}

// Save sync status to file
function saveSyncStatus(status: SyncStatus): void {
  try {
    fs.writeFileSync(SYNC_STATUS_FILE, JSON.stringify(status, null, 2));
  } catch (error) {
    console.error('Error saving sync status:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    const currentSyncStatus = loadSyncStatus();
    
    return NextResponse.json(currentSyncStatus, { 
      status: 200,
      headers 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve sync status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.status) {
      return NextResponse.json(
        { error: 'Invalid sync configuration' },
        { status: 400 }
      );
    }

    const currentSyncStatus = loadSyncStatus();
    const updatedStatus = {
      ...currentSyncStatus,
      ...body,
      startedAt: body.status === 'in_progress' ? new Date().toISOString() : currentSyncStatus.startedAt,
      completedAt: body.status === 'completed' || body.status === 'failed' ? new Date().toISOString() : undefined
    };
    
    saveSyncStatus(updatedStatus);

    return NextResponse.json(updatedStatus, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Sync engine error, check logs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}