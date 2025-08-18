import { NextRequest, NextResponse } from 'next/server';

export interface VersionHistoryItem {
  id: string;
  contentTypeId: string;
  version: string;
  hash: string;
  parentHash?: string;
  createdAt: string;
  changeSource: 'UI' | 'API' | 'SYNC';
  author: string;
  changes: {
    added: number;
    modified: number;
    removed: number;
  };
  description?: string;
}

const mockHistory: VersionHistoryItem[] = [
  {
    id: 'version-123',
    contentTypeId: 'ct-456',
    version: '2.1.0',
    hash: 'abc123def456',
    parentHash: 'xyz789uvw012',
    createdAt: '2025-01-18T09:00:00Z',
    changeSource: 'UI',
    author: 'user@example.com',
    changes: { added: 2, modified: 3, removed: 1 }
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentTypeId = searchParams.get('contentTypeId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let filtered = [...mockHistory];
    
    if (contentTypeId) {
      filtered = filtered.filter(item => item.contentTypeId === contentTypeId);
    }

    const paginated = filtered.slice(offset, offset + limit);
    
    return NextResponse.json({
      items: paginated,
      total: filtered.length,
      limit,
      offset
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve version history', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.contentTypeId || !body.version || !body.hash) {
      return NextResponse.json(
        { error: 'Invalid version history data' },
        { status: 400 }
      );
    }

    const newVersion: VersionHistoryItem = {
      id: `version-${Date.now()}`,
      contentTypeId: body.contentTypeId,
      version: body.version,
      hash: body.hash,
      parentHash: body.parentHash,
      createdAt: new Date().toISOString(),
      changeSource: body.changeSource || 'SYNC',
      author: body.author || 'system',
      changes: body.changes || { added: 0, modified: 0, removed: 0 },
      description: body.description
    };

    mockHistory.unshift(newVersion);
    
    return NextResponse.json(newVersion, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create version history entry', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}