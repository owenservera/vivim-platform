import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import { UserPayload } from '../middleware/auth';

const prisma = new PrismaClient();

export const roadmapRoutes = new Hono();

// List roadmaps
roadmapRoutes.get('/', async (c) => {
  const user = c.get('user') as UserPayload;
  
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || '20');
  const search = c.req.query('search');
  const archived = c.req.query('archived') === 'true';
  const sort = c.req.query('sort') || 'updatedAt';
  const order = c.req.query('order') || 'desc';

  const skip = (page - 1) * pageSize;

  const where: any = {
    ownerId: user.id,
    deletedAt: null,
  };

  if (!archived) {
    where.isArchived = false;
  }

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const [roadmaps, total] = await Promise.all([
    prisma.roadmap.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sort]: order },
      include: {
        workstreams: {
          select: {
            id: true,
            name: true,
            color: true,
            progress: true,
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.roadmap.count({ where }),
  ]);

  return c.json({
    data: roadmaps.map(serializeRoadmap),
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNext: page * pageSize < total,
      hasPrev: page > 1,
    },
  });
});

// Get single roadmap
roadmapRoutes.get('/:id', async (c) => {
  const user = c.get('user') as UserPayload;
  const id = c.req.param('id');

  const roadmap = await prisma.roadmap.findFirst({
    where: {
      id,
      ownerId: user.id,
      deletedAt: null,
    },
    include: {
      workstreams: {
        orderBy: { order: 'asc' },
        include: {
          features: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              progress: true,
              positionX: true,
              positionY: true,
            },
          },
        },
      },
      views: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!roadmap) {
    throw new AppError('NOT_FOUND', 'Roadmap not found', 404);
  }

  return c.json({ data: serializeRoadmap(roadmap) });
});

// Create roadmap
roadmapRoutes.post('/', async (c) => {
  const user = c.get('user') as UserPayload;
  const body = await c.req.json();

  const { name, description, colorScheme = 'blue', template = 'blank' } = body;

  if (!name) {
    throw new AppError('VALIDATION_ERROR', 'Name is required', 400);
  }

  const roadmap = await prisma.roadmap.create({
    data: {
      name,
      description,
      colorScheme,
      ownerId: user.id,
    },
  });

  return c.json({ data: serializeRoadmap(roadmap) }, 201);
});

// Update roadmap
roadmapRoutes.put('/:id', async (c) => {
  const user = c.get('user') as UserPayload;
  const id = c.req.param('id');
  const body = await c.req.json();

  const existing = await prisma.roadmap.findFirst({
    where: { id, ownerId: user.id },
  });

  if (!existing) {
    throw new AppError('NOT_FOUND', 'Roadmap not found', 404);
  }

  const roadmap = await prisma.roadmap.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      colorScheme: body.colorScheme,
    },
  });

  return c.json({ data: serializeRoadmap(roadmap) });
});

// Delete roadmap
roadmapRoutes.delete('/:id', async (c) => {
  const user = c.get('user') as UserPayload;
  const id = c.req.param('id');

  const existing = await prisma.roadmap.findFirst({
    where: { id, ownerId: user.id },
  });

  if (!existing) {
    throw new AppError('NOT_FOUND', 'Roadmap not found', 404);
  }

  await prisma.roadmap.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return c.body(null, 204);
});

// Archive roadmap
roadmapRoutes.post('/:id/archive', async (c) => {
  const user = c.get('user') as UserPayload;
  const id = c.req.param('id');

  const existing = await prisma.roadmap.findFirst({
    where: { id, ownerId: user.id },
  });

  if (!existing) {
    throw new AppError('NOT_FOUND', 'Roadmap not found', 404);
  }

  const roadmap = await prisma.roadmap.update({
    where: { id },
    data: { isArchived: true },
  });

  return c.json({ data: serializeRoadmap(roadmap) });
});

// Duplicate roadmap
roadmapRoutes.post('/:id/duplicate', async (c) => {
  const user = c.get('user') as UserPayload;
  const id = c.req.param('id');
  const body = await c.req.json();

  const existing = await prisma.roadmap.findFirst({
    where: { id, ownerId: user.id },
    include: {
      workstreams: {
        include: {
          features: {
            include: {
              tasks: body.includeTasks !== false,
            },
          },
        },
      },
    },
  });

  if (!existing) {
    throw new AppError('NOT_FOUND', 'Roadmap not found', 404);
  }

  const roadmap = await prisma.roadmap.create({
    data: {
      name: body.name || `Copy of ${existing.name}`,
      description: existing.description,
      colorScheme: existing.colorScheme,
      ownerId: user.id,
    },
  });

  return c.json({ data: serializeRoadmap(roadmap) }, 201);
});

function serializeRoadmap(roadmap: any) {
  return {
    id: roadmap.id,
    name: roadmap.name,
    description: roadmap.description,
    colorScheme: roadmap.colorScheme,
    isArchived: roadmap.isArchived,
    createdAt: roadmap.createdAt.toISOString(),
    updatedAt: roadmap.updatedAt.toISOString(),
    ownerId: roadmap.ownerId,
    owner: roadmap.owner,
    workstreamCount: roadmap.workstreams?.length || 0,
    featureCount: roadmap.workstreams?.reduce(
      (acc: number, ws: any) => acc + (ws.features?.length || 0),
      0
    ) || 0,
    progress: calculateRoadmapProgress(roadmap.workstreams),
    workstreams: roadmap.workstreams,
    views: roadmap.views,
  };
}

function calculateRoadmapProgress(workstreams: any[]): number {
  if (!workstreams || workstreams.length === 0) return 0;
  
  const total = workstreams.reduce((acc, ws) => acc + (ws.progress || 0), 0);
  return Math.round(total / workstreams.length);
}
