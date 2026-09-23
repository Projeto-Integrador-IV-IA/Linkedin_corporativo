#!/usr/bin/env bash
# Evidência do fluxo completo do MVP do Talent Match: login -> cadastro de vaga -> recomendação.
#
# Pré-requisitos: ambiente no ar via `docker compose up --build` e `curl` instalado.
# Não altera volumes/dados permanentes (a vaga criada fica registrada no project-db).
#
# Uso: ./scripts/demo.sh [base_url]
set -euo pipefail

BASE_URL="${1:-http://localhost:8080}"
PRETTY=$(command -v jq >/dev/null 2>&1 && echo "jq ." || echo "cat")

step() {
    echo
    echo "=== $1 ==="
}

step "1) Login com colaborador de demonstração (ana.souza@talentmatch.com / senha123)"
LOGIN_RESPONSE=$(curl -sf -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"ana.souza@talentmatch.com","password":"senha123"}')
echo "$LOGIN_RESPONSE" | eval "$PRETTY"

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

step "2) Listar colaboradores cadastrados (GET /api/profiles)"
curl -sf "$BASE_URL/api/profiles" -H "Authorization: Bearer $TOKEN" | eval "$PRETTY"

step "3) Cadastrar uma nova vaga (POST /api/projects)"
CREATE_RESPONSE=$(curl -sf -X POST "$BASE_URL/api/projects" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "title": "Desenvolvedor(a) Backend Java - Demo",
      "description": "Vaga criada pelo script de demonstração do MVP.",
      "requiredSkills": ["Java", "Spring Boot", "Docker", "SQL"]
    }')
echo "$CREATE_RESPONSE" | eval "$PRETTY"

PROJECT_ID=$(echo "$CREATE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

step "4) Recomendar candidatos para a vaga criada (POST /api/matches/recommend/$PROJECT_ID)"
curl -sf -X POST "$BASE_URL/api/matches/recommend/$PROJECT_ID" \
    -H "Authorization: Bearer $TOKEN" | eval "$PRETTY"

step "5) Tentar acessar uma rota protegida sem token (deve retornar 401)"
curl -s -o /dev/null -w "HTTP status: %{http_code}\n" "$BASE_URL/api/profiles"

echo
echo "Fluxo completo executado com sucesso."
