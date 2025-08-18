import { NextRequest, NextResponse } from 'next/server';

export interface SyncConflict {
  id: string;
  contentTypeId: string;
  baseVersion: string;
  sourceChanges: any;
  targetChanges: any;
  conflictType: 'field_type_mismatch' | 'field_deletion' | 'schema_incompatible' | 'validation_failure';
  severity: 'high' | 'medium' | 'low';
  resolutionStrategy?: 'manual' | 'auto-merge' | 'prefer-source' | 'prefer-target';
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: any;
}

const mockConflicts: SyncConflict[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let filtered = [...mockConflicts];
    
    if (status === 'unresolved') {
      filtered = filtered.filter(c => !c.resolvedAt);
    } else if (status === 'resolved') {
      filtered = filtered.filter(c => c.resolvedAt);
    }
    
    return NextResponse.json({
      conflicts: filtered,
      total: filtered.length,
      unresolved: filtered.filter(c => !c.resolvedAt).length,
      resolved: filtered.filter(c => c.resolvedAt).length
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve conflicts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.contentTypeId || !body.conflictType) {
      return NextResponse.json(
        { error: 'Invalid conflict data' },
        { status: 400 }
      );
    }

    const newConflict: SyncConflict = {
      id: `conflict-${Date.now()}`,
      contentTypeId: body.contentTypeId,
      baseVersion: body.baseVersion || '1.0.0',
      sourceChanges: body.sourceChanges,
      targetChanges: body.targetChanges,
      conflictType: body.conflictType,
      severity: body.severity || 'medium',
      resolutionStrategy: body.resolutionStrategy
    };

    mockConflicts.push(newConflict);
    
    return NextResponse.json(newConflict, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Sync conflict detected, manual resolution required', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 409 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conflictId = searchParams.get('id');
    const body = await request.json();
    
    if (!conflictId) {
      return NextResponse.json(
        { error: 'Conflict ID required' },
        { status: 400 }
      );
    }

    const conflictIndex = mockConflicts.findIndex(c => c.id === conflictId);
    
    if (conflictIndex === -1) {
      return NextResponse.json(
        { error: 'Sync record not found' },
        { status: 404 }
      );
    }

    mockConflicts[conflictIndex] = {
      ...mockConflicts[conflictIndex],
      resolutionStrategy: body.resolutionStrategy,
      resolution: body.resolution,
      resolvedAt: new Date().toISOString(),
      resolvedBy: body.resolvedBy || 'user'
    };

    return NextResponse.json(mockConflicts[conflictIndex], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to resolve conflict', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}