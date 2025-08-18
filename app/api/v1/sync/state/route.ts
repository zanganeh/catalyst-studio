import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { SyncStateManager } from '@/lib/sync/state/SyncStateManager';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const typeKey = searchParams.get('typeKey');
    const since = searchParams.get('since');
    const status = searchParams.get('status');
    
    const manager = new SyncStateManager(prisma);
    
    // Get specific sync state
    if (typeKey) {
      const state = await manager.getSyncState(typeKey);
      
      if (!state) {
        return NextResponse.json(
          { error: 'Sync state not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ state });
    }
    
    // Get types updated since timestamp
    if (since) {
      const timestamp = new Date(since);
      if (isNaN(timestamp.getTime())) {
        return NextResponse.json(
          { error: 'Invalid timestamp format' },
          { status: 400 }
        );
      }
      
      const types = await manager.getContentTypesSince(timestamp);
      return NextResponse.json({ types });
    }
    
    // Get types by status
    if (status) {
      let types: string[] = [];
      
      switch (status) {
        case 'interrupted':
          types = await manager.detectInterruptedSync();
          break;
        case 'conflicted':
          types = await manager.getConflictedTypes();
          break;
        case 'pending':
          types = await manager.getPendingSyncTypes();
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid status filter. Use: interrupted, conflicted, or pending' },
            { status: 400 }
          );
      }
      
      return NextResponse.json({ types });
    }
    
    // Get all sync states
    const states = await manager.getAllSyncStates();
    return NextResponse.json({ states });
    
  } catch (error) {
    console.error('Error fetching sync state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync state' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { typeKey, state, action } = body;
    
    if (!typeKey) {
      return NextResponse.json(
        { error: 'typeKey is required' },
        { status: 400 }
      );
    }
    
    const manager = new SyncStateManager(prisma);
    
    // Handle specific actions
    if (action) {
      switch (action) {
        case 'markAsSynced':
          if (!state?.localHash || !state?.remoteHash) {
            return NextResponse.json(
              { error: 'localHash and remoteHash required for markAsSynced' },
              { status: 400 }
            );
          }
          await manager.markAsSynced(typeKey, state.localHash, state.remoteHash);
          break;
          
        case 'markAsConflicted':
          if (!state?.localHash || !state?.remoteHash) {
            return NextResponse.json(
              { error: 'localHash and remoteHash required for markAsConflicted' },
              { status: 400 }
            );
          }
          await manager.markAsConflicted(typeKey, state.localHash, state.remoteHash);
          break;
          
        case 'resolveConflict':
          if (!state?.resolvedHash) {
            return NextResponse.json(
              { error: 'resolvedHash required for resolveConflict' },
              { status: 400 }
            );
          }
          await manager.resolveConflict(typeKey, state.resolvedHash);
          break;
          
        case 'rollback':
          await manager.rollbackPartialSync(typeKey);
          break;
          
        case 'setSyncProgress':
          if (!state?.progress) {
            return NextResponse.json(
              { error: 'progress object required for setSyncProgress' },
              { status: 400 }
            );
          }
          await manager.setSyncProgress(typeKey, state.progress);
          break;
          
        default:
          return NextResponse.json(
            { error: `Unknown action: ${action}` },
            { status: 400 }
          );
      }
    } else {
      // General state update
      if (!state) {
        return NextResponse.json(
          { error: 'state object is required' },
          { status: 400 }
        );
      }
      await manager.updateSyncState(typeKey, state);
    }
    
    // Return updated state
    const updatedState = await manager.getSyncState(typeKey);
    return NextResponse.json({ 
      success: true, 
      state: updatedState 
    });
    
  } catch (error) {
    console.error('Error updating sync state:', error);
    return NextResponse.json(
      { error: 'Failed to update sync state' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const typeKey = searchParams.get('typeKey');
    const resetAll = searchParams.get('resetAll');
    
    const manager = new SyncStateManager(prisma);
    
    if (resetAll === 'true') {
      await manager.resetAllSyncStates();
      return NextResponse.json({ 
        success: true, 
        message: 'All sync states reset' 
      });
    }
    
    if (!typeKey) {
      return NextResponse.json(
        { error: 'typeKey is required' },
        { status: 400 }
      );
    }
    
    await manager.clearSyncState(typeKey);
    return NextResponse.json({ 
      success: true, 
      message: `Sync state cleared for ${typeKey}` 
    });
    
  } catch (error) {
    console.error('Error deleting sync state:', error);
    return NextResponse.json(
      { error: 'Failed to delete sync state' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { typeKey, currentLocalHash, currentRemoteHash } = body;
    
    if (!typeKey || !currentLocalHash || !currentRemoteHash) {
      return NextResponse.json(
        { error: 'typeKey, currentLocalHash, and currentRemoteHash are required' },
        { status: 400 }
      );
    }
    
    const manager = new SyncStateManager(prisma);
    
    // Calculate sync delta
    const delta = await manager.calculateDelta(typeKey, currentLocalHash, currentRemoteHash);
    
    // Get current state for additional info
    const currentState = await manager.getSyncState(typeKey);
    
    return NextResponse.json({ 
      delta,
      currentState,
      recommendation: getSyncRecommendation(delta.action)
    });
    
  } catch (error) {
    console.error('Error calculating sync delta:', error);
    return NextResponse.json(
      { error: 'Failed to calculate sync delta' },
      { status: 500 }
    );
  }
}

function getSyncRecommendation(action: string): string {
  switch (action) {
    case 'INITIAL_SYNC':
      return 'Perform initial synchronization of this content type';
    case 'PUSH':
      return 'Push local changes to remote system';
    case 'PULL':
      return 'Pull remote changes to local system';
    case 'CONFLICT':
      return 'Conflict detected - manual resolution required';
    case 'NO_CHANGE':
      return 'Content is already synchronized';
    default:
      return 'Unknown action';
  }
}