// ─────────────────────────────────────────────────────────────────────────────
// Entrypoint : `npm run ingest:punk`
//
// Ce fichier ORCHESTRE. Pas de logique métier ici — uniquement le flow :
//   1. setup Prisma
//   2. sync repo
//   3. lire l'état précédent (DB)
//   4. lister les fichiers à traiter
//   5. itérer EN (pass 1), puis FR (pass 2)
//   6. logger un IngestionRun et sortir avec un exit code propre
// ─────────────────────────────────────────────────────────────────────────────

import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

import { log } from './logger.js';
import { syncRepo, listChangedCardFiles } from './repo.js';
import { parseCardFile } from './parser.js';
import {
  ensureLanguage,
  ensureSet,
  upsertCard,
  recordRun,
  getLastSuccessfulSha,
  IngestionRunSummary,
} from './upsert.js';
import { LANG_TO_FOLDER, SupportedLang } from './types.js';
import { downloadImage } from './images.js';

const LANGS: SupportedLang[] = ['en', 'fr'];
const LANG_NAMES: Record<SupportedLang, string> = {
  en: 'English',
  fr: 'Français',
};

async function main(): Promise<void> {
  const startedAt = new Date();
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const summary: IngestionRunSummary = {
    source: 'punk-records',
    commitSha: '',
    startedAt,
    finishedAt: startedAt,
    filesProcessed: 0,
    cardsUpserted: 0,
    variantsUpserted: 0,
    errors: 0,
    status: 'success',
  };

  try {
    log.info({ event: 'ingest_started' });

    // 1. Sync repo + récupère le SHA actuel
    const headSha = await syncRepo();
    summary.commitSha = headSha;

    // 2. Récupère le SHA du dernier run réussi (peut être null au tout premier run)
    const lastSha = await getLastSuccessfulSha(prisma);
    log.info({ event: 'sha_resolved', headSha, lastSha });

    // 3. Si rien n'a bougé → early exit (le `finally` se charge de recordRun)
    if (lastSha === headSha) {
      log.info({ event: 'diff_empty', reason: 'sha_unchanged' });
      return;
    }

    // 4. S'assurer que les Language rows existent
    for (const lang of LANGS) {
      await ensureLanguage(prisma, lang, LANG_NAMES[lang]);
    }

    // 5. Pass 1 : EN (langue primaire — crée les Card, Type, etc.)
    //    Pass 2 : FR (n'ajoute QUE les traductions et les images localisées)
    const setIdsByCode = new Map<string, string>();

    for (const lang of LANGS) {
      const folder = LANG_TO_FOLDER[lang];
      const files = await listChangedCardFiles(folder, lastSha);
      log.info({ event: 'pass_started', lang, fileCount: files.length });

      for (const file of files) {
        try {
          const card = await parseCardFile(file, lang);

          // FK obligatoire : le set doit exister.
          if (!setIdsByCode.has(card.setCode)) {
            const setId = await ensureSet(prisma, card.setCode, card.setCode);
            setIdsByCode.set(card.setCode, setId);
          }

          await upsertCard(prisma, card, setIdsByCode, /* isPrimaryLanguage */ lang === 'en');

          try {
            for (const v of card.variants) {
              await downloadImage(v.sourceUrl, v.storageKey, process.env.IMAGE_STORAGE_PATH!)
            }
          } catch (error: any) {
            log.error({ event: 'image_download_failed', code: card.code, error: String(error) })
          }


          summary.filesProcessed++;
          summary.cardsUpserted++;
          summary.variantsUpserted += card.variants.length;
        } catch (err) {
          summary.errors++;
          log.error({ event: 'card_failed', file, error: String(err) });
        }
      }
    }

    summary.status = summary.errors === 0 ? 'success' : 'partial';
  } catch (err) {
    summary.status = 'failed';
    log.error({ event: 'ingest_failed', error: String(err) });
    throw err;
  } finally {
    summary.finishedAt = new Date();
    await recordRun(prisma, summary).catch((err) =>
      log.error({ event: 'record_run_failed', error: String(err) }),
    );
    await prisma.$disconnect();
    log.info({ event: 'ingest_finished', summary });
  }
}

main().catch((err) => {
  // log.error a déjà émis le détail. Ici on s'assure juste d'un exit code != 0.
  console.error(err);
  process.exit(1);
});
