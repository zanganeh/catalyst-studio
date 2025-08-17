import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { VersionTree } from '@/lib/sync/versioning/VersionTree';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { typeKey: string } }
) {
  try {
    const versionTree = new VersionTree(prisma);
    const tree = await versionTree.buildTree(params.typeKey);
    
    if (!tree) {
      return NextResponse.json({
        success: true,
        typeKey: params.typeKey,
        tree: null,
        visualization: 'No version history available'
      });
    }

    const visualization = versionTree.visualizeTree(tree);

    return NextResponse.json({
      success: true,
      typeKey: params.typeKey,
      tree,
      visualization
    });
  } catch (error) {
    console.error('Error building version tree:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to build version tree'
      },
      { status: 500 }
    );
  }
}