#!/bin/bash	
	
_load_ollama_model_main() {
	local model=${1-gemma4-qat:26b} ; shift
	local keep_alive=${1--1}        ; shift
	local num_ctx=${1-65536}        ; shift
	local prompt=${1-""}            ; shift

	curl http://localhost:11434/api/generate -d \
	'{ "model": "'${model}'", "keep_alive": '${keep_alive}', "options": {"num_ctx": '${num_ctx}' }, "prompt": "'${prompt}'" }'
}

_load_ollama_model_main ${*}
