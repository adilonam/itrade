import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * @swagger
 * /api/admin/create-superadmin:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Create a superadmin user
 *     description: Creates a new superadmin user. Requires a valid NEXTAUTH_SECRET for authentication.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - nextauthSecret
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the superadmin user
 *                 example: "Super Admin"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address for the superadmin user
 *                 example: "admin@company.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Password for the superadmin user (minimum 8 characters)
 *                 example: "SecurePassword123!"
 *               nextauthSecret:
 *                 type: string
 *                 description: Secret key required for superadmin creation
 *                 example: "your-nextauth-secret-key"
 *     responses:
 *       201:
 *         description: Superadmin user created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Superadmin created successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "clxxxxx"
 *                     name:
 *                       type: string
 *                       example: "Super Admin"
 *                     email:
 *                       type: string
 *                       example: "admin@company.com"
 *                     role:
 *                       type: string
 *                       example: "SUPERADMIN"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   examples:
 *                     missing_fields: "Name, email, password, and nextauthSecret are required"
 *                     user_exists: "User already exists with this email"
 *                     weak_password: "Password must be at least 8 characters long"
 *       401:
 *         description: Unauthorized - invalid superadmin key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid superadmin key"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

// Validation schema
const createSuperadminSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  nextauthSecret: z.string().min(1, 'NextAuth secret is required')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = createSuperadminSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { name, email, password, nextauthSecret } = validationResult.data;

    // Verify superadmin key
    if (!process.env.NEXTAUTH_SECRET) {
      return NextResponse.json(
        { error: 'Superadmin key not configured on server' },
        { status: 500 }
      );
    }

    if (nextauthSecret !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json(
        { error: 'Invalid superadmin key' },
        { status: 401 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create superadmin user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'SUPERADMIN' // Set role to SUPERADMIN
      }
    });

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        message: 'Superadmin created successfully',
        user: userWithoutPassword
      },
      { status: 201 }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Superadmin creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
