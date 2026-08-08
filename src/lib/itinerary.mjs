// 工程表の時刻計算。DayPlan.astro（表示）と scripts/check_itinerary.mjs（検算）が
// この1ファイルを共有する。表示と検算が別々に時刻を計算すると、
// 「サイトには載っているが検算は通っていない行程」が静かに生まれるため。

export const KIND_LABEL = {
  spot: 'See',
  move: 'Move',
  pit: 'Pit stop',
  meal: 'Eat',
  rest: 'Rest',
  flex: 'Flex',
  admin: 'Admin',
};

export function parseClock(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? '').trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function fmtClock(mins) {
  const wrapped = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function fmtDuration(mins) {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

/**
 * 1日ぶんの時刻を積み上げで確定する。
 * ブロックに時刻は書かせない（手書きの時刻と所要時間が食い違う事故を構造的に潰すため）。
 * anchor があるブロックは、到着が早ければ待ち時間として吸収し、遅ければ破綻として記録する。
 */
export function computeDay(day) {
  const startMin = parseClock(day.start);
  const issues = [];
  if (startMin === null) {
    issues.push(`day ${day.day}: start ("${day.start}") が HH:MM 形式でない`);
  }

  let cursor = startMin ?? 0;
  const blocks = [];

  for (const [i, b] of (day.blocks ?? []).entries()) {
    const min = Number(b.min);
    let waitMin = 0;

    const anchor = b.anchor ? parseClock(b.anchor) : null;
    if (b.anchor && anchor === null) {
      issues.push(`day ${day.day} block ${i} (${b.title}): anchor "${b.anchor}" が HH:MM 形式でない`);
    }
    if (anchor !== null) {
      if (cursor > anchor) {
        // 行程が破綻している。積み上げで着く時刻が、間に合わなければならない時刻を過ぎている。
        issues.push(
          `day ${day.day} block ${i} (${b.title}): anchor ${b.anchor} に間に合わない（積み上げでは ${fmtClock(cursor)} 着）`
        );
      } else {
        waitMin = anchor - cursor;
        cursor = anchor;
      }
    }

    const mustStartBy = b.mustStartBy ? parseClock(b.mustStartBy) : null;
    if (b.mustStartBy && mustStartBy === null) {
      issues.push(
        `day ${day.day} block ${i} (${b.title}): mustStartBy "${b.mustStartBy}" が HH:MM 形式でない`
      );
    }
    if (mustStartBy !== null && cursor > mustStartBy) {
      issues.push(
        `day ${day.day} block ${i} (${b.title}): 締切 ${b.mustStartBy} を過ぎて開始する（積み上げでは ${fmtClock(cursor)}）`
      );
    }

    if (!Number.isFinite(min) || min <= 0) {
      issues.push(`day ${day.day} block ${i} (${b.title}): min が正の数でない`);
    }

    const s = cursor;
    cursor += Number.isFinite(min) && min > 0 ? min : 0;

    blocks.push({
      ...b,
      index: i,
      waitMin,
      startMin: s,
      endMin: cursor,
      start: fmtClock(s),
      end: fmtClock(cursor),
    });
  }

  const sumBy = (pred) =>
    blocks.reduce((acc, b) => acc + (pred(b) ? Number(b.min) || 0 : 0), 0);

  const walkMin = blocks.reduce(
    (acc, b) => acc + (b.kind === 'move' ? Number(b.breakdown?.walk) || 0 : 0),
    0
  );

  const totals = {
    spot: sumBy((b) => b.kind === 'spot'),
    move: sumBy((b) => b.kind === 'move'),
    meal: sumBy((b) => b.kind === 'meal'),
    rest: sumBy((b) => b.kind === 'rest'),
    pit: sumBy((b) => b.kind === 'pit'),
    admin: sumBy((b) => b.kind === 'admin'),
    flex: sumBy((b) => b.kind === 'flex'),
    walk: walkMin,
    // 「立ちっぱなしの時間」＝滞在＋移動の徒歩ぶん。休憩の必要量を判断するのに使う。
    onFoot: sumBy((b) => b.kind === 'spot') + walkMin,
    day: cursor - (startMin ?? 0),
  };

  return {
    ...day,
    startMin: startMin ?? 0,
    endMin: cursor,
    endLabel: fmtClock(cursor),
    blocks,
    totals,
    issues,
  };
}

export function computePlan(plan) {
  return { ...plan, days: (plan.days ?? []).map(computeDay) };
}
