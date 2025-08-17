import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { VersionTree } from '@/lib/sync/versioning/VersionTree';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ typeKey: string }> }
) {
  try {
    const { typeKey } = await params;
    const versionTree = new VersionTree(prisma);
    const tree = await versionTree.buildTree(typeKey);
    
    if (!tree) {
      return NextResponse.json({
        success: true,
        typeKey,
        tree: null,
        visualization: 'No version history available'
      });
    }

    const visualization = versionTree.visualizeTree(tree);

    // Remove circular references by only returning essential tree data
    const treeData = tree ? {
      hash: tree.hash,
      typeKey: tree.typeKey,
      author: tree.author,
      createdAt: tree.createdAt,
      message: tree.message,
      childrenCount: tree.children.length
    } : null;

    return NextResponse.json({
      success: true,
      typeKey,
      treeData,
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