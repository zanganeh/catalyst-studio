import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { VersionDiff } from '@/lib/sync/versioning/VersionDiff';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest
) {
  try {
    const url = new URL(request.url);
    const hash1 = url.searchParams.get('hash1');
    const hash2 = url.searchParams.get('hash2');
    
    if (!hash1 || !hash2) {
      return NextResponse.json(
        {
          success: false,
          error: 'hash1 and hash2 parameters are required'
        },
        { status: 400 }
      );
    }

    const version1 = await prisma.contentTypeVersion.findUnique({
      where: { versionHash: hash1 }
    });

    const version2 = await prisma.contentTypeVersion.findUnique({
      where: { versionHash: hash2 }
    });

    if (!version1 || !version2) {
      return NextResponse.json(
        {
          success: false,
          error: 'One or both versions not found'
        },
        { status: 404 }
      );
    }

    const versionDiff = new VersionDiff();
    const diff = versionDiff.calculateDiff(
      version1.contentSnapshot,
      version2.contentSnapshot
    );
    
    const formatted = versionDiff.formatDiff(diff);

    return NextResponse.json({
      success: true,
      version1: {
        hash: version1.versionHash,
        author: version1.author,
        createdAt: version1.createdAt,
        message: version1.message
      },
      version2: {
        hash: version2.versionHash,
        author: version2.author,
        createdAt: version2.createdAt,
        message: version2.message
      },
      diff,
      formatted
    });
  } catch (error) {
    console.error('Error calculating version diff:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate version diff'
      },
      { status: 500 }
    );
  }
}