import { PrismaClient } from '@/lib/generated/prisma';

export interface TreeNode {
  hash: string;
  typeKey: string;
  author: string | null;
  createdAt: Date;
  message: string | null;
  parents: TreeNode[];
  children: TreeNode[];
}

export class VersionTree {
  constructor(private prisma: PrismaClient) {}

  async buildTree(typeKey: string): Promise<TreeNode | null> {
    const versions = await this.prisma.contentTypeVersion.findMany({
      where: { typeKey },
      include: {
        parentVersions: true,
        childVersions: true
      },
      orderBy: { createdAt: 'asc' }
    });

    if (versions.length === 0) {
      return null;
    }

    const nodeMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    for (const version of versions) {
      const node: TreeNode = {
        hash: version.versionHash,
        typeKey: version.typeKey,
        author: version.author,
        createdAt: version.createdAt,
        message: version.message,
        parents: [],
        children: []
      };
      nodeMap.set(version.versionHash, node);
    }

    for (const version of versions) {
      const node = nodeMap.get(version.versionHash)!;
      
      if (version.parentVersions.length === 0 && !version.parentHash) {
        rootNodes.push(node);
      } else {
        const parentHashes = version.parentVersions.length > 0
          ? version.parentVersions.sort((a, b) => a.parentOrder - b.parentOrder).map(p => p.parentHash)
          : version.parentHash ? [version.parentHash] : [];

        for (const parentHash of parentHashes) {
          const parentNode = nodeMap.get(parentHash);
          if (parentNode) {
            node.parents.push(parentNode);
            parentNode.children.push(node);
          }
        }
      }
    }

    return rootNodes.length > 0 ? rootNodes[0] : null;
  }

  async findCommonAncestor(hash1: string, hash2: string): Promise<string | null> {
    const ancestors1 = new Set<string>();
    const ancestors2 = new Set<string>();

    const traverseAncestors = async (hash: string, ancestorSet: Set<string>) => {
      const queue = [hash];
      
      while (queue.length > 0) {
        const currentHash = queue.shift()!;
        
        if (ancestorSet.has(currentHash)) {
          continue;
        }
        
        ancestorSet.add(currentHash);
        
        const version = await this.prisma.contentTypeVersion.findUnique({
          where: { versionHash: currentHash },
          include: { parentVersions: true }
        });
        
        if (version) {
          if (version.parentVersions.length > 0) {
            queue.push(...version.parentVersions.map(p => p.parentHash));
          } else if (version.parentHash) {
            queue.push(version.parentHash);
          }
        }
      }
    };

    await traverseAncestors(hash1, ancestors1);

    const queue = [hash2];
    while (queue.length > 0) {
      const currentHash = queue.shift()!;
      
      if (ancestors1.has(currentHash)) {
        return currentHash;
      }
      
      if (ancestors2.has(currentHash)) {
        continue;
      }
      
      ancestors2.add(currentHash);
      
      const version = await this.prisma.contentTypeVersion.findUnique({
        where: { versionHash: currentHash },
        include: { parentVersions: true }
      });
      
      if (version) {
        if (version.parentVersions.length > 0) {
          queue.push(...version.parentVersions.map(p => p.parentHash));
        } else if (version.parentHash) {
          queue.push(version.parentHash);
        }
      }
    }

    return null;
  }

  async getLineage(hash: string): Promise<string[]> {
    const lineage: string[] = [];
    let currentHash: string | null = hash;

    while (currentHash) {
      lineage.push(currentHash);
      
      const version = await this.prisma.contentTypeVersion.findUnique({
        where: { versionHash: currentHash },
        include: { parentVersions: true }
      });
      
      if (!version) {
        break;
      }
      
      if (version.parentVersions.length > 0) {
        currentHash = version.parentVersions.find(p => p.parentOrder === 0)?.parentHash || null;
      } else {
        currentHash = version.parentHash;
      }
    }

    return lineage;
  }

  visualizeTree(tree: TreeNode | null, indent: string = '', isLast: boolean = true): string {
    if (!tree) {
      return 'No version history';
    }

    let result = '';
    const connector = isLast ? '└── ' : '├── ';
    const continuation = isLast ? '    ' : '│   ';
    
    result += indent + connector + `${tree.hash.substring(0, 8)} (${tree.author || 'unknown'})`;
    if (tree.message) {
      result += ` - ${tree.message}`;
    }
    result += '\n';
    
    const newIndent = indent + continuation;
    
    for (let i = 0; i < tree.children.length; i++) {
      const child = tree.children[i];
      const isLastChild = i === tree.children.length - 1;
      result += this.visualizeTree(child, newIndent, isLastChild);
    }
    
    return result;
  }
}