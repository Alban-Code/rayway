// ─────────────────────────────────────────────────────────────────────────────
// Gestion du clone local du repo punk-records.
//
// Idée : on ne télécharge que ce qu'il faut, et on calcule un diff pour ne
// retraiter que les fichiers modifiés depuis le dernier run.
//
// État stocké en DB (table IngestionRun.commitSha) — PAS sur le filesystem,
// car en cloud le container est éphémère.
// ─────────────────────────────────────────────────────────────────────────────

import { execFile } from 'node:child_process';
import { access, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { log } from './logger.js';

const exec = promisify(execFile);

const REPO_URL = process.env.PUNK_REPO_URL ?? 'https://github.com/buhbbl/punk-records.git';
const CLONE_DIR = process.env.PUNK_CLONE_DIR ?? '/tmp/punk-records';
const BRANCH = process.env.PUNK_REPO_BRANCH ?? 'main';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vérifie que `CLONE_DIR` contient bien un repo git valide.
 * On teste la présence du dossier `.git` plutôt que `CLONE_DIR` lui-même :
 * un dossier vide pourrait exister sans qu'un clone ait abouti.
 */
async function hasGitClone(): Promise<boolean> {
  try {
    await access(join(CLONE_DIR, '.git'));
    return true;
  } catch {
    return false;
  }
}

/** Exécute `git` dans `CLONE_DIR`. Retourne stdout en string trimmé. */
async function git(...args: string[]): Promise<string> {
  const { stdout } = await exec('git', args, { cwd: CLONE_DIR });
  return stdout.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Sync : clone ou met à jour le repo
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Clone (ou met à jour) le repo localement. Retourne le SHA du HEAD courant.
 *
 * Comportement :
 *  - si `CLONE_DIR/.git` existe → `git fetch` + `git reset --hard origin/<branch>`
 *  - sinon → `git clone` dans `CLONE_DIR`
 *
 * On NE fait PAS de clone shallow (`--depth`) : sinon, si le SHA du dernier run
 * réussi est plus vieux que la profondeur, `git diff` échoue. Le repo est petit
 * (~100 MB max), on peut se permettre l'historique complet.
 */
export async function syncRepo(): Promise<string> {
  const exists = await hasGitClone();

  if (exists) {
    log.info({ event: 'repo_sync_start', mode: 'fetch', cloneDir: CLONE_DIR });
    await git('fetch', 'origin', BRANCH);
    await git('reset', '--hard', `origin/${BRANCH}`);
  } else {
    log.info({ event: 'repo_sync_start', mode: 'clone', cloneDir: CLONE_DIR, repoUrl: REPO_URL });
    // Pour un clone, on ne peut pas utiliser `cwd: CLONE_DIR` (le dossier n'existe pas
    // forcément). On laisse git créer le dossier cible lui-même.
    await exec('git', ['clone', '--branch', BRANCH, REPO_URL, CLONE_DIR]);
  }

  const sha = await git('rev-parse', 'HEAD');
  log.info({ event: 'repo_sync_done', sha });
  return sha;
}

// ─────────────────────────────────────────────────────────────────────────────
// Diff : quels fichiers cartes ont changé depuis le dernier run ?
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Liste les fichiers JSON de cartes à (re-)traiter pour une langue donnée.
 *
 * @param lang dossier de langue ('english', 'french', ...)
 * @param fromSha SHA du dernier run réussi, ou `null` pour un premier run
 * @returns chemins ABSOLUS vers les fichiers JSON
 *
 * Comportement :
 *  - fromSha === null  → tous les fichiers `<lang>/cards/**\/*.json` (premier run)
 *  - fromSha défini    → `git diff --name-only --diff-filter=AM fromSha..HEAD`
 *                        limité à `<lang>/cards/`, ne garde que les .json
 *
 * On utilise `--diff-filter=AM` pour ne lister que les fichiers Ajoutés ou
 * Modifiés. Les suppressions sont ignorées (gestion à part, plus tard si besoin).
 */
export async function listChangedCardFiles(
  lang: string,
  fromSha: string | null,
): Promise<string[]> {
  const cardsRoot = join(CLONE_DIR, lang, 'cards');

  if (fromSha === null) {
    // Premier run : on liste tout récursivement.
    // `readdir(..., { recursive: true })` est dispo depuis Node 20.
    // Les noms renvoyés sont RELATIFS à `cardsRoot`.
    const entries = await readdir(cardsRoot, { recursive: true });
    const files = entries
      .filter((name) => name.endsWith('.json'))
      .map((name) => join(cardsRoot, name));
    log.info({ event: 'list_files_full', lang, count: files.length });
    return files;
  }

  // Run incrémental : on demande à git ce qui a changé.
  // Les paths retournés par git sont relatifs à la racine du repo
  // (ex: "french/cards/622015/OP02-001.json"), on les rend absolus.
  const stdout = await git(
    'diff',
    '--name-only',
    '--diff-filter=AM',
    `${fromSha}..HEAD`,
    '--',
    `${lang}/cards/`,
  );

  const files = stdout
    .split('\n')
    .filter((line) => line.endsWith('.json'))
    .map((rel) => join(CLONE_DIR, rel));

  log.info({ event: 'list_files_diff', lang, fromSha, count: files.length });
  return files;
}

/** Pour debug uniquement. */
export function getClonePath(): string {
  return CLONE_DIR;
}
