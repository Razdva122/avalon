/** Local-only demo data. Run from packages/backend; pass --remove to delete only these fixtures. */
import '@/init';
import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import { hash } from 'bcrypt';
import { config } from '@/config';
import { userProfileModel } from '@/db/models';
import {
  boardListingModel,
  boardReportModel,
  boardAuthorModel,
  ensurePlayerBoardIndexes,
} from '@/player-boards/repository';
import { validateBoardDraft } from '@/player-boards/validation';
import type { BoardDraft } from '@avalon/types/player-board';

const samples = [
  {
    name: '小林 · DEMO',
    avatar: 'merlin',
    kind: 'solo',
    otherLanguage: '日本語',
    languages: ['cmn', 'other'],
    zone: 'Asia/Taipei',
    contact: 'line',
    scheduleEnabled: true,
    days: [5, 6],
    hour: 20,
    voice: 'voice',
    experience: 'beginner',
  },
  {
    name: '阿哲 · DEMO',
    avatar: 'percival',
    kind: 'solo',
    otherLanguage: '',
    languages: ['cmn', 'en'],
    zone: 'Asia/Shanghai',
    contact: 'wechat',
    scheduleEnabled: true,
    days: [2, 4, 6],
    hour: 19,
    voice: 'either',
    experience: 'experienced',
  },
  {
    name: 'Ming · DEMO',
    avatar: 'morgana',
    kind: 'solo',
    otherLanguage: '',
    languages: ['yue', 'cmn'],
    zone: 'Asia/Hong_Kong',
    contact: 'qq',
    scheduleEnabled: true,
    days: [6, 7],
    hour: 21,
    voice: 'text',
    experience: 'beginner',
  },
  {
    name: 'Анна · DEMO',
    avatar: 'servant',
    kind: 'solo',
    otherLanguage: '',
    languages: ['ru', 'en'],
    zone: 'Europe/Moscow',
    contact: 'telegram',
    scheduleEnabled: true,
    days: [1, 3, 5],
    hour: 18,
    voice: 'voice',
    experience: 'experienced',
  },
  {
    name: '台北夥伴 · DEMO',
    avatar: 'percival',
    kind: 'group',
    otherLanguage: '',
    languages: ['cmn'],
    zone: 'Asia/Taipei',
    contact: 'line',
    scheduleEnabled: true,
    days: [5, 6],
    hour: 20,
    voice: 'voice',
    experience: 'experienced',
    size: 4,
  },
  {
    name: '周末阿瓦隆 · DEMO',
    avatar: 'merlin',
    kind: 'group',
    otherLanguage: '',
    languages: ['cmn'],
    zone: 'Asia/Shanghai',
    contact: 'qqGroup',
    scheduleEnabled: true,
    days: [6, 7],
    hour: 19,
    voice: 'either',
    experience: 'experienced',
    size: 5,
  },
  {
    name: 'Night Owls · DEMO',
    avatar: 'mordred',
    kind: 'group',
    otherLanguage: 'Deutsch',
    languages: ['en', 'cmn', 'other'],
    zone: 'Asia/Taipei',
    contact: 'discord',
    scheduleEnabled: true,
    days: [5, 6],
    hour: 22,
    voice: 'voice',
    experience: 'experienced',
    size: 6,
  },
  {
    name: 'Вечер игр · DEMO',
    avatar: 'morgana',
    kind: 'group',
    otherLanguage: '',
    languages: ['ru'],
    zone: 'Asia/Yekaterinburg',
    contact: 'telegram',
    scheduleEnabled: true,
    days: [3, 5, 7],
    hour: 20,
    voice: 'text',
    experience: 'beginner',
    size: 3,
  },
] as const;
const ids = samples.map((_, index) => `demo-board-${String(index + 1).padStart(2, '0')}`);

async function main() {
  if (
    process.env.NODE_ENV === 'production' ||
    !['localhost', '127.0.0.1', '::1'].includes(process.env.MONGODB_HOST || '')
  ) {
    throw Error('Demo seeding is allowed only against a local development MongoDB.');
  }
  await mongoose.connect(config.MONGODB_URI, {
    dbName: config.DB_NAME,
    authSource: 'admin',
    autoIndex: false,
    serverSelectionTimeoutMS: 10000,
  });
  for (const id of ids) {
    const existing = await userProfileModel.findOne({ id }).lean();
    if (existing && (existing.login !== id || existing.email !== `${id}@example.invalid`))
      throw Error('A fixture ID belongs to another account. No changes made.');
  }
  if (process.argv.includes('--remove')) {
    const listings = await boardListingModel.find({ userID: { $in: ids } }, { _id: 1 }).lean();
    await boardReportModel.deleteMany({
      $or: [{ listingID: { $in: listings.map((item) => item._id) } }, { reporterID: { $in: ids } }],
    });
    await boardListingModel.deleteMany({ userID: { $in: ids } });
    await boardAuthorModel.deleteMany({ userID: { $in: ids } });
    await userProfileModel.deleteMany({ id: { $in: ids } });
    console.log('Removed only the eight demo board profiles and their listings.');
    return;
  }
  await ensurePlayerBoardIndexes();
  const password = await hash(randomBytes(32).toString('hex'), 10);
  const now = Date.now();
  for (const [index, sample] of samples.entries()) {
    const id = ids[index];
    const draft: BoardDraft = {
      kind: sample.kind,
      otherLanguage: sample.otherLanguage,
      languages: [...sample.languages],
      scheduleEnabled: true,
      days: [...sample.days],
      startHour: sample.hour,
      endHour: (sample.hour + 3) % 24,
      timeZone: sample.zone,
      communication: sample.voice,
      experience: sample.experience,
      beginnerFriendly: index !== 6,
      canTeach: sample.experience === 'experienced',
      groupName: sample.kind === 'group' ? sample.name.replace(' · DEMO', '') : '',
      groupSize: 'size' in sample ? sample.size : 1,

      contacts: [
        {
          type: sample.contact,
          value:
            sample.contact === 'qq' || sample.contact === 'qqGroup'
              ? `10000000000000${index + 10}`
              : `demo_avalon_${index + 1}`,
        },
      ],
    };
    validateBoardDraft(draft, sample.kind);
    await userProfileModel.updateOne(
      { id },
      {
        $set: { name: sample.name, avatar: sample.avatar },
        $setOnInsert: {
          id,
          login: id,
          email: `${id}@example.invalid`,
          password,
          registrationDate: new Date(now).toISOString(),
          authVersion: 1,
          isAdmin: false,
        },
      },
      { upsert: true },
    );
    await boardListingModel.updateOne(
      { userID: id, kind: sample.kind },
      {
        $set: {
          ...draft,
          active: true,
          moderated: false,
          publishingBlocked: false,
          createdAt: new Date(now - (index + 1) * 86400000),
          bumpedAt: new Date(now - index * 3600000),
          expiresAt: new Date(now - index * 3600000 + 30 * 86400000),
        },
      },
      { upsert: true },
    );
  }
  const count = await boardListingModel.countDocuments({ userID: { $in: ids }, active: true });
  if (count !== samples.length) throw Error('Demo verification failed.');
  console.log(
    `Verified ${count} demo listings: four solo players and four groups. Existing accounts and games were not changed.`,
  );
}
void main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error && error.message.startsWith('Demo')
        ? error.message
        : 'Demo seed failed; check the local database connection and fixture IDs.',
    );
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
