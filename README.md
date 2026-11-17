# Gastos

App de controle financeiro pessoal feito com Expo (React Native). Registre gastos e entradas, acompanhe o saldo do mês e veja gráficos por categoria. Funciona em Android, iOS e web.

## Funcionalidades

- **Resumo**: cartão com saldo do mês (gradiente), gráfico em rosca por categoria e barras dos últimos 6 meses.
- **Lançamentos**: lista agrupada por dia, com busca e filtros.
- **Novo lançamento**: botão flutuante, com campo de valor com máscara de moeda.
- **Categorias separadas** para gastos (Comida, Transporte, Moradia, Lazer, Saúde, Compras) e entradas (Salário, Renda extra, Investimentos, Presente), além de "Outros".
- **Ajustes**: tema Sistema/Claro/Escuro e backup (exportar e importar em JSON).
- Dados guardados localmente no aparelho (SQLite); nada é enviado para servidor.

## Tecnologias

- [Expo](https://expo.dev) SDK 58 + [expo-router](https://docs.expo.dev/router/introduction/)
- React 19 / React Native 0.88
- expo-sqlite (armazenamento local; versão web separada em `*.web.ts`)
- react-native-svg (gráficos) e expo-linear-gradient
- TypeScript, ESLint
- pnpm

## Como rodar

```bash
pnpm install
pnpm start        # abre o Expo; escaneie o QR code no Expo Go
```

Atalhos:

```bash
pnpm android      # emulador/dispositivo Android
pnpm ios          # simulador iOS (macOS)
pnpm web          # navegador
```

Verificações:

```bash
pnpm typecheck
pnpm lint
```

## Estrutura

```
src/
├── app/              # rotas (expo-router)
│   ├── (tabs)/       # Resumo (index), Lançamentos, Ajustes
│   └── novo.tsx      # tela de novo lançamento
├── components/       # Charts, EntryRow, Fab, MonthBar, theme
├── lib/              # repositório SQLite, dinheiro, backup/parse
│   └── *.web.ts      # implementações para a web
└── state/            # AppContext e tipos (Entry, categorias)
```

## Backup

Em **Ajustes** é possível exportar os lançamentos para um arquivo JSON (`gastos-backup-AAAA-MM-DD.json`) e importá-lo depois. Valores são guardados em centavos, sempre positivos, com o tipo (`expense` ou `income`) indicando se é gasto ou entrada. Itens inválidos no arquivo são ignorados na importação.
