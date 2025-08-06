import { NextResponse } from 'next/server';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const mockUsers: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', createdAt: '2024-01-01' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user', createdAt: '2024-01-02' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'user', createdAt: '2024-01-03' },
];

export async function GET() {
  try {
    return NextResponse.json({ users: mockUsers, total: mockUsers.length });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, role } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const newUser: User = {
      id: mockUsers.length + 1,
      name,
      email,
      role: role || 'user',
      createdAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}