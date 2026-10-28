import type { Server } from '@avalon/types';
import { AiPause, type BotRequest } from './client';
import { aiText } from './language';
import { BotRoom } from './room';

const io = { to: () => io, except: () => io, emit: () => true } as unknown as Server;

test.each(['discussion', 'selection', 'votes'] as const)(
  'ordinary %s checkpoint errors pause resumably without repeating completed decisions',
  async (phase) => {
    const requests: BotRequest[] = [];
    let failed = false;
    const room = new BotRoom(
      'checkpoint-outage',
      'admin',
      io,
      async (request) => {
        requests.push(request);
        return { choice: 0, speech: request.speak ? 'Discuss this team.' : '' };
      },
      async (state) => {
        const latest = requests.at(-1);
        if (
          !failed &&
          latest &&
          ((phase === 'discussion' && room.chat.history.length === 3) ||
            (phase === 'selection' && latest.optionalSpeech && room.chat.history.length === 8) ||
            (phase === 'votes' && latest.state.stage === 'votingForTeam'))
        ) {
          failed = true;
          throw new Error('Temporary database outage');
        }
        if (state.stage === 'started' && state.game.stage === 'onMission') room.stop();
      },
    );

    await room.run();
    expect(room.ai).toMatchObject({ status: 'paused', canResumeTechnical: true });
    await room.run(true);
    expect(requests.filter((request) => request.publicDiscussion)).toHaveLength(7);
    expect(requests.filter((request) => request.optionalSpeech)).toHaveLength(1);
    expect(requests.filter((request) => request.state.stage === 'votingForTeam')).toHaveLength(7);
    expect(room.chat.history).toHaveLength(8);
    if (room.data.stage !== 'started') throw Error('not started');
    expect(room.data.manager.prepareStateForUser().history.filter((event) => event.type === 'vote')).toHaveLength(1);
  },
);

test.each(['discussion', 'selection'] as const)(
  'ordinary %s publication errors retry the same ID without regenerating completed speech',
  async (phase) => {
    const requests: BotRequest[] = [];
    const publications: { text: string; requestID?: string }[] = [];
    let failedText: string | undefined;
    const room = new BotRoom(
      'publication-outage',
      'admin',
      io,
      async (request) => {
        requests.push(request);
        return { choice: 0, speech: request.speak ? `PUBLIC_LINE_${requests.length}` : '' };
      },
      async (state) => {
        if (state.stage === 'started' && state.game.stage === 'onMission') room.stop();
      },
    );
    room.persistChatMessage = async (id, text, requestID) => {
      publications.push({ text, requestID });
      // The insert may commit before a subsequent DB/history read fails.
      room.addMessage(id, text, requestID);
      const latest = requests.at(-1)!;
      if (!failedText && (phase === 'discussion' ? latest.publicDiscussion : latest.optionalSpeech)) {
        failedText = text;
        throw new Error('Temporary database outage');
      }
    };

    await room.run();
    expect(room.ai).toMatchObject({ status: 'paused', canResumeTechnical: true });
    await room.run(true);
    const retried = publications.filter((publication) => publication.text === failedText);
    expect(retried).toHaveLength(2);
    expect(retried[0].requestID).toBeTruthy();
    expect(retried[1].requestID).toBe(retried[0].requestID);
    expect(room.chat.history.filter((message) => message.message === failedText)).toHaveLength(1);
    expect(room.chat.history).toHaveLength(8);
    expect(requests.filter((request) => request.publicDiscussion)).toHaveLength(7);
    expect(requests.filter((request) => request.optionalSpeech)).toHaveLength(1);
  },
);

test.each(['checkpoint', 'publication'] as const)('intentional %s pauses remain non-resumable', async (boundary) => {
  const room = new BotRoom(
    'intentional-pause',
    'admin',
    io,
    async () => ({ choice: 0, speech: 'Discuss this team.' }),
    async () => {
      if (boundary === 'checkpoint' && room.ai?.status === 'running') throw new AiPause('Intentional stop');
    },
  );
  if (boundary === 'publication')
    room.persistChatMessage = async () => {
      throw new AiPause('Intentional stop');
    };
  await room.run();
  expect(room.ai).toMatchObject({ status: 'paused', canResumeTechnical: false, message: 'Intentional stop' });
});

test.each([
  { stage: 'checkLoyalty', announcement: 1, boundary: 'publication' },
  { stage: 'announceLoyalty', announcement: 1, boundary: 'publication' },
  { stage: 'announceLoyalty', announcement: 2, boundary: 'publication' },
  { stage: 'checkLoyalty', announcement: 1, boundary: 'checkpoint' },
  { stage: 'announceLoyalty', announcement: 0, boundary: 'checkpoint' },
  { stage: 'announceLoyalty', announcement: 1, boundary: 'checkpoint' },
  { stage: 'announceLoyalty', announcement: 2, boundary: 'checkpoint' },
])(
  '$stage $announcement $boundary recovery retains the decision and ordered publications',
  async ({ stage, announcement, boundary }) => {
    const requests: BotRequest[] = [];
    const publications: { id: string; text: string; requestID?: string }[] = [];
    let failed = false;
    let phasePublications = 0;
    let failedPublication: (typeof publications)[number] | undefined;
    const room = new BotRoom(
      'lady-persistence-outage',
      'admin',
      io,
      async (request) => {
        if (
          requests.some((previous) => previous.state.stage === 'announceLoyalty') &&
          request.state.stage === 'selectTeam'
        )
          room.stop();
        requests.push(request);
        return {
          choice: request.state.stage === 'onMission' ? request.choices.indexOf('success') : 0,
          speech: request.speak
            ? request.state.stage === 'checkLoyalty'
              ? 'Inspect this player.'
              : 'Discuss the team.'
            : '',
        };
      },
      async () => {
        if (
          !failed &&
          boundary === 'checkpoint' &&
          requests.at(-1)?.state.stage === stage &&
          phasePublications >= announcement
        ) {
          failed = true;
          throw new Error('Temporary database outage');
        }
      },
    );
    room.persistChatMessage = async (id, text, requestID) => {
      const publication = { id, text, requestID };
      publications.push(publication);
      room.addMessage(id, text, requestID);
      if (requests.at(-1)?.state.stage === stage) {
        phasePublications += 1;
        if (!failed && boundary === 'publication' && phasePublications === announcement) {
          failed = true;
          failedPublication = publication;
          throw new Error('Temporary database outage');
        }
      }
    };

    await room.run();
    expect(failed).toBe(true);
    expect(room.ai).toMatchObject({ status: 'paused', canResumeTechnical: true });
    await room.run(true);
    expect(requests.filter((request) => request.state.stage === 'checkLoyalty')).toHaveLength(1);
    expect(requests.filter((request) => request.state.stage === 'announceLoyalty')).toHaveLength(1);
    const check = requests.find((request) => request.state.stage === 'checkLoyalty')!;
    const announce = requests.find((request) => request.state.stage === 'announceLoyalty')!;
    const target = announce.state.players.find((player) => player.features.isSelected)!;
    expect(String(target.index)).toBe(check.choices[0]);
    const messages = room.chat.history;
    const explanation = messages.findIndex(
      (message) => message.userID === check.playerID && message.message === 'Inspect this player.',
    );
    expect(messages.slice(explanation, explanation + 3).map((message) => message.userID)).toEqual([
      check.playerID,
      check.playerID,
      target.id,
    ]);
    expect(messages.slice(explanation, explanation + 3).map((message) => message.message)).toEqual([
      'Inspect this player.',
      `Checked ${target.index} with the Lady: Good.`,
      aiText('en').inspectionResponse(check.name, true, target.index),
    ]);
    if (failedPublication) {
      const retried = publications.filter((publication) => publication.requestID === failedPublication!.requestID);
      expect(failedPublication.requestID).toBeTruthy();
      expect(retried).toHaveLength(2);
      expect(
        room.chat.history.filter(
          (message) => message.userID === failedPublication!.id && message.message === failedPublication!.text,
        ),
      ).toHaveLength(1);
    }
  },
);
