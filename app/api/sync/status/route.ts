import { NextRequest, NextResponse } from 'next/server';

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

let currentSyncStatus: SyncStatus = {
  status: 'idle',
  progress: 0,
  currentStep: '',
  totalSteps: 0,
  errors: []
};

export async function GET(request: NextRequest) {
  try {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
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

    currentSyncStatus = {
      ...currentSyncStatus,
      ...body,
      startedAt: body.status === 'in_progress' ? new Date().toISOString() : currentSyncStatus.startedAt,
      completedAt: body.status === 'completed' || body.status === 'failed' ? new Date().toISOString() : undefined
    };

    return NextResponse.json(currentSyncStatus, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Sync engine error, check logs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}