# Avaliação do ranker híbrido v4 — 2026-11-05

## Decisão

O `hybrid-semantic-ranker-v4` foi aprovado nos gates automatizados e publicado
no ambiente Docker local do projeto. O serviço está pronto somente quando o
ranker lexical e o encoder semântico estão carregados. O score exibido ao
recrutador é um índice de aderência de 0 a 100 pontos, não uma probabilidade de
contratação.

O resultado sustenta uso em apresentação e como apoio à triagem. Ele ainda não
substitui avaliação humana e deve ser monitorado com decisões reais e
consentidas antes de ser usado em processos seletivos de maior impacto.

## Configuração publicada

| Item | Valor |
|---|---|
| Versão do runtime | `hybrid-semantic-ranker-v4` |
| Sinal lexical | `description-ranker-v3`, peso 30% |
| Sinal semântico | `intfloat/multilingual-e5-small`, peso 70% |
| Revisão semântica | `614241f622f53c4eeff9890bdc4f31cfecc418b3` |
| Runtime | ONNX Runtime em CPU |
| Modelo ONNX SHA-256 | `dd476dd0c2514e9b9be83aeb3853fac0763e0bdf4a71645407587d77c48a2d88` |
| Tokenizer SHA-256 | `0b44a9d7b51c3c62626640cda0e2c2f70fdacdc25bbbd68038369d14ebdf4c39` |
| Cache | LRU limitado a 10.000 textos |
| Falha de carregamento | readiness 503; inferência bloqueada |

Os artefatos semânticos são baixados em revisão fixa, validados por hash no
build e incorporados à imagem. A inferência não depende de API externa.

## Gate direto na imagem de produção

O comando abaixo avaliou cinco áreas principais e um holdout independente de
três áreas, diretamente no endpoint publicado:

```bash
python ml/evaluation/validate_ranker_quality.py \
  --predict-url http://localhost:8000/predict
```

Todos os gates passaram, sem falhas.

| Métrica | Principal (5 áreas) | Holdout (3 áreas) |
|---|---:|---:|
| Top-1 correto | 100% | 100% |
| NDCG@5 | 0,9612 | 0,9845 |
| NDCG@10 | 0,9682 | 0,9845 |
| Correlação de Spearman | 0,6972 | 0,7396 |
| Acurácia par-a-par | 0,9183 | 0,9770 |
| Precisão@3 para relevância >= 2 | 66,67% | 77,78% |
| Maior score de irrelevante | 51,84 | 41,36 |
| Menor score de altamente relevante | 48,76 | 37,19 |

O holdout contém segurança da informação, controladoria/finanças e sucesso do
cliente. Esses exemplos não participaram da seleção dos pesos ou limites.

## Teste completo pela aplicação

O script `ml/evaluation/evaluate_live_recommendations.py` criou 16 profissionais,
cinco recrutadores e cinco vagas temporárias. As requisições passaram por
cadastro e autenticação, Gateway, bancos, Profile Service, Project Service,
Match Orchestrator e ML Engine. Cada ranking foi repetido cinco vezes.

Identificador da execução final: `20261105204554-274c60`.

| Métrica | Resultado v4 |
|---|---:|
| Top-1 correto | 5/5 (100%) |
| NDCG@5 médio | 0,9612 |
| NDCG@10 médio | 0,9682 |
| Spearman médio | 0,6972 |
| Acurácia par-a-par | 0,9183 |
| Precisão@3 para relevância >= 2 | 66,67% |
| Delta máximo entre repetições | 0,00 ponto |
| Latência mediana | 44,38 ms |
| Latência p95 | 72,56 ms |
| Filtro de interessados | aprovado |
| Filtro de score mínimo | aprovado |
| Limite de resultados | aprovado |
| Erros de limpeza | 0 |

Depois da execução, perfis e projetos foram removidos pela API e as 21 contas
temporárias foram removidas do banco. A consulta de confirmação encontrou zero
contas e zero projetos restantes com o identificador da execução.

### Concorrência do ML Engine

Um teste curto enviou 200 inferências de 16 candidatos, com concorrência 8,
contra o container publicado. Não houve erro ou resposta incompleta. O runtime
processou 98,57 requisições por segundo, com p50 de 76,30 ms, p95 de 123,46 ms
e máximo de 147,95 ms. Este é um teste local de estabilidade, não uma previsão
de capacidade para outra infraestrutura.

## Comparação com o baseline lexical v3

| Métrica E2E | v3 lexical | v4 híbrido | Variação |
|---|---:|---:|---:|
| NDCG@5 | 0,8930 | 0,9612 | +0,0682 |
| NDCG@10 | 0,9292 | 0,9682 | +0,0390 |
| Spearman | 0,4809 | 0,6972 | +0,2163 |
| Acurácia par-a-par | 0,7776 | 0,9183 | +0,1407 |
| Maior score irrelevante | 68,91 | 51,84 | -17,07 pontos |
| Menor score altamente relevante | 28,41 | 48,76 | +20,35 pontos |
| Latência p95 | 67,7 ms | 72,6 ms | +4,9 ms |

O falso positivo mais crítico do v3 repetia palavras da vaga enquanto negava
ter as competências e recebia 68,91. No v4, os cenários equivalentes ficaram
entre 8,83 e 26,85. A paráfrase relevante mais difícil subiu de 28,41 para
48,76 no cenário principal.

## Alternativas avaliadas

Também foi avaliado um reranker multilíngue do tipo cross-encoder. Ele aumentou
a latência para aproximadamente 371 ms por requisição principal e reduziu o
NDCG nos cenários controlados. Por isso, não foi incluído na versão publicada.

## Pontos para revisão humana

1. **UX ainda é a área mais difícil.** O NDCG@5 foi 0,9083 e um perfil de
   design gráfico relevante ficou atrás de textos genéricos com linguagem de
   pesquisa. Vale ampliar exemplos reais de UX e design.
2. **Paráfrases muito abstratas podem receber score moderado.** Os exemplos de
   finanças e sucesso do cliente tiveram 37,19 e 43,57. O ranking ficou correto,
   mas um filtro mínimo alto pode ocultá-los.
3. **Use 50 pontos como filtro inicial, não como regra de reprovação.** Há
   sobreposição entre os extremos dos rótulos humanos; o valor é útil para a
   apresentação, mas casos abaixo dele ainda merecem busca e revisão.
4. **Colete feedback explícito.** Aceite, rejeição e interesse devem ser
   analisados por área, desde que haja consentimento, para descobrir deriva e
   recalibrar o sistema.
5. **Não transformar score em decisão automática.** O modelo só observa os
   textos fornecidos. Ele não comprova experiência, senioridade, disponibilidade
   ou qualidade do trabalho e não deve inferir atributos sensíveis.

## Rotina recomendada de produção

- executar o gate de qualidade em toda mudança de modelo, pesos ou tokenizer;
- monitorar readiness, latência p50/p95, taxa de erro e distribuição dos scores;
- alertar para saturação, mudança brusca da distribuição e crescimento do cache;
- revisar amostras por área profissional e não apenas a média global;
- manter a versão do modelo e os hashes nos registros de implantação;
- só retreinar após criar um conjunto de validação temporal com decisões reais
  auditadas e separado do conjunto de treino.
