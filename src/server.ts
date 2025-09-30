import { serve } from 'bun';
import { CLIConfig, APIResponse, ClassificationRequest, CommentRequest, SessionState } from './types';
import { FileProcessor } from './processor';
import { SessionManager } from './session';
import { getAsset } from './assets';

export interface Server {
  port: number;
  stop: () => void;
  url: string;
  sessionManager: SessionManager;
}

export async function createServer(config: CLIConfig): Promise<Server> {
  // Process files to get items
  const items = await FileProcessor.processFiles(config);

  // Initialize session manager
  const sessionManager = new SessionManager(config);

  // Try to restore previous session
  let sessionState: SessionState = {
    config,
    currentIndex: 0,
    classifications: [],
    items,
    totalItems: items.length,
    startTime: new Date().toISOString(),
  };

  const existingSession = sessionManager.loadSession();
  if (existingSession && existingSession.totalItems === items.length) {
    console.log('Restoring previous session...');

    // Merge classifications, filtering out invalid ones
    sessionState.classifications = sessionManager.mergeClassifications(
      existingSession.classifications,
      items
    );
    sessionState.currentIndex = existingSession.currentIndex;

    console.log(`Restored ${sessionState.classifications.length} previous classifications`);
  }

  const server = serve({
    port: config.port || 0,
    async fetch(request) {
      const url = new URL(request.url);
      const pathname = url.pathname;

      try {
        // API Routes
        if (pathname.startsWith('/api/')) {
          return handleAPIRequest(pathname, request, sessionState, sessionManager);
        }

        // Static file serving
        return handleStaticFile(pathname);
      } catch (error) {
        console.error('Server error:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    },
  });

  const actualPort = server.port;
  const baseUrl = `http://localhost:${actualPort}`;

  console.log(`Server started at ${baseUrl}`);

  return {
    port: actualPort,
    url: baseUrl,
    sessionManager,
    stop: () => {
      // Save session before stopping
      sessionManager.saveSession(sessionState);
      server.stop();
    },
  };
}

async function handleAPIRequest(
  pathname: string,
  request: Request,
  sessionState: SessionState,
  sessionManager: SessionManager
): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    switch (pathname) {
      case '/api/state':
        return Response.json({
          success: true,
          data: sessionState,
        } as APIResponse<SessionState>, { headers });

      case '/api/classify':
        if (request.method !== 'POST') {
          return Response.json({
            success: false,
            error: 'Method not allowed',
          } as APIResponse, { status: 405, headers });
        }

        const classifyData = await request.json() as ClassificationRequest;
        return handleClassification(classifyData, sessionState, headers, sessionManager);

      case '/api/item':
        const itemIndex = parseInt(new URL(request.url).searchParams.get('index') || '0');
        return handleGetItem(itemIndex, sessionState, headers);

      case '/api/export':
        if (request.method !== 'POST') {
          return Response.json({
            success: false,
            error: 'Method not allowed',
          } as APIResponse, { status: 405, headers });
        }
        return handleExport(sessionState, headers);

      case '/api/comment':
        if (request.method === 'POST') {
          const commentData = await request.json() as CommentRequest;
          return handleSaveComment(commentData, sessionState, headers, sessionManager);
        } else if (request.method === 'DELETE') {
          const itemIndex = parseInt(new URL(request.url).searchParams.get('index') || '0');
          return handleDeleteComment(itemIndex, sessionState, headers, sessionManager);
        } else {
          return Response.json({
            success: false,
            error: 'Method not allowed',
          } as APIResponse, { status: 405, headers });
        }

      default:
        return Response.json({
          success: false,
          error: 'Not found',
        } as APIResponse, { status: 404, headers });
    }
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    } as APIResponse, { status: 500, headers });
  }
}

function handleStaticFile(pathname: string): Response {
  const asset = getAsset(pathname);

  if (!asset) {
    return new Response('Not Found', { status: 404 });
  }

  return new Response(asset.content, {
    headers: {
      'Content-Type': asset.mimeType,
      'Cache-Control': 'no-cache',
    },
  });
}

function handleClassification(
  data: ClassificationRequest,
  sessionState: SessionState,
  headers: Record<string, string>,
  sessionManager: SessionManager
): Response {
  const { itemIndex, category } = data;

  if (itemIndex < 0 || itemIndex >= sessionState.totalItems) {
    return Response.json({
      success: false,
      error: 'Invalid item index',
    } as APIResponse, { status: 400, headers });
  }

  if (category < 1 || category > sessionState.config.categories.length) {
    return Response.json({
      success: false,
      error: 'Invalid category',
    } as APIResponse, { status: 400, headers });
  }

  const item = sessionState.items[itemIndex];
  if (!item) {
    return Response.json({
      success: false,
      error: 'Item not found',
    } as APIResponse, { status: 404, headers });
  }

  // Find existing classification for this item to preserve comment
  const existingClassification = sessionState.classifications.find(
    c => c.itemId === item.id
  );

  // Remove existing classification for this item
  sessionState.classifications = sessionState.classifications.filter(
    c => c.itemId !== item.id
  );

  // Add new classification, preserving existing comment if any
  sessionState.classifications.push({
    itemId: item.id,
    category,
    categoryName: sessionState.config.categories[category - 1],
    timestamp: new Date().toISOString(),
    comment: existingClassification?.comment, // Preserve existing comment
  });

  // Auto-save session after each classification
  sessionManager.saveSession(sessionState);

  return Response.json({
    success: true,
    data: { classified: true },
  } as APIResponse, { headers });
}

function handleGetItem(
  index: number,
  sessionState: SessionState,
  headers: Record<string, string>
): Response {
  if (index < 0 || index >= sessionState.totalItems) {
    return Response.json({
      success: false,
      error: 'Invalid item index',
    } as APIResponse, { status: 400, headers });
  }

  const item = sessionState.items[index];
  if (!item) {
    return Response.json({
      success: false,
      error: 'Item not found',
    } as APIResponse, { status: 404, headers });
  }

  return Response.json({
    success: true,
    data: item,
  } as APIResponse, { headers });
}

function handleExport(
  sessionState: SessionState,
  headers: Record<string, string>
): Response {
  const categoryCounts: Record<string, number> = {};
  sessionState.config.categories.forEach(cat => {
    categoryCounts[cat] = 0;
  });

  sessionState.classifications.forEach(classification => {
    categoryCounts[classification.categoryName]++;
  });

  const exportData = {
    sessionId: `session-${Date.now()}`,
    config: sessionState.config,
    classifications: sessionState.classifications,
    summary: {
      totalItems: sessionState.totalItems,
      classifiedItems: sessionState.classifications.length,
      unclassifiedItems: sessionState.totalItems - sessionState.classifications.length,
      categoryCounts,
    },
    exportedAt: new Date().toISOString(),
  };

  return Response.json({
    success: true,
    data: exportData,
  } as APIResponse, { headers });
}

function handleSaveComment(
  data: CommentRequest,
  sessionState: SessionState,
  headers: Record<string, string>,
  sessionManager: SessionManager
): Response {
  const { itemIndex, comment } = data;

  if (itemIndex < 0 || itemIndex >= sessionState.totalItems) {
    return Response.json({
      success: false,
      error: 'Invalid item index',
    } as APIResponse, { status: 400, headers });
  }

  const item = sessionState.items[itemIndex];
  if (!item) {
    return Response.json({
      success: false,
      error: 'Item not found',
    } as APIResponse, { status: 404, headers });
  }

  // Find existing classification
  const existingClassification = sessionState.classifications.find(c => c.itemId === item.id);

  if (existingClassification) {
    // Update comment on existing classification
    existingClassification.comment = comment.trim() || undefined;
  } else {
    // Create a placeholder classification with just the comment
    sessionState.classifications.push({
      itemId: item.id,
      category: 0, // No category assigned yet
      categoryName: 'Unclassified',
      timestamp: new Date().toISOString(),
      comment: comment.trim() || undefined,
    });
  }

  // Auto-save session after comment update
  sessionManager.saveSession(sessionState);

  return Response.json({
    success: true,
    data: { commentSaved: true },
  } as APIResponse, { headers });
}

function handleDeleteComment(
  itemIndex: number,
  sessionState: SessionState,
  headers: Record<string, string>,
  sessionManager: SessionManager
): Response {
  if (itemIndex < 0 || itemIndex >= sessionState.totalItems) {
    return Response.json({
      success: false,
      error: 'Invalid item index',
    } as APIResponse, { status: 400, headers });
  }

  const item = sessionState.items[itemIndex];
  if (!item) {
    return Response.json({
      success: false,
      error: 'Item not found',
    } as APIResponse, { status: 404, headers });
  }

  // Find existing classification
  const existingClassification = sessionState.classifications.find(c => c.itemId === item.id);

  if (existingClassification) {
    if (existingClassification.category === 0) {
      // If it's a comment-only classification, remove it entirely
      sessionState.classifications = sessionState.classifications.filter(c => c.itemId !== item.id);
    } else {
      // If it has a category, just remove the comment
      existingClassification.comment = undefined;
    }
  }

  // Auto-save session after comment deletion
  sessionManager.saveSession(sessionState);

  return Response.json({
    success: true,
    data: { commentDeleted: true },
  } as APIResponse, { headers });
}