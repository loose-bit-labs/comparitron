#!/usr/bin/env bash
# gauntlet-harvest.sh — widen the gauntlet corpus with Claude session transcripts from
# the fleet boxes that have real history (chonko, aid, ...). Transcripts are PULLED to
# tbona (read-only tar over ssh, .jsonl only) and harvested here; nothing runs remotely.
#
# RUN FROM A TERMINAL, NO sudo:   ~/tmp/locatesta/gauntlet-harvest.sh chonko aid
# Env knobs: PICK_MAX per-box collection cap (default 120), TOTAL merged send-set size (default 60)
# Classifier gate (optional, any one):  LLM_URL=http://127.0.0.1:11311  local-model gate
#                                       JEV=1  TypeSafe System One gate (spends wallet; sends
#                                       candidate strings to api.typesafe.ai BEFORE your read —
#                                       your call to flip, per-box verdicts are cached)
# Iron rules: no rm anywhere, no sudo, nothing leaves this box — the arbiter never sees
# anything until YOU read the merged gauntlet-tasks.json and run the judge yourself.
set -u

readonly DIR="${HOME}/tmp/locatesta"
readonly HARVEST="${DIR}/harvest"
readonly CORPUS="${DIR}/gauntlet-corpus.mjs"
readonly MERGE="${DIR}/gauntlet-merge.mjs"
readonly PICK_MAX="${PICK_MAX:-120}"
readonly TOTAL="${TOTAL:-60}"

_log() { printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }
_die() { _log "FATAL: $*"; exit 1; }

_harvest_box() { # BOX
	local box=$1 dest="${HARVEST}/${box}" n
	[ -d "$dest" ] || mkdir -p "$dest"
	_log "harvesting ${box}: pulling .jsonl transcripts (subagents dirs excluded)..."
	ssh -o BatchMode=yes -o ConnectTimeout=10 "${box}" \
		'cd ~/.claude/projects 2>/dev/null || exit 127
		 find . -name "*.jsonl" -type f -not -path "*subagents*" | tar -cf - -T - 2>/dev/null' \
		| tar -C "$dest" -xf - || _die "ssh/tar to ${box} failed — check host alias and that ~/.claude/projects exists there"
	n=$(find "$dest" -name '*.jsonl' | wc -l)
	_log "${box}: ${n} transcript files landed in ${dest}"
	[ "$n" -gt 0 ] || _die "${box} has zero transcripts — nothing to harvest, is ~/.claude/projects even there?"
}

_build_box() { # BOX
	local box=$1 gate=""
	[ -z "${LLM_URL:-}" ] || gate=" --llm ${LLM_URL}"
	[ -z "${JEV:-}" ] || gate=" --jev"
	_log "building corpus for ${box} (cap ${PICK_MAX}${gate:+ + classifier:$gate})..."
	# shellcheck disable=SC2086
	node "$CORPUS" --root "${HARVEST}/${box}" \
		--host "${box}" --out "${DIR}/gauntlet-tasks-${box}.json" --max "$PICK_MAX" $gate \
		|| _die "corpus build failed for ${box}"
}

_main() {
	[ "$(id -u)" != 0 ] || _die "run me WITHOUT sudo"
	[ $# -ge 1 ] || _die "usage: gauntlet-harvest.sh BOX [BOX...]  (boxes you can ssh to, e.g. chonko aid)"
	for f in "$CORPUS" "$MERGE"; do [ -f "$f" ] || _die "missing ${f}"; done
	command -v ssh >/dev/null || _die "no ssh client on tbona?"
	command -v node >/dev/null || _die "no node in this shell"

	local box f
	# Graveyard previous outputs: merge's input glob also matches the OLD official
	# file and stale corpora — leftovers from a previous map era must never enter a
	# fresh pool (observed contamination 2026-09-23). Moved, never deleted (house law).
	local arch="${DIR}/.graveyard-$(date +%s)"
	mkdir -p "$arch"
	for f in "${DIR}"/gauntlet-tasks*.json; do
		[ -e "$f" ] || continue
		_log "graveyard: $(basename "$f") -> $arch"
		mv "$f" "$arch"/
	done
	for box in "$@"; do _harvest_box "${box}"; done
	for box in "$@"; do _build_box "${box}"; done

	_log "merging all corpora (local + harvested) to ${TOTAL} tasks..."
	node "$MERGE" --max "$TOTAL" || _die "merge failed"
	_log "DONE. READ ~/tmp/locatesta/gauntlet-tasks.json AND EDIT BEFORE THE JUDGE RUNS."
}

_main "$@"
