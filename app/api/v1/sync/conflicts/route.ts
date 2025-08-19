/**
 * Conflict Resolution API Endpoints
 * Provides endpoints for conflict detection and resolution
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ConflictDetector } from '@/lib/sync/conflict/ConflictDetector';
import { ConflictManager } from '@/lib/sync/conflict/ConflictManager';
import { ResolutionStrategyManager } from '@/lib/sync/conflict/ResolutionStrategy';
import { ChangeDetector } from '@/lib/sync/detection/ChangeDetector';
import { VersionHistoryManager } from '@/lib/sync/versioning/VersionHistoryManager';

/**
 * GET /api/v1/sync/conflicts
 * Get list of conflicts or specific conflict details
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conflictId = searchParams.get('id');
    const typeKey = searchParams.get('typeKey');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // If specific conflict ID requested
    if (conflictId) {
      const conflict = await prisma.conflictLog.findUnique({
        where: { id: conflictId }
      });

      if (!conflict) {
        return NextResponse.json(
          { error: 'Conflict not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        conflict: {
          id: conflict.id,
          typeKey: conflict.typeKey,
          type: conflict.conflictType,
          localHash: conflict.localHash,
          remoteHash: conflict.remoteHash,
          ancestorHash: conflict.ancestorHash,
          details: conflict.conflictDetails,
          resolution: conflict.resolution,
          resolvedBy: conflict.resolvedBy,
          resolvedAt: conflict.resolvedAt,
          createdAt: conflict.createdAt
        }
      });
    }

    // Build query filters
    const where: any = {};
    if (typeKey) where.typeKey = typeKey;
    if (status) {
      if (status === 'pending') {
        where.resolution = null;
      } else if (status === 'resolved') {
        where.resolution = { not: null };
      }
    }

    // Get conflicts from database
    const [conflicts, total] = await Promise.all([
      prisma.conflictLog.findMany({
        where,
        orderBy: [
          { createdAt: 'desc' }
        ],
        skip: offset,
        take: limit
      }),
      prisma.conflictLog.count({ where })
    ]);

    // Format response
    const formattedConflicts = conflicts.map(c => ({
      id: c.id,
      typeKey: c.typeKey,
      type: c.conflictType,
      status: c.resolution ? 'resolved' : 'pending',
      localHash: c.localHash,
      remoteHash: c.remoteHash,
      ancestorHash: c.ancestorHash,
      details: c.conflictDetails,
      resolution: c.resolution,
      resolvedBy: c.resolvedBy,
      resolvedAt: c.resolvedAt,
      createdAt: c.createdAt
    }));

    return NextResponse.json({
      conflicts: formattedConflicts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching conflicts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conflicts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/sync/conflicts
 * Detect conflicts or resolve existing conflicts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, typeKey, conflictId, resolution, resolvedBy } = body;

    // Handle conflict detection
    if (action === 'detect') {
      if (!typeKey) {
        return NextResponse.json(
          { error: 'typeKey is required for conflict detection' },
          { status: 400 }
        );
      }

      // Initialize services
      const changeDetector = new ChangeDetector(prisma);
      const versionHistory = new VersionHistoryManager(prisma);
      const conflictDetector = new ConflictDetector(changeDetector, versionHistory);

      // Detect conflicts for the type
      const conflictResult = await conflictDetector.detectConflicts(typeKey);

      if (conflictResult.hasConflict) {
        // Store conflict in database
        const conflictManager = new ConflictManager(prisma);
        const flaggedConflict = await conflictManager.flagForReview(typeKey, conflictResult);

        // Update sync state
        await prisma.syncState.update({
          where: { typeKey },
          data: {
            conflictStatus: 'detected',
            lastConflictAt: new Date()
          }
        });

        return NextResponse.json({
          hasConflict: true,
          conflict: {
            id: flaggedConflict.id,
            typeKey: flaggedConflict.typeKey,
            type: conflictResult.type,
            details: conflictResult.details,
            localVersion: conflictResult.localVersion,
            remoteVersion: conflictResult.remoteVersion,
            ancestorVersion: conflictResult.ancestorVersion
          }
        });
      }

      return NextResponse.json({
        hasConflict: false,
        typeKey
      });
    }

    // Handle conflict resolution
    if (action === 'resolve') {
      if (!conflictId || !resolution) {
        return NextResponse.json(
          { error: 'conflictId and resolution are required' },
          { status: 400 }
        );
      }

      // Get conflict from database
      const conflict = await prisma.conflictLog.findUnique({
        where: { id: conflictId }
      });

      if (!conflict) {
        return NextResponse.json(
          { error: 'Conflict not found' },
          { status: 404 }
        );
      }

      if (conflict.resolution) {
        return NextResponse.json(
          { error: 'Conflict already resolved' },
          { status: 400 }
        );
      }

      // Apply resolution strategy
      const strategyManager = new ResolutionStrategyManager();
      const resolutionResult = strategyManager.resolveConflict(
        {
          type: conflict.conflictType,
          details: conflict.conflictDetails as any,
          localVersion: { hash: conflict.localHash },
          remoteVersion: { hash: conflict.remoteHash },
          ancestorVersion: { hash: conflict.ancestorHash }
        },
        resolution
      );

      if (!resolutionResult.success) {
        return NextResponse.json({
          success: false,
          error: resolutionResult.error,
          requiresManual: resolutionResult.requiresManual
        });
      }

      // Update conflict in database
      await prisma.conflictLog.update({
        where: { id: conflictId },
        data: {
          resolution,
          resolvedBy: resolvedBy || 'system',
          resolvedAt: new Date()
        }
      });

      // Update sync state
      await prisma.syncState.update({
        where: { typeKey: conflict.typeKey },
        data: {
          conflictStatus: 'resolved'
        }
      });

      return NextResponse.json({
        success: true,
        conflictId,
        resolution: resolutionResult.resolution,
        resolvedAt: new Date().toISOString()
      });
    }

    // Handle batch conflict detection
    if (action === 'detect-all') {
      const changeDetector = new ChangeDetector(prisma);
      const versionHistory = new VersionHistoryManager(prisma);
      const conflictDetector = new ConflictDetector(changeDetector, versionHistory);

      const allConflicts = await conflictDetector.detectAllConflicts();
      
      if (allConflicts.length > 0) {
        const conflictManager = new ConflictManager(prisma);
        
        // Flag all conflicts for review
        const flaggedConflicts = await Promise.all(
          allConflicts.map(c => conflictManager.flagForReview(c.typeKey, c))
        );

        // Update sync states
        await Promise.all(
          allConflicts.map(c => 
            prisma.syncState.update({
              where: { typeKey: c.typeKey },
              data: {
                conflictStatus: 'detected',
                lastConflictAt: new Date()
              }
            })
          )
        );

        return NextResponse.json({
          totalConflicts: allConflicts.length,
          conflicts: flaggedConflicts.map(f => ({
            id: f.id,
            typeKey: f.typeKey,
            type: f.conflictType,
            priority: f.priority
          }))
        });
      }

      return NextResponse.json({
        totalConflicts: 0,
        conflicts: []
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "detect", "resolve", or "detect-all"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing conflict request:', error);
    return NextResponse.json(
      { error: 'Failed to process conflict request' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/sync/conflicts/:id
 * Clear resolved conflicts
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conflictId = searchParams.get('id');
    const clearResolved = searchParams.get('clearResolved') === 'true';
    const olderThanDays = parseInt(searchParams.get('olderThanDays') || '7');

    // Clear specific conflict
    if (conflictId) {
      const conflict = await prisma.conflictLog.findUnique({
        where: { id: conflictId }
      });

      if (!conflict) {
        return NextResponse.json(
          { error: 'Conflict not found' },
          { status: 404 }
        );
      }

      await prisma.conflictLog.delete({
        where: { id: conflictId }
      });

      return NextResponse.json({
        success: true,
        deletedConflictId: conflictId
      });
    }

    // Clear old resolved conflicts
    if (clearResolved) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const deleted = await prisma.conflictLog.deleteMany({
        where: {
          resolution: { not: null },
          resolvedAt: { lt: cutoffDate }
        }
      });

      return NextResponse.json({
        success: true,
        deletedCount: deleted.count,
        cutoffDate: cutoffDate.toISOString()
      });
    }

    return NextResponse.json(
      { error: 'Specify either "id" or "clearResolved=true"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error deleting conflicts:', error);
    return NextResponse.json(
      { error: 'Failed to delete conflicts' },
      { status: 500 }
    );
  }
}