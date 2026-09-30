#!/usr/bin/env bash
# gauntlet-run.sh — the Arbitrated Gauntlet, GPU round: each seat serves, answers every
# approved task once, identity-proofed. Quality only: short geometry, production sampling.
#
# RUN FROM A TERMINAL, NO sudo:   ~/tmp/locatesta/gauntlet-run.sh
# Prereq: gauntlet-tasks.json built AND human-read (gauntlet-corpus.mjs). Iron rule: production
# restored on EVERY exit path. Boot-fail on a challenger = that seat is DEAD (FIT-CHK law),
# never a campaign abort; only baseline F failing aborts.
# Rollback of anything: nothing deleted — drop-in pattern, same as the door campaigns.
set -u

readonly HOME_DIR="${HOME}/tmp/locatesta"
readonly UNIT="llama-server.service"
readonly PORT=11311
readonly ART_DIR="${HOME_DIR}/gauntlet-artifacts"
readonly RESULTS="${HOME_DIR}/gauntlet-results.jsonl"
readonly TASKS="${HOME_DIR}/gauntlet-tasks.json"
readonly GAUNT_CTX="${GAUNT_CTX:-65536}"
readonly BOOT_WAIT_S="${BOOT_WAIT_S:-1200}"
# A drop-in dir is named after the UNIT AS WRITTEN ("llama-server.service" → "llama-server.service.d").
# UNIT already carries the ".service" suffix; appending ".service.d" minted "llama-server.service.service.d",
# a directory systemd never reads — every "config change" silently no-op'd and every seat served production
# (observed 2026-09-24: the whole GPU round ran on one brain, only the identity proof noticed).
readonly DROPIN_NAME="${UNIT%.service}.service.d"
if [ "$(id -u)" = 0 ]; then readonly DROPIN_DIR="/etc/systemd/system/${DROPIN_NAME}"; else readonly DROPIN_DIR="${HOME}/.config/systemd/user/${DROPIN_NAME}"; fi
readonly DROPIN="${DROPIN_DIR}/10-gauntlet.conf"

readonly UTIL="${HOME_DIR}/doors-util.sh"
# shellcheck source=./doors-util.sh
source "$UTIL"

declare -a SEAT_NAMES=(F G H I)
declare -A SEAT_DESC=(
	[F]="production baseline: Qwen3.8-Flash-Next, production argv AS-IS"
	[G]="Qwen3.6-35B-A3B vanilla, UD-Q5_K_M, -ngl 99"
	[H]="Qwen3.8-27B dense, UD-Q6_K — the August anecdote's own witness"
	[I]="KAT-Coder-v2.5-dev q6_k — the tuning-vs-vanilla question"
)
declare -A SEAT_FILE=(
	[G]="${HOME}/models/Qwen3.6-35B-A3B-UD-Q5_K_M.gguf"
	[H]="${HOME}/models/Qwen3.8-27B-Q6_K.gguf"
	[I]="${HOME}/models/kat-coder-v2.5-dev-q6_k.gguf"
)
declare -A SEAT_ALIAS=([F]=Qwen38-Flash-Next [G]=Qwen36-35B-A3B [H]=Qwen38-27B-Dense [I]=KAT-Coder-v25)
declare -A WANT_SUBSTR=([F]="Flash" [G]="35B-A3B" [H]="Qwen3.8-27B" [I]="kat-coder")
declare -A DEAD=([F]=0 [G]=0 [H]=0 [I]=0)

declare -a ORIG_ARGV=()
NODE="" CURRENT_CONFIG="" MAIN_PID="" RESTORED=0

#############################################################################

_mechanism_proof() { # NAME — served brain must BE the candidate. One JSON per stdin —
	# NEVER a delimiter join: the /props chat_template carries 190+ '|' chars (run-2 lesson).
	local name=$1 props v1models idline psn msn ok=nomatch
	props=$(curl -sf "http://127.0.0.1:${PORT}/props" 2>/dev/null || true)
	v1models=$(curl -sf "http://127.0.0.1:${PORT}/v1/models" 2>/dev/null || true)
	psn=$(printf '%s' "$props" | "$NODE" -e 'let s="";try{const P=JSON.parse(require("fs").readFileSync(0,"utf8"));s=((P.model_alias||"")+" "+(P.modelpath||P.model_path||"")).trim()}catch{};console.log(s)' 2>/dev/null || true)
	msn=$(printf '%s' "$v1models" | "$NODE" -e 'let s="";try{const M=JSON.parse(require("fs").readFileSync(0,"utf8"));for(const d of (M.data||[]))s+=" "+(d.id||"")}catch{};console.log(s.trim())' 2>/dev/null || true)
	idline=$(printf '%s %s' "$psn" "$msn" | sed 's/^ *//;s/  */ /g;s/ *$//')
	printf '%s' "$idline" | grep -qi -- "${WANT_SUBSTR[$name]}" && ok=match
	_log "mechanism ${name}: served=[${idline:-unreadable}] want='${WANT_SUBSTR[$name]}' => ${ok}"
	printf '{"seat":"%s","type":"mechanism","served":"%s","ok":%s}\n' \
		"$name" "${idline:-unreadable}" "$([ "$ok" = match ] && echo true || echo false)" >> "$RESULTS"
	[ "$ok" = match ] && return 0
	if [ "$name" = F ]; then _die "baseline F identity FAIL — cannot tell which brain is serving; aborting"; fi
	return 1
}

_build_exec_line() { # NAME -> global BUILT_EXEC
	local name=$1
	BUILT_EXEC=""
	local tok st=0
	for tok in "${ORIG_ARGV[@]}"; do
		if [ "$st" = 1 ]; then st=0; continue; fi
		if [ "$name" = F ]; then
			BUILT_EXEC+="$(printf '%q ' "$tok")"
			continue
		fi
		# challenger rewrites: own model, full offload, short gauntlet geometry, own alias;
		# the qwen3.8-template flags do not belong on other brains
		case "$tok" in
			-m)       BUILT_EXEC+="-m $(printf '%q ' "${SEAT_FILE[$name]}") "; st=1; continue ;;
			-ngl)     BUILT_EXEC+="-ngl 99 "; st=1; continue ;;
			-c)       BUILT_EXEC+="-c ${GAUNT_CTX} "; st=1; continue ;;
			--alias)  BUILT_EXEC+="--alias ${SEAT_ALIAS[$name]} "; st=1; continue ;;
			--chat-template-file|--reasoning-format) st=1; continue ;;
			--reasoning-preserve) continue ;;
			*) BUILT_EXEC+="$(printf '%q ' "$tok") " ;;
		esac
	done
}

_apply_config() { # NAME — drop-in swap, restart, prove identity
	local name=$1
	CURRENT_CONFIG=$name
	_log "==== SEAT ${name}: ${SEAT_DESC[$name]} ===="
	mkdir -p "$DROPIN_DIR"
	_build_exec_line "$name"
	{
		echo "# gauntlet config ${name} — $(date '+%F %T')"
		echo "[Service]"
		echo "ExecStart="
		echo "ExecStart=${BUILT_EXEC}"
	} > "$DROPIN"
	$UNITCTL daemon-reload
	$UNITCTL restart "$UNIT"
	if ! _wait_ready; then
		if [ "$name" = F ]; then _die "baseline F never came ready (${BOOT_WAIT_S}s) — production itself won't boot; campaign aborts"; fi
		DEAD[$name]=1
		_log "FIT-CHK FAIL: ${name} never came ready (${BOOT_WAIT_S}s) — the brain cannot serve on tbona; that is itself an answer. Continuing."
		printf '{"seat":"%s","type":"boot","dead":"never-ready"}\n' "$name" >> "$RESULTS"
		return 1
	fi
	MAIN_PID=$($UNITCTL show -p MainPID --value "$UNIT")
	if ! _mechanism_proof "$name"; then
		DEAD[$name]=1
		_log "challenger ${name} marked DEAD (identity mismatch) — continuing without it"
		printf '{"seat":"%s","type":"mechanism","dead":"mismatch"}\n' "$name" >> "$RESULTS"
		return 1
	fi
	_warmup
	return 0
}

_run_seat() { # NAME — answer every approved task, once
	local name=$1
	if [ "${DEAD[$name]}" = 1 ]; then _log "seat ${name} DEAD — skipping answering"; return 0; fi
	local out="${ART_DIR}/answers-${name}.jsonl"
	local have=0
	[ -f "$out" ] && have=$(grep -c '"answer"' "$out" || true)
	_log "seat ${name}: answering tasks (${have} already done, resumable)"
	"$NODE" "${HOME_DIR}/gauntlet-answer.mjs" --seat "$name" \
		--url "http://127.0.0.1:${PORT}" --tasks "$TASKS" --out "$out" \
		|| _log "responder for ${name} exited nonzero — rerun me, it resumes"
	local answered failed
	answered=$(grep -c '"answer"' "$out" || true)
	failed=$(grep -c '"error"' "$out" || true)
	printf '{"seat":"%s","type":"answers","answered":%s,"failed":%s}\n' "$name" "${answered:-0}" "${failed:-0}" >> "$RESULTS"
	_log "seat ${name}: answered=${answered:-0} failed=${failed:-0} -> ${out}"
}

_sockets() { # PORT -> one line per established socket, ss's TCP-info continuation joined in
	# ss -ti wraps each socket onto a second indented line; without joining, the parser reads
	# the stats line as its own socket and every counter lands on the wrong peer.
	ss -tni state established "( dport = :${1} )" 2>/dev/null | tail -n +2 \
		| awk '/^[^ \t]/ { if (rec) print rec; rec = $0; next } { if (rec) rec = rec " " $0 } END { if (rec) print rec }'
}

_quiet_split() { # PORT -> "idle busy" — a socket counts as busy only if it MOVED DATA
	# Two samples QUIET_SAMPLE_S apart. `ss -tni` carries per-socket bytes_acked; a socket whose
	# counter moved (or whose queues are non-empty) is generating. Everything else is an idle
	# keep-alive and is NOT contamination — a portal tab holding a socket open used to stop a
	# whole GPU round, which taught the instrument nothing.
	local port=$1 f1 f2 pair
	f1=$(mktemp); f2=$(mktemp)
	_sockets "${port}" >"$f1"
	sleep "${QUIET_SAMPLE_S:-5}"
	_sockets "${port}" >"$f2"
	# Sentinel line in BOTH files: awk's FNR==NR trick cannot tell an empty first file from a
	# missing one, and an empty sample (nobody connected) would otherwise be graded from itself.
	printf 'SENTINEL 0 0 x y z\n' >>"$f1"
	printf 'SENTINEL 0 0 x y z\n' >>"$f2"
	pair=$(awk '
		function ack(s) { if (match(s, /bytes_acked:[0-9]+/)) return substr(s, RSTART + 12, RLENGTH - 12) + 0; return -1 }
		$1 == "SENTINEL" { next }
		FNR == NR { if (NF >= 5) a1[$4 " " $5] = ack($0); next }
		NF < 5 { next }
		{
			k = $4 " " $5
			if (!(k in a1)) { i++; next }                      # connected between samples: no baseline
			if (a1[k] >= 0 && ack($0) > a1[k]) b++             # counter moved: someone is generating
			else if ($2 + 0 > 0 || $3 + 0 > 0) b++             # data queued: generating, other way
			else i++
		}
		END { printf "%d %d", i + 0, b + 0 }
	' "$f1" "$f2")
	rm -f "$f1" "$f2"
	echo "${pair:-0 0}"
}

_on_exit() {
	local rc=$?
	trap - EXIT
	if [ -n "$CURRENT_CONFIG" ] && [ "$CURRENT_CONFIG" != "" ]; then
		_restore_production
	fi
	exit $rc
}

#############################################################################

_main() {
	trap '_on_exit' EXIT
	trap 'exit 130' INT
	trap 'exit 143' TERM

	[ "$(id -u)" != 0 ] || _die "user-unit era — run me WITHOUT sudo"
	$UNITCTL is-active --quiet "$UNIT" || _die "unit ${UNIT} is not active — nothing to run on"
	[ -f "$TASKS" ] || _die "no task corpus at ${TASKS} — run gauntlet-corpus.mjs and READ it first"

	NODE=$(bash -lc 'command -v node' | tail -1)
	[ -x "$NODE" ] || _die "could not resolve node inside my own login shell"

	local ntasks
	ntasks=$("$NODE" -e 'const t=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log(t.tasks.length)+" tasks, built "+t.builtAt.slice(0,10)' "$TASKS")
	[ -n "$ntasks" ] || _die "task corpus unreadable"
	_log "task corpus: ${ntasks}"

	# Quiet window = nobody GENERATING, not "somebody has a socket". A persistent keep-alive
	# (a portal, a browser tab, the orchestrating session's own idle connection) is idle bytes
	# and cannot contaminate a measurement; only traffic moved during the sample can. So sample
	# the sockets twice and ask whether any of them actually carried data.
	command -v ss >/dev/null && {
		local idle busy
		read idle busy < <(_quiet_split "${PORT}")
		if [ "${busy:-0}" -gt 0 ]; then
			_log "NOT-QUIET-WINDOW: ${busy} connection(s) on :${PORT} moved data in the sample window — someone is generating:"
			ss -tnp state established "( dport = :${PORT} )" | tail -n +2
			_ask "run anyway (answers will carry load contamination)?" N && : || _die "kill the clients first, then re-run me"
		elif [ "${idle:-0}" -gt 0 ]; then
			_log "quiet: ${idle} idle keep-alive connection(s) on :${PORT}, no traffic in the sample — not contamination"
		fi
	}

	local pid
	pid=$($UNITCTL show -p MainPID --value "$UNIT")
	mapfile -d '' -t ORIG_ARGV < "/proc/${pid}/cmdline"
	[ "${#ORIG_ARGV[@]}" -gt 1 ] || _die "captured ${#ORIG_ARGV[@]} argv tokens from pid ${pid} — looks wrong"
	_log "captured production argv: ${#ORIG_ARGV[@]} tokens (argv[0]=${ORIG_ARGV[0]})"

	MAIN_PID=$pid
	mkdir -p "$ART_DIR"
	_log "runtime: $("$NODE" -v) at ${NODE}"

	local missing="" name
	for name in G H I; do [ -e "${SEAT_FILE[$name]}" ] || missing+=" ${SEAT_FILE[$name]}"; done
	[ -z "$missing" ] || _die "candidate files missing:${missing}"

	touch "$RESULTS"
	_log "plan: seats F G H I answer ${ntasks%% *} tasks each, short geometry (-c ${GAUNT_CTX}), production sampling."
	_log "≈4 boots + 1 short generation per task per seat. Production restored on every exit."
	_ask "proceed?" N && : || _die "then the anecdote stays an anecdote"

	# seat stays up while it answers; the iron-rule restore in _on_exit lands production back on F
	for name in "${SEAT_NAMES[@]}"; do
		if _apply_config "$name"; then _run_seat "$name"; fi
	done

	# final state: already on F via the loop's last re-apply; mark restored
	_log "GAUNTLET GPU ROUND COMPLETE — scoreboard waits for the arbiter:"
	_log "  1. read ${TASKS} (edit freely, it is the send-set)"
	_log "  2. read the answers in ${ART_DIR}/answers-*.jsonl"
	_log "  3. judge from a terminal: ~/tmp/locatesta/gauntlet-judge.mjs  (spends the Typesafe wallet)"
	exit 0
}

_main "$@"
