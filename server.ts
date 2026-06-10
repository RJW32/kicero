/**
 * Local dev API server: same routes and shared handlers as the production
 * Worker (worker.ts), but questionnaire multipart uploads land on local disk
 * instead of R2.
 */
import 'dotenv/config';
import express, {type Response} from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import {processContactSubmission} from './src/lib/api/contact';
import {
  processClientUploadPresign,
  processQuestionnaireUploadUrl,
  type PresignEnv,
} from './src/lib/api/presign';
import {processQuestionnaireSubmission} from './src/lib/api/questionnaire';
import {apiError, type ApiResult} from './src/lib/api/shared';
import {
  assertAllowedUpload,
  DEFAULT_MAX_BYTES,
} from './src/lib/questionnaireUploadPolicy';

const app = express();
app.use(express.json({limit: '100kb'}));
const port = Number(process.env.PORT ?? 8787);
const localUploadDir = process.env.LOCAL_UPLOAD_DIR ?? 'uploads';

const uploadDisk = multer({
  storage: multer.diskStorage({
    destination: async (_req, _file, cb) => {
      await fs.mkdir(localUploadDir, {recursive: true});
      cb(null, localUploadDir);
    },
    filename: (_req, file, cb) => {
      const uniq = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${uniq}-${safe}`);
    },
  }),
  limits: {fileSize: DEFAULT_MAX_BYTES},
});

app.use('/uploads', express.static(localUploadDir));

function send(res: Response, result: ApiResult): Response {
  return res.status(result.status).json(result.body);
}

function presignEnvFromProcess(): PresignEnv {
  return {
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    R2_S3_ENDPOINT: process.env.R2_S3_ENDPOINT,
    R2_PUBLIC_BASE: process.env.R2_PUBLIC_BASE,
  };
}

app.post('/api/contact', async (req, res) => {
  send(res, await processContactSubmission(req.body, process.env));
});

app.post('/api/questionnaire/upload-url', async (req, res) => {
  send(
    res,
    await processQuestionnaireUploadUrl(req.body, {
      env: presignEnvFromProcess(),
      notConfigured: apiError(
        501,
        'Direct upload to R2 is not configured in .env (use multipart fallback).',
        {fallback: true},
      ),
    }),
  );
});

app.post('/api/client-upload/presign', async (req, res) => {
  send(
    res,
    await processClientUploadPresign(req.body, {
      env: presignEnvFromProcess(),
      clientUploadSecret: process.env.CLIENT_UPLOAD_SECRET,
    }),
  );
});

/** Multipart fallback: stores the file on local disk and serves it from /uploads. */
app.post('/api/questionnaire/upload', uploadDisk.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) {
    return send(res, apiError(400, 'Expected file upload.'));
  }

  const relativePath =
    typeof req.body?.relativePath === 'string' ? req.body.relativePath.trim() : '';
  const batchId =
    typeof req.body?.batchId === 'string' ? req.body.batchId.trim() : '';
  if (batchId && !/^[a-f0-9-]{36}$/i.test(batchId)) {
    await fs.unlink(file.path).catch(() => null);
    return send(res, apiError(400, 'batchId must be a UUID.'));
  }

  const v = assertAllowedUpload({
    filename: file.originalname,
    contentType: file.mimetype || 'application/octet-stream',
    size: file.size,
    relativePath: relativePath || undefined,
  });
  if (v.error) {
    await fs.unlink(file.path).catch(() => null);
    return send(res, apiError(400, v.error));
  }

  return send(res, {
    status: 200,
    body: {
      key: file.filename,
      url: `http://localhost:${port}/uploads/${encodeURI(file.filename)}`,
      filename: relativePath || file.originalname,
      size: file.size,
      contentType: file.mimetype || 'application/octet-stream',
      relativePath: relativePath || undefined,
    },
  });
});

app.post('/api/questionnaire', async (req, res) => {
  const requestProto =
    typeof req.headers['x-forwarded-proto'] === 'string'
      ? req.headers['x-forwarded-proto'].split(',')[0]?.trim()
      : undefined;
  const inferredOrigin = `${requestProto ?? req.protocol}://${req.get('host')}`;

  send(
    res,
    await processQuestionnaireSubmission(req.body, {
      requestUrl: `${inferredOrigin}/`,
      env: process.env,
    }),
  );
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
